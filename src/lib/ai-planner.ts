import { supabase } from './supabase';
import { AI_GOAL_LABEL, AIPlan, GymType, OnboardingData } from '../stores/ai-plan-store';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export interface UserHistorySummary {
  avgDailyCalories: number;
  workoutCompletionRate: number; // 0~1
  weightTrend: number; // kg/week (음수=감소)
  recentWeight: number;
}

export interface SafetyCheckResult {
  blocked: boolean;
  reason?: string;
  message?: string;
}

// ─── 안전 가드레일 ────────────────────────────────────────────────────────────

function estimateDailyCalories(data: OnboardingData): number {
  const bmr =
    data.gender === 'female'
      ? 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
      : 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  return bmr * 1.2; // 최소 활동 계수 (sedentary)
}

export function validateSafety(data: OnboardingData): SafetyCheckResult {
  const bmi = data.weight / (data.height / 100) ** 2;

  if (data.goal === 'weight_loss' && bmi < 17.5) {
    return {
      blocked: true,
      reason: 'underweight_loss_risk',
      message:
        `현재 BMI(${bmi.toFixed(1)})가 저체중 기준 미만입니다.\n` +
        '이 상태에서 감량은 근손실과 영양 결핍 위험이 있습니다.\n' +
        '전문 영양사 또는 의사와 상담 후 목표를 설정해주세요.',
    };
  }

  if (data.gender === 'female' && data.weight < 45 && data.goal === 'weight_loss') {
    return {
      blocked: true,
      reason: 'low_weight_female',
      message:
        '입력하신 체중과 목표를 고려했을 때 AI 플랜 생성이 제한됩니다.\n' +
        '건강한 감량을 위해 전문가 상담을 권장합니다.',
    };
  }

  // 극단적 저체중만 차단 (BMI < 15) — 칼로리 추정 기반 사전 차단 제거
  // (AI 응답 후 minCalories 보정 로직이 있으므로 사전 차단 불필요)
  if (data.goal === 'weight_loss' && bmi < 15) {
    return {
      blocked: true,
      reason: 'extreme_underweight',
      message:
        `현재 BMI(${bmi.toFixed(1)})가 매우 낮습니다.\n` +
        '의료 전문가와 상담 후 목표를 설정해주세요.',
    };
  }

  return { blocked: false };
}

// ─── 운동 수행 기록 (적응형 강도 조정용) ──────────────────────────────────────

export interface ExercisePerformanceRecord {
  exerciseName: string;
  plannedSets: number;
  plannedReps: number;           // repsRange 파싱값 (중간값)
  plannedWeightKg: number | null;
  actualCompletedSets: number;
  actualTotalReps: number;
  actualAvgWeightKg: number | null;
  completionRate: number;        // 0~1
}

function parseRepsRangeMid(repsRange: string): number {
  const m = repsRange.match(/^(\d+)(?:[~\-](\d+))?$/);
  if (!m) return 10;
  return m[2]
    ? Math.round((parseInt(m[1], 10) + parseInt(m[2], 10)) / 2)
    : parseInt(m[1], 10);
}

export async function fetchRecentWorkoutPerformance(
  userId: string,
  planExercises: { name: string; sets: number; repsRange: string; weight_kg?: number | null }[],
  days = 14
): Promise<ExercisePerformanceRecord[]> {
  try {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Step 1: 해당 유저의 세션 ID 목록
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', since);

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);

    // Step 2: 해당 세션의 workout_sets (완료된 세트만)
    const { data: sets } = await supabase
      .from('workout_sets')
      .select('exercise_id, weight_kg, reps, is_done')
      .in('session_id', sessionIds)
      .eq('is_done', true);

    if (!sets || sets.length === 0) return [];

    // Step 3: exercise_id → exercise name 매핑 (local::ai-{name} 형식 처리)
    const setsByName = new Map<string, { weightKg: number; reps: number }[]>();
    for (const s of sets) {
      if (!s.exercise_id) continue;
      let name: string | null = null;
      if (typeof s.exercise_id === 'string' && s.exercise_id.startsWith('local::ai-')) {
        name = s.exercise_id.replace('local::ai-', '');
      }
      if (!name) continue;
      const existing = setsByName.get(name) ?? [];
      existing.push({ weightKg: s.weight_kg ?? 0, reps: s.reps ?? 0 });
      setsByName.set(name, existing);
    }

    // Step 4: planExercises와 매칭하여 완수율 계산 (중복 종목 제거)
    const records: ExercisePerformanceRecord[] = [];
    const seen = new Set<string>();

    for (const ex of planExercises) {
      if (seen.has(ex.name)) continue;
      seen.add(ex.name);

      const actualSets = setsByName.get(ex.name);
      if (!actualSets || actualSets.length === 0) continue;

      const plannedReps = parseRepsRangeMid(ex.repsRange);
      const totalPlanned = ex.sets * plannedReps;
      const totalActual = actualSets.reduce((sum, s) => sum + s.reps, 0);
      const completionRate = totalPlanned > 0 ? Math.min(totalActual / totalPlanned, 1) : 0;

      const weights = actualSets.map((s) => s.weightKg).filter((w) => w > 0);
      const avgWeight =
        weights.length > 0
          ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
          : null;

      records.push({
        exerciseName: ex.name,
        plannedSets: ex.sets,
        plannedReps,
        plannedWeightKg: ex.weight_kg ?? null,
        actualCompletedSets: actualSets.length,
        actualTotalReps: totalActual,
        actualAvgWeightKg: avgWeight,
        completionRate,
      });
    }

    return records;
  } catch {
    return [];
  }
}

const COMPOUND_NAMES = ['스쿼트', '데드리프트', '벤치프레스', '오버헤드프레스', '바벨로우', '풀업'];

function isCompoundExercise(name: string): boolean {
  return COMPOUND_NAMES.some((c) => name.includes(c));
}

export function computeAdjustedWeight(
  exerciseName: string,
  currentWeightKg: number | null,
  completionRate: number
): number | null {
  if (currentWeightKg === null || currentWeightKg === undefined) return null;

  const increment = isCompoundExercise(exerciseName) ? 2.5 : 1.0;

  if (completionRate >= 0.9) {
    return Math.round((currentWeightKg + increment) * 10) / 10;
  } else if (completionRate < 0.6) {
    return Math.max(0, Math.round((currentWeightKg - increment) * 10) / 10);
  }
  return currentWeightKg; // 60~89% → 현상 유지
}

export async function buildWorkoutHistorySection(
  userId: string,
  currentPlan: AIPlan
): Promise<string> {
  try {
    const planExercises = currentPlan.weeklyWorkout
      .flatMap((d) => d.exercises)
      .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);

    if (planExercises.length === 0) return '';

    const records = await fetchRecentWorkoutPerformance(userId, planExercises, 14);
    if (records.length === 0) return '';

    const top = records.slice(0, 10);
    const lines = top.map((r) => {
      const rate = Math.round(r.completionRate * 100);
      const weightStr = r.actualAvgWeightKg != null ? `${r.actualAvgWeightKg}kg × ` : '';
      return `- ${r.exerciseName}: ${weightStr}${r.actualCompletedSets}/${r.plannedSets}세트 완료 — 완수율 ${rate}%`;
    });

    return `\n[최근 운동 수행 기록 (2주)]\n${lines.join('\n')}\n→ 위 수행 데이터를 참고하여 다음 주 weight_kg 및 sets/repsRange를 현실적으로 조정해주세요.\n`;
  } catch {
    return '';
  }
}

// ─── 히스토리 요약 (동의자 한정) ──────────────────────────────────────────────

export async function fetchUserHistorySummary(
  userId: string
): Promise<UserHistorySummary | null> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const since = sevenDaysAgo.toISOString();

    const [workoutRes, weightRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id, ended_at')
        .eq('user_id', userId)
        .gte('ended_at', since),
      supabase
        .from('body_weights')
        .select('weight_kg, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(10),
    ]);

    const workoutCount = workoutRes.data?.length ?? 0;
    const workoutCompletionRate = Math.min(workoutCount / 7, 1);

    const weights = weightRes.data ?? [];
    const recentWeight = weights[0]?.weight_kg ?? 0;

    let weightTrend = 0;
    if (weights.length >= 2) {
      const oldest = weights[weights.length - 1].weight_kg;
      const newest = weights[0].weight_kg;
      weightTrend = (newest - oldest) / Math.max(weights.length - 1, 1);
    }

    // 최근 7일 meal_items 기반 일평균 칼로리 집계 (독립 쿼리 — 오류 시 0 유지)
    let avgDailyCalories = 0;
    try {
      const mealRes = await supabase
        .from('meal_logs')
        .select('logged_at, meal_items(calories)')
        .eq('user_id', userId)
        .gte('logged_at', since);
      if (mealRes.data && mealRes.data.length > 0) {
        const dailyMap = new Map<string, number>();
        for (const log of mealRes.data) {
          const date = (log.logged_at as string).split('T')[0];
          const dayCalories = ((log.meal_items ?? []) as { calories: number }[]).reduce(
            (sum, item) => sum + (item.calories ?? 0),
            0
          );
          dailyMap.set(date, (dailyMap.get(date) ?? 0) + dayCalories);
        }
        if (dailyMap.size > 0) {
          const total = Array.from(dailyMap.values()).reduce((s, v) => s + v, 0);
          avgDailyCalories = Math.round(total / dailyMap.size);
        }
      }
    } catch {
      // meal 쿼리 오류 시 0 유지 (workout/weight 데이터는 정상 반환)
    }

    return {
      avgDailyCalories,
      workoutCompletionRate,
      weightTrend,
      recentWeight,
    };
  } catch {
    return null;
  }
}

// ─── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildPrompt(
  data: OnboardingData,
  history: UserHistorySummary | null,
  workoutHistorySection: string = ''
): string {
  const experienceLabel: Record<string, string> = {
    beginner: '입문 (0~6개월)',
    intermediate: '초급~중급 (6개월~2년)',
    advanced: '중급 이상 (2년+)',
  };

  const genderLabel: Record<string, string> = {
    male: '남성',
    female: '여성',
    undisclosed: '미공개',
  };

  const recoveryLabel: Record<string, string> = {
    easy: '다음날도 괜찮음',
    moderate: '약간 불편함',
    hard: '많이 불편함',
  };

  const primaryStrengthFocusLabel: Record<NonNullable<OnboardingData['primaryStrengthFocus']>, string> = {
    squat: '스쿼트',
    bench: '벤치프레스',
    deadlift: '데드리프트',
    balanced: '전신 균형',
  };

  const gymLabel: Record<GymType, string> = {
    full_gym: '헬스장 (바벨, 덤벨, 머신 전체 이용 가능)',
    garage_gym: '홈짐 (바벨, 스쿼트랙, 덤벨 일부)',
    dumbbell_only: '덤벨·케틀벨만 사용 가능',
    bodyweight: '장비 없이 자체 중량만 가능',
  };

  const gymType = data.gymType ?? 'full_gym';
  const gymSection = data.equipmentList && data.equipmentList.length > 0
    ? `\n[운동 환경]\n- 시설: ${gymLabel[gymType]}\n- 보유 장비: ${data.equipmentList.join(', ')}\n- 위에 없는 장비가 필요한 종목은 절대 포함하지 마세요.\n`
    : `\n[운동 환경]\n- 시설: ${gymLabel[gymType]}\n`;

  const restrictions = data.dietaryRestrictions.length > 0
    ? data.dietaryRestrictions.join(', ')
    : '없음';

  const goalInstructionMap: Record<OnboardingData['goal'], string> = {
    weight_loss: [
      '- 운동은 지방 감량 중에도 근손실을 줄이도록 구성하세요.',
      '- 과도한 운동 볼륨보다 지속 가능성과 회복 가능성을 우선하세요.',
      '- 식단은 무리하지 않은 칼로리 적자와 충분한 단백질 확보를 우선하세요.',
    ].join('\n'),
    muscle_gain: [
      '- 운동은 근비대 중심으로 설계하고, 부위별 볼륨을 충분히 확보하세요.',
      '- 주요 복합 운동과 보조 운동을 균형 있게 포함하세요.',
      '- 식단은 근성장에 필요한 소폭 칼로리 흑자와 충분한 단백질을 우선하세요.',
    ].join('\n'),
    strength_gain: [
      '- 운동은 스쿼트, 벤치프레스, 데드리프트, 오버헤드프레스 같은 메인 리프트 중심으로 설계하세요.',
      '- 주요 리프트는 3~6회 반복의 저반복·고중량 성향 세트를 적극 활용하세요.',
      '- 머신 위주의 보디빌딩식 분할보다 복합 리프트와 기술 연습 우선으로 구성하세요.',
      '- 보조 운동은 기록 향상과 약점 보완에 필요한 범위로만 최소화하세요.',
      '- 회복 수준이 낮으면 운동 총량을 보수적으로 줄이고, 세트 수를 과도하게 늘리지 마세요.',
      '- 식단은 무조건 벌크업하지 말고 유지칼로리 또는 소폭 흑자 수준에서 회복과 퍼포먼스 향상을 우선하세요.',
    ].join('\n'),
    maintenance: [
      '- 운동은 현재 체력과 체형을 유지할 수 있도록 균형 있게 설계하세요.',
      '- 식단은 유지 가능한 수준과 일관성을 우선하세요.',
    ].join('\n'),
    health: [
      '- 운동은 전신 움직임, 기초 체력, 부상 위험 관리에 초점을 두세요.',
      '- 식단은 건강 습관 형성과 영양 균형을 우선하세요.',
    ].join('\n'),
  };

  let strengthSection = '';
  if (data.strengthProfile && data.strengthProfile.length > 0) {
    strengthSection = `
[현재 운동 중량 (참고용)]
${data.strengthProfile.map(e => `- ${e.exercise}: ${e.weightKg}kg`).join('\n')}
→ 위 중량을 기준으로 AI 플랜의 weight_kg 값을 현실적으로 설정해주세요.
`;
  } else if (Array.isArray(data.strengthProfile) && data.strengthProfile.length === 0) {
    strengthSection = data.goal === 'strength_gain'
      ? `\n→ 사용자가 현재 중량을 입력하지 않았습니다. 운동 경험(${experienceLabel[data.experience]})과 강화 우선 리프트를 고려해 메인 리프트의 weight_kg를 매우 보수적으로 설정하고, 무리한 추정 중량은 피해주세요.\n`
      : `\n→ 사용자가 운동 중량을 입력하지 않았습니다. 운동 경험(${experienceLabel[data.experience]})을 고려하여 weight_kg를 맨몸 또는 매우 가벼운 중량(0~10kg)으로 보수적으로 설정해주세요.\n`;
  }

  let historySection = '';
  if (history && (history.workoutCompletionRate > 0 || history.recentWeight > 0)) {
    historySection = `
[최근 7일 기록 요약]
- 운동 완료율: ${Math.round(history.workoutCompletionRate * 100)}%
- 체중 변화 추이: 주당 ${history.weightTrend > 0 ? '+' : ''}${history.weightTrend.toFixed(2)}kg
${history.avgDailyCalories > 0 ? `- 평균 일일 칼로리 섭취: ${history.avgDailyCalories}kcal` : ''}
`;
  }

  const phase2 = [
    data.primaryStrengthFocus
      ? `- 강화 우선 리프트: ${primaryStrengthFocusLabel[data.primaryStrengthFocus]}`
      : '',
    data.recoveryLevel ? `- 운동 후 피로 회복: ${recoveryLabel[data.recoveryLevel]}` : '',
    data.overeatingHabit
      ? `- 습관적 과식 여부: ${
          data.overeatingHabit === 'rarely'
            ? '거의 없음'
            : data.overeatingHabit === 'sometimes'
            ? '가끔 있음'
            : '자주 있음'
        }`
      : '',
    data.sleepQuality
      ? `- 수면 후 회복감: ${
          data.sleepQuality === 'good'
            ? '충분히 회복됨'
            : data.sleepQuality === 'average'
            ? '보통'
            : '거의 회복 안 됨'
        }`
      : '',
    data.plateauHistory ? `- 이전 정체기 경험: ${data.plateauHistory}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `당신은 공인 영양사이자 개인 트레이너입니다.
아래 사용자 정보를 기반으로 1주일치 맞춤 식단·운동 계획을 작성해주세요.

[사용자 정보]
- 목표: ${AI_GOAL_LABEL[data.goal]}
- 성별: ${genderLabel[data.gender]}
- 나이: ${data.age}세
- 키: ${data.height}cm / 체중: ${data.weight}kg
- 운동 경험: ${experienceLabel[data.experience]}
- 주당 운동 가능 일수: ${data.workoutDaysPerWeek}일
- 식이 제한: ${restrictions}
${gymSection}
${phase2}
${strengthSection}${historySection}${workoutHistorySection}
[중요 지침]
- 전문용어를 최소화하고 한국어로 쉽게 설명하세요
- 숫자와 근거를 구체적으로 제시하세요
- 식단은 한국 음식 중심으로 제안하세요
- 운동 경험 수준에 맞는 난이도로 설계하세요
- 운동 중량(weight_kg)은 사용자의 현재 중량 프로필을 참고해 현실적으로 설정하세요 (맨몸/카디오는 null)
- 아래 목표별 지침을 반드시 반영하세요:
${goalInstructionMap[data.goal]}
- weeklyWorkout은 반드시 7개 항목 (day1~day7)으로 작성하세요
- weeklyDiet는 반드시 1개 항목 (대표 하루 식단)으로 작성하세요

[출력 형식]
순수 JSON만 출력하세요. 마크다운 코드블록 없이:

{
  "targetCalories": number,
  "targetMacros": { "protein": number, "carbs": number, "fat": number },
  "weeklyWorkout": [
    {
      "dayLabel": "day1" | "day2" | "day3" | "day4" | "day5" | "day6" | "day7",
      "isRestDay": boolean,
      "focus": string | null,
      "exercises": [
        { "name": string, "sets": number, "repsRange": string, "weight_kg": number | null, "note": string | null }
      ]
    }
  ],
  "weeklyDiet": [
    {
      "targetCalories": number,
      "meals": [
        {
          "timing": string,
          "foods": [string],
          "calories": number,
          "macros": { "protein": number, "carbs": number, "fat": number }
        }
      ]
    }
  ],
  "explanation": {
    "summary": string,
    "detail": string,
    "sources": [string]
  },
  "safetyFlags": [string]
}`;
}

// ─── 날짜 헬퍼 ────────────────────────────────────────────────────────────────

export function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // 해당 주 월요일로 이동
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function parseRepsRangeForValidation(repsRange: string): { min: number; max: number } | null {
  const normalized = repsRange
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/회/g, '')
    .replace(/세트/g, '')
    .replace(/×/g, 'x');

  const fiveByFiveMatch = normalized.match(/(\d+)x(\d+)/);
  if (fiveByFiveMatch) {
    const reps = parseInt(fiveByFiveMatch[2], 10);
    return { min: reps, max: reps };
  }

  const rangeMatch = normalized.match(/(\d+)(?:[~\-](\d+))/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  const singleMatch = normalized.match(/(\d+)/);
  if (!singleMatch) return null;
  const reps = parseInt(singleMatch[1], 10);
  return { min: reps, max: reps };
}

function isMainLift(name: string): boolean {
  return ['스쿼트', '벤치프레스', '데드리프트', '오버헤드프레스'].some((lift) => name.includes(lift));
}

function validateGeneratedPlanForGoal(
  data: OnboardingData,
  plan: Omit<AIPlan, 'id' | 'weekStart' | 'generatedAt'>
): { valid: boolean; reasons: string[]; hardFailures: string[]; score: number } {
  const reasons: string[] = [];
  const hardFailures: string[] = [];

  if (!Array.isArray(plan.weeklyWorkout) || plan.weeklyWorkout.length !== 7) {
    hardFailures.push('weeklyWorkout이 7일 구성이 아닙니다.');
  }

  if (data.goal !== 'strength_gain') {
    const valid = hardFailures.length === 0;
    return { valid, reasons, hardFailures, score: valid ? 1 : 0 };
  }

  const exercises = (plan.weeklyWorkout ?? []).flatMap((day) => day.exercises ?? []);
  const mainLiftExercises = exercises.filter((exercise) => isMainLift(exercise.name));
  let score = 0;

  if (mainLiftExercises.length >= 2) {
    score += 1;
  } else {
    reasons.push('메인 리프트 비중이 너무 낮습니다.');
  }

  const lowRepMainLiftCount = mainLiftExercises.filter((exercise) => {
    const parsed = parseRepsRangeForValidation(exercise.repsRange);
    return parsed !== null && parsed.max <= 6;
  }).length;

  if (lowRepMainLiftCount >= 1) {
    score += 1;
  } else {
    reasons.push('메인 리프트에 저반복 세트가 충분하지 않습니다.');
  }

  const workoutDays = (plan.weeklyWorkout ?? []).filter((day) => !day.isRestDay);
  const excessiveHighVolumeDays = workoutDays.filter((day) => {
    const setCount = (day.exercises ?? []).reduce((sum, exercise) => sum + (exercise.sets ?? 0), 0);
    return setCount > 28;
  }).length;

  if (excessiveHighVolumeDays <= 2) {
    score += 1;
  } else {
    reasons.push('근력 강화 목표 대비 운동 볼륨이 과도합니다.');
  }

  if (data.primaryStrengthFocus && data.primaryStrengthFocus !== 'balanced') {
    const focusMap: Record<Exclude<NonNullable<OnboardingData['primaryStrengthFocus']>, 'balanced'>, string> = {
      squat: '스쿼트',
      bench: '벤치프레스',
      deadlift: '데드리프트',
    };
    const focusLiftName = focusMap[data.primaryStrengthFocus];
    const hasFocusLift = mainLiftExercises.some((exercise) => exercise.name.includes(focusLiftName));
    if (hasFocusLift) {
      score += 1;
    } else {
      reasons.push(`우선 리프트(${focusLiftName})가 루틴에 반영되지 않았습니다.`);
    }
  } else {
    score += 1;
  }

  const valid = hardFailures.length === 0 && score >= 3;
  return { valid, reasons, hardFailures, score };
}

async function requestPlanFromModel(prompt: string): Promise<Omit<AIPlan, 'id' | 'weekStart' | 'generatedAt'>> {
  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'generate-ai-plan',
    { body: { prompt } }
  );

  if (fnError) {
    throw new Error(`AI 플랜 생성 오류: ${fnError.message}`);
  }

  const responseText: string = fnData?.text ?? '';
  const cleaned = responseText
    .replace(/^```json\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('AI 응답 파싱에 실패했습니다. 다시 시도해주세요.');
  }
}

// ─── 메인 생성 함수 ────────────────────────────────────────────────────────────

export async function generateAIPlan(
  data: OnboardingData,
  history: UserHistorySummary | null,
  workoutHistorySection: string = ''
): Promise<AIPlan> {
  const prompt = buildPrompt(data, history, workoutHistorySection);
  let parsed = await requestPlanFromModel(prompt);

  const validation = validateGeneratedPlanForGoal(data, parsed);
  if (!validation.valid) {
    const repairPrompt = `${prompt}

[이전 응답 보정 요청]
- 직전 응답에 다음 문제가 있었습니다:
${[...validation.hardFailures, ...validation.reasons].map((reason) => `- ${reason}`).join('\n')}
- 위 문제를 수정해서 목표에 더 정확히 맞는 JSON만 다시 출력하세요.
- 특히 strength_gain 목표라면 메인 리프트 중심, 저반복 세트, 우선 리프트 반영 여부를 반드시 점검하세요.`;

    parsed = await requestPlanFromModel(repairPrompt);

    const repairedValidation = validateGeneratedPlanForGoal(data, parsed);
    if (!repairedValidation.valid) {
      if (repairedValidation.hardFailures.length > 0) {
        throw new Error(
          data.goal === 'strength_gain'
            ? '근력 강화 목표에 맞는 플랜 생성에 실패했습니다. 다시 시도해주세요.'
            : '생성된 플랜 검증에 실패했습니다. 다시 시도해주세요.'
        );
      }

      parsed.safetyFlags = [
        ...(parsed.safetyFlags ?? []),
        `근력 강화 목표 반영이 일부 제한될 수 있습니다: ${repairedValidation.reasons.join(', ')}`,
      ];
    }
  }

  // 최소 칼로리 안전 가드레일: 성별 분화 하한 적용
  const minCalories = data.gender === 'female' ? 1200 : 1500;
  if (parsed.targetCalories < minCalories) {
    parsed.targetCalories = minCalories;
    parsed.safetyFlags = [
      ...(parsed.safetyFlags ?? []),
      `목표 칼로리가 ${minCalories}kcal 미만으로 설정되어 ${minCalories}kcal로 조정되었습니다.`,
    ];
  }

  return {
    ...parsed,
    id: crypto.randomUUID(),
    weekStart: getTodayString(), // Day 1 = 플랜 생성 당일
    generatedAt: new Date().toISOString(),
  };
}

// ─── Supabase 저장 ─────────────────────────────────────────────────────────────

export async function saveAIPlanToSupabase(
  userId: string,
  plan: AIPlan,
  context: OnboardingData
): Promise<void> {
  // 기존 활성 플랜 비활성화
  await supabase
    .from('ai_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  // 신규 플랜 저장
  await supabase.from('ai_plans').insert({
    id: plan.id,
    user_id: userId,
    week_start: plan.weekStart,
    target_calories: plan.targetCalories,
    target_protein: plan.targetMacros.protein,
    target_carbs: plan.targetMacros.carbs,
    target_fat: plan.targetMacros.fat,
    plan_json: plan,
    is_active: true,
    generation_context: context,
  });
}

// ─── 동의 저장 ─────────────────────────────────────────────────────────────────

export async function saveAIConsent(
  userId: string,
  consent: boolean
): Promise<void> {
  await supabase
    .from('user_profiles')
    .update({
      ai_consent: consent,
      ai_consent_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

// ─── 온보딩 데이터 Supabase 저장 ──────────────────────────────────────────────

export async function saveOnboardingDataToSupabase(
  userId: string,
  data: OnboardingData
): Promise<void> {
  await supabase
    .from('user_profiles')
    .update({ ai_onboarding_data: data })
    .eq('id', userId);
}
