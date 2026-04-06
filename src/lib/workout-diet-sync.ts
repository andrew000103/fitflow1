import { supabase } from './supabase';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export type WorkoutBodyPart = 'lower_body' | 'upper_body' | 'full_body' | 'unknown';
export type WorkoutIntensity = 'light' | 'moderate' | 'intense';

export interface WorkoutDietAdjustment {
  hasWorkout: boolean;
  workoutLabel: string;       // "하체 운동 완료", "상체 운동 완료", ...
  bodyPart: WorkoutBodyPart;
  intensityLevel: WorkoutIntensity;
  totalVolumeKg: number;
  additionalCalories: number;
  additionalProtein: number;
  additionalCarbs: number;
  additionalFat: number;      // 항상 0 (운동 후 지방 추가 없음)
}

// ─── 상수 테이블 ──────────────────────────────────────────────────────────────

// 카테고리 → 부위 매핑
const LOWER_BODY_CATEGORIES = new Set(['하체']);
const UPPER_BODY_CATEGORIES = new Set(['가슴', '등', '어깨', '팔']);
const FULL_BODY_CATEGORIES = new Set(['역도']);
// '복근', '유산소', '기타' → unknown

// 강도별 기본 조정값
const INTENSITY_BASE: Record<WorkoutIntensity, { kcal: number; protein: number; carbs: number }> = {
  light:    { kcal: 150, protein: 5,  carbs: 20 },
  moderate: { kcal: 250, protein: 10, carbs: 40 },
  intense:  { kcal: 400, protein: 20, carbs: 60 },
};

// 부위별 추가 보정값
const BODYPART_BONUS: Record<WorkoutBodyPart, { protein: number; carbs: number }> = {
  lower_body: { protein: 0,  carbs: 20 }, // 하체: 글리코겐 소모 큼
  upper_body: { protein: 5,  carbs: 0  }, // 상체: 단백질 합성 중심
  full_body:  { protein: 5,  carbs: 15 }, // 전신: 균형 보정
  unknown:    { protein: 0,  carbs: 0  }, // 보수적 처리
};

// ─── 내부 헬퍼 함수 ───────────────────────────────────────────────────────────

function classifyBodyPart(categoryCounts: Map<string, number>): WorkoutBodyPart {
  let lower = 0, upper = 0, full = 0;
  for (const [cat, count] of categoryCounts.entries()) {
    if (LOWER_BODY_CATEGORIES.has(cat)) lower += count;
    else if (UPPER_BODY_CATEGORIES.has(cat)) upper += count;
    else if (FULL_BODY_CATEGORIES.has(cat)) full += count;
  }

  const total = lower + upper + full;
  if (total === 0) return 'unknown';

  // 역도(full_body)가 포함되면 full_body 우선
  if (full > 0 && full >= total * 0.3) return 'full_body';
  // 과반수 기준으로 부위 결정
  if (lower >= upper && lower >= full) return 'lower_body';
  if (upper > lower) return 'upper_body';
  return 'full_body';
}

function getIntensityFromVolume(totalVolumeKg: number): WorkoutIntensity {
  if (totalVolumeKg >= 8000) return 'intense';
  if (totalVolumeKg >= 3000) return 'moderate';
  return 'light';
}

function getIntensityFromSetCount(setCount: number): WorkoutIntensity {
  if (setCount > 25) return 'intense';
  if (setCount > 10) return 'moderate';
  return 'light';
}

function buildWorkoutLabel(bodyPart: WorkoutBodyPart, sessionCount: number): string {
  const PART_LABEL: Record<WorkoutBodyPart, string> = {
    lower_body: '하체',
    upper_body: '상체',
    full_body:  '전신',
    unknown:    '',
  };
  const partLabel = PART_LABEL[bodyPart];

  const base = partLabel ? `${partLabel} 운동 완료` : '운동 완료';
  return sessionCount > 1 ? `${base} (${sessionCount}세션)` : base;
}

// ─── 메인 함수 ────────────────────────────────────────────────────────────────

const NO_WORKOUT: WorkoutDietAdjustment = {
  hasWorkout: false,
  workoutLabel: '',
  bodyPart: 'unknown',
  intensityLevel: 'light',
  totalVolumeKg: 0,
  additionalCalories: 0,
  additionalProtein: 0,
  additionalCarbs: 0,
  additionalFat: 0,
};

/**
 * 오늘 완료된 운동 세션을 기반으로 식단 목표 조정값을 계산한다.
 * 실패 시 예외 없이 hasWorkout: false 반환 (graceful fallback).
 */
export async function fetchTodayWorkoutAdjustment(
  userId: string,
  today: string, // 'YYYY-MM-DD'
): Promise<WorkoutDietAdjustment> {
  try {
    // Step 1: 오늘 완료된 세션 ID 조회
    const { data: sessions, error: sessErr } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00`)
      .lte('started_at', `${today}T23:59:59`)
      .not('ended_at', 'is', null);

    if (sessErr || !sessions || sessions.length === 0) return NO_WORKOUT;

    const sessionIds = sessions.map((s) => s.id);

    // Step 2: 완료된 세트 조회 (exercises 카테고리 join)
    const { data: sets, error: setsErr } = await supabase
      .from('workout_sets')
      .select('weight_kg, reps, exercise_id, exercises(category)')
      .in('session_id', sessionIds)
      .eq('is_done', true);

    if (setsErr || !sets || sets.length === 0) return NO_WORKOUT;

    // Step 3: 볼륨 계산 + 카테고리 집계
    let totalVolumeKg = 0;
    let bodyweightSetCount = 0;
    const categoryCounts = new Map<string, number>();

    for (const set of sets) {
      const wt = set.weight_kg ?? 0;
      const reps = set.reps ?? 0;

      if (wt > 0) {
        totalVolumeKg += wt * reps;
      } else {
        // 맨몸 운동: 볼륨 기여 없음, fallback용 세트 수 카운트
        bodyweightSetCount += 1;
      }

      // exercise_id가 'local::ai-' 접두어이면 카테고리 불명
      const isLocalAI = typeof set.exercise_id === 'string' && set.exercise_id.startsWith('local::ai-');
      if (!isLocalAI) {
        const exArr = set.exercises;
        const ex = Array.isArray(exArr) ? exArr[0] : exArr;
        const cat = (ex as { category: string | null } | null)?.category;
        if (cat) {
          categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
        }
      }
    }

    // Step 4: 강도 결정
    // 맨몸 운동만 있을 때(볼륨 0) → 완료된 세트 수 기반 fallback
    const intensity =
      totalVolumeKg > 0
        ? getIntensityFromVolume(totalVolumeKg)
        : getIntensityFromSetCount(sets.length);

    // Step 5: 부위 분류
    const bodyPart = classifyBodyPart(categoryCounts);

    // Step 6: 조정값 계산
    const base = INTENSITY_BASE[intensity];
    const bonus = BODYPART_BONUS[bodyPart];

    return {
      hasWorkout: true,
      workoutLabel: buildWorkoutLabel(bodyPart, sessions.length),
      bodyPart,
      intensityLevel: intensity,
      totalVolumeKg: Math.round(totalVolumeKg),
      additionalCalories: base.kcal,
      additionalProtein: base.protein + bonus.protein,
      additionalCarbs: base.carbs + bonus.carbs,
      additionalFat: 0,
    };
  } catch {
    return NO_WORKOUT;
  }
}
