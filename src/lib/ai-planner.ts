import { supabase } from './supabase';
import { AIPlan, GymType, OnboardingData } from '../stores/ai-plan-store';

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
  const goalLabel: Record<string, string> = {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가 (벌크업)',
    maintenance: '체형 유지',
    health: '건강 개선',
  };

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

  let strengthSection = '';
  if (data.strengthProfile && data.strengthProfile.length > 0) {
    strengthSection = `
[현재 운동 중량 (참고용)]
${data.strengthProfile.map(e => `- ${e.exercise}: ${e.weightKg}kg`).join('\n')}
→ 위 중량을 기준으로 AI 플랜의 weight_kg 값을 현실적으로 설정해주세요.
`;
  } else if (Array.isArray(data.strengthProfile) && data.strengthProfile.length === 0) {
    strengthSection = `\n→ 사용자가 운동 중량을 입력하지 않았습니다. 운동 경험(${experienceLabel[data.experience]})을 고려하여 weight_kg를 맨몸 또는 매우 가벼운 중량(0~10kg)으로 보수적으로 설정해주세요.\n`;
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
- 목표: ${goalLabel[data.goal]}
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

// ─── 메인 생성 함수 ────────────────────────────────────────────────────────────

export async function generateAIPlan(
  data: OnboardingData,
  history: UserHistorySummary | null,
  workoutHistorySection: string = ''
): Promise<AIPlan> {
  const prompt = buildPrompt(data, history, workoutHistorySection);

  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'generate-ai-plan',
    { body: { prompt } }
  );

  if (fnError) {
    throw new Error(`AI 플랜 생성 오류: ${fnError.message}`);
  }

  const responseText: string = fnData?.text ?? '';

  // JSON 파싱 — 마크다운 래핑 제거
  const cleaned = responseText
    .replace(/^```json\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();

  let parsed: Omit<AIPlan, 'id' | 'weekStart' | 'generatedAt'>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 응답 파싱에 실패했습니다. 다시 시도해주세요.');
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
