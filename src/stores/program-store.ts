import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth-store';
import {
  ActiveUserProgram,
  DraftDay,
  Program,
  ProgramDayWithExercises,
  ProgramExerciseRow,
} from '../types/program';

function resolveSelectedProgramId(
  programs: ActiveUserProgram[],
  preferredId?: string | null,
): string | null {
  if (preferredId && programs.some((program) => program.id === preferredId)) {
    return preferredId;
  }
  return programs[0]?.id ?? null;
}

interface ProgramStore {
  myPrograms: Program[];
  publicPrograms: Program[];
  activeUserPrograms: ActiveUserProgram[];
  selectedActiveProgramId: string | null;
  loading: boolean;

  fetchMyPrograms: () => Promise<void>;
  fetchPublicPrograms: () => Promise<void>;
  fetchActiveProgram: () => Promise<void>;
  setSelectedActiveProgramId: (userProgramId: string | null) => void;
  fetchProgramDays: (programId: string) => Promise<ProgramDayWithExercises[]>;
  fetchProgramDayExercises: (programId: string, dayNumber: number) => Promise<ProgramExerciseRow[]>;
  createProgram: (draft: {
    name: string;
    description: string;
    is_public: boolean;
    duration_weeks: number;
    days_per_week: number;
    days: DraftDay[];
  }) => Promise<Program>;
  enrollProgram: (programId: string) => Promise<void>;
  unenrollProgram: (userProgramId: string) => Promise<void>;
  advanceDay: (userProgramId: string, daysPerWeek: number) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  fetchUserTMs: (userProgramId: string) => Promise<Record<string, number>>;
  saveUserTMs: (userProgramId: string, userId: string, tms: Record<string, number>) => Promise<void>;
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  myPrograms: [],
  publicPrograms: [],
  activeUserPrograms: [],
  selectedActiveProgramId: null,
  loading: false,

  fetchMyPrograms: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    set({ myPrograms: (data ?? []) as Program[] });
  },

  fetchPublicPrograms: async () => {
    const userId = useAuthStore.getState().user?.id;
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);
    // Show all public programs (including own) in explore tab
    set({ publicPrograms: (data ?? []) as Program[] });
  },

  fetchActiveProgram: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({
        activeUserPrograms: [],
        selectedActiveProgramId: null,
      });
      return;
    }

    const { data } = await supabase
      .from('user_programs')
      .select('*, program:programs(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false });

    const programs = ((data ?? []).filter((item: any) => item.program) as unknown[]) as ActiveUserProgram[];
    const selectedActiveProgramId = resolveSelectedProgramId(
      programs,
      get().selectedActiveProgramId,
    );

    set({
      activeUserPrograms: programs,
      selectedActiveProgramId,
    });
  },

  setSelectedActiveProgramId: (userProgramId) => {
    set((state) => ({
      selectedActiveProgramId: resolveSelectedProgramId(
        state.activeUserPrograms,
        userProgramId,
      ),
    }));
  },

  fetchProgramDays: async (programId) => {
    const { data } = await supabase
      .from('program_days')
      .select('*, program_exercises(*, exercises(*))')
      .eq('program_id', programId)
      .order('day_number');

    return (data ?? []) as unknown as ProgramDayWithExercises[];
  },

  fetchProgramDayExercises: async (programId, dayNumber) => {
    const { data: day } = await supabase
      .from('program_days')
      .select('id')
      .eq('program_id', programId)
      .eq('day_number', dayNumber)
      .maybeSingle();

    if (!day) return [];

    const { data: exercises } = await supabase
      .from('program_exercises')
      .select('*, exercises(*)')
      .eq('program_day_id', day.id)
      .order('order_index');

    return (exercises ?? []) as unknown as ProgramExerciseRow[];
  },

  createProgram: async (draft) => {
    const userId = useAuthStore.getState().user?.id;
    const userEmail = useAuthStore.getState().user?.email;
    if (!userId) throw new Error('로그인이 필요합니다.');

    const creatorName = userEmail?.split('@')[0] ?? '익명';

    const { data: program, error: progErr } = await supabase
      .from('programs')
      .insert({
        user_id: userId,
        creator_name: creatorName,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        is_public: draft.is_public,
        duration_weeks: draft.duration_weeks,
        days_per_week: draft.days_per_week,
      })
      .select()
      .single();

    if (progErr || !program) throw new Error(progErr?.message ?? '프로그램 생성 실패');

    for (const day of draft.days) {
      const { data: programDay, error: dayErr } = await supabase
        .from('program_days')
        .insert({
          program_id: program.id,
          day_number: day.day_number,
          name: day.name.trim() || `Day ${day.day_number}`,
        })
        .select('id')
        .single();

      if (dayErr || !programDay) continue;

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        let exerciseId = ex.exercise_db_id;

        if (!exerciseId) {
          // built-in 종목은 user_id=null로 저장해야 다른 유저도 읽을 수 있음
          const ownerId = ex.is_custom ? userId : null;

          // 이미 같은 이름의 종목이 있으면 재사용 (중복 방지)
          const { data: existing } = await supabase
            .from('exercises')
            .select('id')
            .eq('name_ko', ex.name_ko)
            .or(`user_id.eq.${userId},user_id.is.null`)
            .maybeSingle();

          if (existing?.id) {
            exerciseId = existing.id;
          } else {
            const { data: insertedEx } = await supabase
              .from('exercises')
              .insert({
                name_ko: ex.name_ko,
                name_en: ex.name_en,
                category: ex.category,
                default_rest_seconds: ex.default_rest_seconds,
                is_custom: ex.is_custom,
                user_id: ownerId,
              })
              .select('id')
              .single();
            exerciseId = insertedEx?.id ?? null;
          }
        }

        if (!exerciseId) continue;

        await supabase.from('program_exercises').insert({
          program_day_id: programDay.id,
          exercise_id: exerciseId,
          order_index: i,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_weight_kg: ex.target_weight_kg,
        });
      }
    }

    await get().fetchMyPrograms();
    return program as Program;
  },

  enrollProgram: async (programId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    await supabase.from('user_programs').upsert(
      {
        user_id: userId,
        program_id: programId,
        current_day: 1,
        completed_sessions: 0,
        is_active: true,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,program_id' },
    );

    await get().fetchActiveProgram();
    const enrolledProgram = get().activeUserPrograms.find((item) => item.program_id === programId);
    if (enrolledProgram) {
      set({ selectedActiveProgramId: enrolledProgram.id });
    }
  },

  unenrollProgram: async (userProgramId) => {
    await supabase
      .from('user_programs')
      .update({ is_active: false })
      .eq('id', userProgramId);
    set((state) => {
      const activeUserPrograms = state.activeUserPrograms.filter((program) => program.id !== userProgramId);
      return {
        activeUserPrograms,
        selectedActiveProgramId: resolveSelectedProgramId(
          activeUserPrograms,
          state.selectedActiveProgramId === userProgramId ? null : state.selectedActiveProgramId,
        ),
      };
    });
  },

  advanceDay: async (userProgramId, daysPerWeek) => {
    const current = get().activeUserPrograms.find((program) => program.id === userProgramId);
    if (!current) return;

    const nextDay = current.current_day >= daysPerWeek ? 1 : current.current_day + 1;
    const completedSessions = current.completed_sessions + 1;

    await supabase
      .from('user_programs')
      .update({ current_day: nextDay, completed_sessions: completedSessions })
      .eq('id', userProgramId);

    set((state) => ({
      activeUserPrograms: state.activeUserPrograms.map((program) =>
        program.id === userProgramId
          ? {
              ...program,
              current_day: nextDay,
              completed_sessions: completedSessions,
            }
          : program
      ),
    }));
  },

  deleteProgram: async (programId) => {
    await supabase.from('programs').delete().eq('id', programId);
    set((state) => {
      const activeUserPrograms = state.activeUserPrograms.filter((program) => program.program_id !== programId);
      return {
        myPrograms: state.myPrograms.filter((p) => p.id !== programId),
        publicPrograms: state.publicPrograms.filter((p) => p.id !== programId),
        activeUserPrograms,
        selectedActiveProgramId: resolveSelectedProgramId(
          activeUserPrograms,
          state.selectedActiveProgramId,
        ),
      };
    });
  },

  fetchUserTMs: async (userProgramId) => {
    const { data } = await supabase
      .from('user_program_tms')
      .select('exercise_key, tm_kg')
      .eq('user_program_id', userProgramId);
    const result: Record<string, number> = {};
    (data ?? []).forEach((row: any) => {
      result[row.exercise_key] = row.tm_kg;
    });
    return result;
  },

  saveUserTMs: async (userProgramId, userId, tms) => {
    const rows = Object.entries(tms).map(([key, val]) => ({
      user_program_id: userProgramId,
      user_id: userId,
      exercise_key: key,
      tm_kg: val,
    }));
    if (rows.length === 0) return;
    const { error } = await supabase
      .from('user_program_tms')
      .upsert(rows, { onConflict: 'user_program_id,exercise_key' });
    if (error) throw error;
  },
}));
