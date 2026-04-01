import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth-store';
import { Exercise, LocalSet, NsunsAmrapResult, SessionExercise, SessionSummary } from '../types/workout';
import { WorkoutExercise } from './ai-plan-store';
import { ProgramExerciseRow } from '../types/program';
import {
  detectNsunsPattern,
  getNsunsSets,
  getTmKey,
  isUpperBody,
  NsunsPattern,
  roundToPlate,
  suggestTmIncrease,
} from '../lib/nsuns';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export interface ProgramContext {
  userProgramId: string;
  daysPerWeek: number;
  currentDay: number;
}

interface WorkoutStore {
  sessionId: string | null;
  sessionExercises: SessionExercise[];
  startedAt: number | null;
  restEndsAt: number | null;
  activeRestExerciseIndex: number | null;
  saving: boolean;
  title: string;
  notes: string;
  programContext: ProgramContext | null;
  nsunsTms: Record<string, number> | null;

  startSession: () => Promise<void>;
  startFromProgram: (exercises: ProgramExerciseRow[], userProgramId: string, daysPerWeek: number, currentDay: number, tms?: Record<string, number>) => Promise<void>;
  startFromAIPlan: (exercises: WorkoutExercise[]) => Promise<void>;
  addExercise: (exercise: Exercise) => Promise<void>;
  addNsunsExercise: (exercise: Exercise, pattern: NsunsPattern, tm: number) => void;
  addSet: (exerciseIndex: number) => void;
  addWarmupSet: (exerciseIndex: number) => void;
  updateSetField: (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight_kg' | 'reps',
    value: number,
  ) => void;
  completeSet: (exerciseIndex: number, setIndex: number) => Promise<void>;
  uncompleteSet: (exerciseIndex: number, setIndex: number) => void;
  skipRest: () => void;
  adjustRest: (delta: number) => void;
  finishSession: () => Promise<SessionSummary>;
  resetSession: () => void;
  removeExercise: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  setTitle: (t: string) => void;
  setNotes: (n: string) => void;
  setExerciseNote: (exerciseIndex: number, note: string) => void;
  setExerciseRestSeconds: (exerciseIndex: number, seconds: number | null) => void;
  updateExerciseName: (exerciseIndex: number, newName: string) => void;
}

function makeDefaultTitle(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${month}월 ${day}일 운동`;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  sessionId: null,
  sessionExercises: [],
  startedAt: null,
  restEndsAt: null,
  activeRestExerciseIndex: null,
  saving: false,
  title: makeDefaultTitle(),
  notes: '',
  programContext: null,
  nsunsTms: null,

  startSession: async () => {
    set({ startedAt: Date.now(), sessionExercises: [], title: makeDefaultTitle(), notes: '', sessionId: null });

    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (error) {
      console.error('[startSession] insert failed:', error.message, error.code);
      return;
    }
    if (data) {
      set({ sessionId: data.id });
    }
  },

  startFromProgram: async (programExercises, userProgramId, daysPerWeek, currentDay, tms?) => {
    set({ programContext: { userProgramId, daysPerWeek, currentDay }, nsunsTms: tms ?? null });
    await get().startSession();
    for (const pe of programExercises) {
      if (!pe.exercises) continue;
      const exercise: Exercise = {
        id: pe.exercises.id,
        name_ko: pe.exercises.name_ko,
        name_en: pe.exercises.name_en,
        category: pe.exercises.category,
        default_rest_seconds: pe.exercises.default_rest_seconds,
        is_custom: pe.exercises.is_custom,
        visual_guide_url: pe.exercises.visual_guide_url,
        description_en: pe.exercises.description_en,
        description_ko: pe.exercises.description_ko,
        overview_en: pe.exercises.overview_en,
        overview_ko: pe.exercises.overview_ko,
        why_en: pe.exercises.why_en,
        why_ko: pe.exercises.why_ko,
        how_en: pe.exercises.how_en,
        how_ko: pe.exercises.how_ko,
      };

      if (tms) {
        const pattern = detectNsunsPattern(pe.target_sets, pe.target_reps);
        if (pattern) {
          const tmKey = getTmKey(pe.exercises.name_ko, pe.exercises.name_en);
          const tm = tmKey ? tms[tmKey] : null;
          if (tm) {
            get().addNsunsExercise(exercise, pattern, tm);
            continue;
          }
        }
      }
      await get().addExercise(exercise);
    }
  },

  startFromAIPlan: async (aiExercises) => {
    await get().startSession();
    for (const aiEx of aiExercises) {
      const exercise: Exercise = {
        id: `local::ai-${aiEx.name}`,
        name_ko: aiEx.name,
        name_en: null,
        category: null,
        default_rest_seconds: 90,
        is_custom: false,
      };

      // Parse repsRange "8-12" → 10 (mid), "5" → 5
      const repsMatch = aiEx.repsRange.match(/^(\d+)(?:[~\-](\d+))?$/);
      const targetReps = repsMatch
        ? repsMatch[2]
          ? Math.round((parseInt(repsMatch[1], 10) + parseInt(repsMatch[2], 10)) / 2)
          : parseInt(repsMatch[1], 10)
        : 10;

      const weightKg = aiEx.weight_kg ?? 0;

      const sets: LocalSet[] = Array.from({ length: aiEx.sets }, (_, i) => ({
        localId: genId(),
        dbId: null,
        set_number: i + 1,
        weight_kg: weightKg,
        reps: targetReps,
        is_done: false,
        is_pr: false,
      }));

      set((state) => ({
        sessionExercises: [
          ...state.sessionExercises,
          { exercise, sets, prevSets: null },
        ],
      }));
    }
  },

  addNsunsExercise: (exercise, pattern, tm) => {
    const setDefs = getNsunsSets(pattern);
    const sets: LocalSet[] = setDefs.map((def, i) => ({
      localId: genId(),
      dbId: null,
      set_number: i + 1,
      weight_kg: roundToPlate(tm * def.pct),
      reps: def.targetReps,
      is_done: false,
      is_pr: false,
      isWarmup: false,
      is_amrap: def.is_amrap,
      tmPct: Math.round(def.pct * 100),
      targetReps: def.targetReps,
      isProgressionSet: def.isProgressionSet,
    }));

    set((state) => ({
      sessionExercises: [
        ...state.sessionExercises,
        { exercise, sets, prevSets: null },
      ],
    }));
  },

  addExercise: async (exercise) => {
    const firstSet: LocalSet = {
      localId: genId(),
      dbId: null,
      set_number: 1,
      weight_kg: 0,
      reps: 0,
      is_done: false,
      is_pr: false,
    };

    // Optimistically add the exercise first, then fetch prevSets
    set((state) => ({
      sessionExercises: [
        ...state.sessionExercises,
        { exercise, sets: [firstSet], prevSets: null },
      ],
    }));

    // Fetch previous session's sets for this exercise (skip local-only exercises)
    if (exercise.id.startsWith('local::')) return;

    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;

      // Find the most recent session that included this exercise
      const { data: lastSets, error } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, set_number, workout_sessions!inner(user_id, ended_at)')
        .eq('exercise_id', exercise.id)
        .eq('workout_sessions.user_id', userId)
        .not('workout_sessions.ended_at', 'is', null)
        .order('workout_sessions(ended_at)', { ascending: false })
        .order('set_number', { ascending: true })
        .limit(20);

      if (error || !lastSets || lastSets.length === 0) return;

      // Group by session — take the most recent session's sets
      // Since results are ordered by ended_at desc then set_number asc, the first batch
      // belongs to the most recent session.
      const mostRecentEndedAt = (lastSets[0] as any).workout_sessions?.ended_at;
      const prevSets = (lastSets as any[])
        .filter((r) => r.workout_sessions?.ended_at === mostRecentEndedAt)
        .map((r) => ({ weight_kg: r.weight_kg as number, reps: r.reps as number }));

      if (prevSets.length === 0) return;

      set((state) => {
        const exercises = [...state.sessionExercises];
        const idx = exercises.findIndex((e) => e.exercise.id === exercise.id);
        if (idx === -1) return state;
        exercises[idx] = { ...exercises[idx], prevSets };
        return { sessionExercises: exercises };
      });
    } catch {
      // silently ignore — prevSets stays null
    }
  },

  addSet: (exerciseIndex) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;

      const lastDone = [...ex.sets].reverse().find((s) => s.is_done && !s.isWarmup);
      const regularSets = ex.sets.filter((s) => !s.isWarmup);
      const newSet: LocalSet = {
        localId: genId(),
        dbId: null,
        set_number: regularSets.length + 1,
        weight_kg: lastDone?.weight_kg ?? ex.sets[ex.sets.length - 1]?.weight_kg ?? 0,
        reps: lastDone?.reps ?? ex.sets[ex.sets.length - 1]?.reps ?? 0,
        is_done: false,
        is_pr: false,
        isWarmup: false,
      };
      exercises[exerciseIndex] = { ...ex, sets: [...ex.sets, newSet] };
      return { sessionExercises: exercises };
    });
  },

  addWarmupSet: (exerciseIndex) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;

      const existingWarmups = ex.sets.filter((s) => s.isWarmup);
      const warmupNumber = existingWarmups.length + 1;

      const warmupSet: LocalSet = {
        localId: genId(),
        dbId: null,
        set_number: warmupNumber,
        weight_kg: 0,
        reps: 0,
        is_done: false,
        is_pr: false,
        isWarmup: true,
      };

      // Insert warmup sets before regular sets
      const warmups = ex.sets.filter((s) => s.isWarmup);
      const regulars = ex.sets.filter((s) => !s.isWarmup);
      const newSets = [...warmups, warmupSet, ...regulars];

      exercises[exerciseIndex] = { ...ex, sets: newSets };
      return { sessionExercises: exercises };
    });
  },

  updateSetField: (exerciseIndex, setIndex, field, value) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercises[exerciseIndex] = { ...ex, sets };
      return { sessionExercises: exercises };
    });
  },

  completeSet: async (exerciseIndex, setIndex) => {
    const { sessionId, sessionExercises } = get();
    const ex = sessionExercises[exerciseIndex];
    const s = ex?.sets[setIndex];
    if (!s || s.is_done) return;
    const appliedRestSeconds = ex.custom_rest_seconds ?? ex.exercise.default_rest_seconds;

    set((state) => {
      const exercises = [...state.sessionExercises];
      const exercise = exercises[exerciseIndex];
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], is_done: true };
      exercises[exerciseIndex] = { ...exercise, sets };
      return {
        sessionExercises: exercises,
        restEndsAt: Date.now() + appliedRestSeconds * 1000,
        activeRestExerciseIndex: exerciseIndex,
      };
    });

    if (!sessionId) return;
    set({ saving: true });
    try {
      let exerciseId = ex.exercise.id;
      if (exerciseId.startsWith('local::')) {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) { set({ saving: false }); return; }

        const { name_ko, name_en, category, default_rest_seconds, is_custom } = ex.exercise;
        const { data: upserted, error: exErr } = await supabase
          .from('exercises')
          .insert({ name_ko, name_en, category, default_rest_seconds, is_custom, user_id: userId })
          .select('id')
          .single();

        if (exErr) { set({ saving: false }); return; }
        exerciseId = upserted.id;
        set((state) => {
          const exercises = [...state.sessionExercises];
          exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            exercise: { ...exercises[exerciseIndex].exercise, id: exerciseId },
          };
          return { sessionExercises: exercises };
        });
      }

      // Skip DB write for warmup sets
      if (s.isWarmup) {
        set({ saving: false });
        return;
      }

      const { data: prData } = await supabase
        .from('workout_sets')
        .select('weight_kg')
        .eq('exercise_id', exerciseId)
        .order('weight_kg', { ascending: false })
        .limit(1);

      const previousMax: number = prData?.[0]?.weight_kg ?? 0;
      const is_pr = s.weight_kg > 0 && s.weight_kg > previousMax;

      const { data: inserted, error } = await supabase
        .from('workout_sets')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: s.set_number,
          reps: s.reps,
          weight_kg: s.weight_kg,
          rest_seconds: appliedRestSeconds,
          is_pr,
        })
        .select('id')
        .single();

      if (!error && inserted) {
        set((state) => {
          const exercises = [...state.sessionExercises];
          const exercise = exercises[exerciseIndex];
          const sets = [...exercise.sets];
          sets[setIndex] = { ...sets[setIndex], is_pr, dbId: inserted.id };
          exercises[exerciseIndex] = { ...exercise, sets };
          return { sessionExercises: exercises, saving: false };
        });
      } else {
        set({ saving: false });
      }
    } catch {
      set({ saving: false });
    }
  },

  uncompleteSet: (exerciseIndex, setIndex) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], is_done: false, is_pr: false };
      exercises[exerciseIndex] = { ...ex, sets };
      return { sessionExercises: exercises };
    });
  },

  skipRest: () => set({ restEndsAt: null, activeRestExerciseIndex: null }),

  adjustRest: (delta) =>
    set((state) => ({
      restEndsAt: state.restEndsAt
        ? Math.max(Date.now() + 1000, state.restEndsAt + delta * 1000)
        : null,
    })),

  finishSession: async () => {
    const { sessionId, sessionExercises, startedAt } = get();
    const sessionStart = startedAt ?? Date.now();
    const durationSeconds = Math.floor((Date.now() - sessionStart) / 1000);

    // Warmup sets are NOT counted in volume or setCount
    const doneSets = (ex: SessionExercise) => ex.sets.filter((s) => s.is_done && !s.isWarmup);
    const totalVolumeKg = sessionExercises.reduce(
      (total, ex) => total + doneSets(ex).reduce((v, s) => v + s.weight_kg * s.reps, 0),
      0,
    );
    const setCount = sessionExercises.reduce((n, ex) => n + doneSets(ex).length, 0);

    if (!sessionId) {
      throw new Error('운동 세션이 생성되지 않았습니다. 로그인 상태를 확인해주세요.');
    }

    const { error } = await supabase
      .from('workout_sessions')
      .update({ ended_at: new Date().toISOString(), total_volume_kg: totalVolumeKg })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`저장 실패: ${error.message}`);
    }

    const { nsunsTms, programContext } = get();
    let nsunsAmrapResults: NsunsAmrapResult[] | undefined;

    if (nsunsTms && Object.keys(nsunsTms).length > 0) {
      const results: NsunsAmrapResult[] = [];
      for (const ex of sessionExercises) {
        const progressionSet = ex.sets.find((s) => s.isProgressionSet && s.is_done);
        if (!progressionSet) continue;
        const tmKey = getTmKey(ex.exercise.name_ko, ex.exercise.name_en ?? null);
        if (!tmKey || !nsunsTms[tmKey]) continue;
        const currentTm = nsunsTms[tmKey];
        const amrapReps = progressionSet.reps;
        const increase = suggestTmIncrease(amrapReps, isUpperBody(tmKey));
        results.push({
          exerciseName: ex.exercise.name_ko,
          exerciseKey: tmKey,
          currentTm,
          amrapReps,
          suggestedIncrease: increase,
          newTm: currentTm + increase,
        });
      }
      if (results.length > 0) nsunsAmrapResults = results;
    }

    return {
      totalVolumeKg,
      setCount,
      durationSeconds,
      exercises: sessionExercises.map((ex) => ({
        name: ex.exercise.name_ko,
        sets: doneSets(ex).length,
        volume_kg: doneSets(ex).reduce((v, s) => v + s.weight_kg * s.reps, 0),
      })),
      nsunsAmrapResults,
      userProgramId: programContext?.userProgramId,
    };
  },

  resetSession: () =>
    set({
      sessionId: null,
      sessionExercises: [],
      startedAt: null,
      restEndsAt: null,
      activeRestExerciseIndex: null,
      saving: false,
      title: makeDefaultTitle(),
      notes: '',
      programContext: null,
      nsunsTms: null,
    }),

  removeExercise: (exerciseIndex) => {
    set((state) => ({
      sessionExercises: state.sessionExercises.filter((_, i) => i !== exerciseIndex),
    }));
  },

  removeSet: (exerciseIndex, setIndex) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;

      const filteredSets = ex.sets.filter((_, i) => i !== setIndex);
      if (filteredSets.length === 0) {
        return { sessionExercises: exercises.filter((_, i) => i !== exerciseIndex) };
      }

      // Renumber warmup sets and regular sets independently
      let warmupCount = 0;
      let regularCount = 0;
      const renumbered = filteredSets.map((s) => {
        if (s.isWarmup) {
          warmupCount += 1;
          return { ...s, set_number: warmupCount };
        } else {
          regularCount += 1;
          return { ...s, set_number: regularCount };
        }
      });

      exercises[exerciseIndex] = { ...ex, sets: renumbered };
      return { sessionExercises: exercises };
    });
  },

  setTitle: (t) => set({ title: t }),

  setNotes: (n) => set({ notes: n }),

  setExerciseNote: (exerciseIndex, note) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;
      exercises[exerciseIndex] = { ...ex, note };
      return { sessionExercises: exercises };
    });
  },

  setExerciseRestSeconds: (exerciseIndex, seconds) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;
      const appliedSeconds = seconds ?? ex.exercise.default_rest_seconds;
      exercises[exerciseIndex] = {
        ...ex,
        custom_rest_seconds: seconds ?? undefined,
      };
      return {
        sessionExercises: exercises,
        restEndsAt:
          state.restEndsAt && state.activeRestExerciseIndex === exerciseIndex
            ? Date.now() + appliedSeconds * 1000
            : state.restEndsAt,
      };
    });
  },

  updateExerciseName: (exerciseIndex, newName) => {
    set((state) => {
      const exercises = [...state.sessionExercises];
      const ex = exercises[exerciseIndex];
      if (!ex) return state;

      const newId = ex.exercise.id.startsWith('local::ai-')
        ? `local::ai-${newName}`
        : ex.exercise.id;

      const updatedExercise: SessionExercise = {
        ...ex,
        exercise: {
          ...ex.exercise,
          id: newId,
          name_ko: newName,
        },
      };
      exercises[exerciseIndex] = updatedExercise;
      return { sessionExercises: exercises };
    });
  },
}));
