import type { GoalType, ProfileGender } from '../types/profile';

export type PersonaStage = 'starter' | 'learning' | 'established';
export type PersonaDailyState = 'ACTIVE' | 'RESTING' | 'HUNGRY' | 'FULL' | 'TIRED';
export type PersonaGoal = 'gain' | 'maintain' | 'loss';
export type PersonaFrequency = 'hardcore' | 'steady' | 'sporadic';
export type PersonaDiet = 'protein' | 'balanced' | 'cheater';
export type PersonaId =
  | 'gorilla'
  | 'bull'
  | 'bear'
  | 'fox'
  | 'cheetah'
  | 'hawk'
  | 'deer'
  | 'rabbit'
  | 'wolf'
  | 'retriever'
  | 'otter'
  | 'sloth';

export interface PersonaOnboardingInput {
  goal?: 'weight_loss' | 'muscle_gain' | 'strength_gain' | 'maintenance' | 'health' | null;
  experience?: 'beginner' | 'intermediate' | 'advanced' | null;
  workoutDaysPerWeek?: number | null;
  dietaryRestrictions?: string[] | null;
  overeatingHabit?: 'rarely' | 'sometimes' | 'often' | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  gender?: 'male' | 'female' | 'undisclosed' | null;
}

export interface PersonaMealDaySummary {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  mealCount: number;
  entryCount: number;
}

export interface PersonaWorkoutSummary {
  sessionCount14d: number;
  activeDays14d: number;
  completedToday: boolean;
  latestCompletedAt: string | null;
}

export interface PersonaProfileSnapshot {
  createdAt?: string | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: ProfileGender | null;
}

export interface PersonaGoalSnapshot {
  goalType?: GoalType | null;
  caloriesTarget?: number | null;
  proteinTargetG?: number | null;
  carbsTargetG?: number | null;
  fatTargetG?: number | null;
}

export interface PersonaSourceWeights {
  onboardingWeight: number;
  behaviorWeight: number;
}

export interface PersonaSourceBreakdown {
  overall: PersonaSourceWeights;
  frequency: PersonaSourceWeights;
  diet: PersonaSourceWeights;
  goalSource: 'onboarding' | 'user_goal' | 'default';
  workoutSessions14d: number;
  dietDays7d: number;
  aiOnboardingUsed: boolean;
}

export interface PersonaDataCompleteness {
  hasProfile: boolean;
  hasGoal: boolean;
  hasOnboarding: boolean;
  accountAgeDays: number | null;
  workoutSessions14d: number;
  workoutDays14d: number;
  dietDays7d: number;
  todayMealCount: number;
  score: number;
}

export interface PersonaTargets {
  caloriesTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
}

export interface PersonaCalculationInput {
  profile: PersonaProfileSnapshot | null;
  goal: PersonaGoalSnapshot | null;
  onboarding: PersonaOnboardingInput | null;
  workouts: PersonaWorkoutSummary;
  meals7d: PersonaMealDaySummary[];
  todayMeals: PersonaMealDaySummary | null;
  now?: Date;
}

export interface PersonaCalculationResult {
  personaId: PersonaId;
  personaStage: PersonaStage;
  confidence: number;
  dailyState: PersonaDailyState;
  headlineMessage: string;
  nickname: string;
  sourceBreakdown: PersonaSourceBreakdown;
  dataCompleteness: PersonaDataCompleteness;
  resolvedGoal: PersonaGoal;
  resolvedFrequency: PersonaFrequency;
  resolvedDiet: PersonaDiet;
  targets: PersonaTargets;
}

interface RawScore {
  score: number;
  available: boolean;
}

interface PersonaMeta {
  id: PersonaId;
  nickname: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const PERSONA_META: Record<PersonaId, PersonaMeta> = {
  gorilla: { id: 'gorilla', nickname: '정진하는 고릴라' },
  bull: { id: 'bull', nickname: '돌진하는 황소' },
  bear: { id: 'bear', nickname: '묵직한 불곰' },
  fox: { id: 'fox', nickname: '영리한 여우' },
  cheetah: { id: 'cheetah', nickname: '날카로운 치타' },
  hawk: { id: 'hawk', nickname: '집중하는 매' },
  deer: { id: 'deer', nickname: '우아한 사슴' },
  rabbit: { id: 'rabbit', nickname: '가벼운 토끼' },
  wolf: { id: 'wolf', nickname: '절제된 늑대' },
  retriever: { id: 'retriever', nickname: '활기찬 리트리버' },
  otter: { id: 'otter', nickname: '균형 잡힌 수달' },
  sloth: { id: 'sloth', nickname: '여유로운 나무늘보' },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coalesceNumber(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function sanitizeNumber(value: number | null | undefined, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  if (value < min || value > max) {
    return null;
  }
  return value;
}

function getAccountAgeDays(createdAt?: string | null, now = new Date()) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - created.getTime()) / DAY_MS));
}

function getStageBlend(stage: PersonaStage): PersonaSourceWeights {
  switch (stage) {
    case 'starter':
      return { onboardingWeight: 0.8, behaviorWeight: 0.2 };
    case 'learning':
      return { onboardingWeight: 0.5, behaviorWeight: 0.5 };
    case 'established':
      return { onboardingWeight: 0.2, behaviorWeight: 0.8 };
  }
}

function scoreToFrequency(score: number): PersonaFrequency {
  if (score >= 0.85) return 'hardcore';
  if (score >= 0.45) return 'steady';
  return 'sporadic';
}

function scoreToDiet(score: number): PersonaDiet {
  if (score >= 0.9) return 'protein';
  if (score >= 0.7) return 'balanced';
  return 'cheater';
}

function blendScore(stage: PersonaStage, onboarding: RawScore, behavior: RawScore): number {
  if (!behavior.available) return onboarding.score;
  const weights = getStageBlend(stage);
  return onboarding.score * weights.onboardingWeight + behavior.score * weights.behaviorWeight;
}

export function mapOnboardingGoalToPersonaGoal(
  goal?: PersonaOnboardingInput['goal'],
): PersonaGoal | null {
  if (!goal) return null;
  if (goal === 'weight_loss') return 'loss';
  if (goal === 'muscle_gain' || goal === 'strength_gain') return 'gain';
  if (goal === 'maintenance' || goal === 'health') return 'maintain';
  return null;
}

export function resolveGoalDimension(
  goalType?: GoalType | null,
  onboarding?: PersonaOnboardingInput | null,
): { goal: PersonaGoal; source: PersonaSourceBreakdown['goalSource'] } {
  if (goalType) {
    return { goal: goalType, source: 'user_goal' };
  }

  const onboardingGoal = mapOnboardingGoalToPersonaGoal(onboarding?.goal);
  if (onboardingGoal) {
    return { goal: onboardingGoal, source: 'onboarding' };
  }

  return { goal: 'maintain', source: 'default' };
}

export function derivePersonaStage(input: {
  accountCreatedAt?: string | null;
  workoutSessions14d: number;
  dietDays7d: number;
  now?: Date;
}): PersonaStage {
  const accountAgeDays = getAccountAgeDays(input.accountCreatedAt, input.now);

  if (input.workoutSessions14d >= 10 || input.dietDays7d >= 7) {
    return 'established';
  }

  if (accountAgeDays !== null && accountAgeDays < 7) {
    return 'starter';
  }

  if (input.workoutSessions14d >= 3 || input.dietDays7d >= 3) {
    return 'learning';
  }

  return 'starter';
}

export function deriveTargets(
  profile: PersonaProfileSnapshot | null,
  goal: PersonaGoalSnapshot | null,
  onboarding: PersonaOnboardingInput | null,
): PersonaTargets {
  const resolvedGoal = resolveGoalDimension(goal?.goalType, onboarding).goal;
  const weightKg = sanitizeNumber(coalesceNumber(profile?.weightKg, onboarding?.weight), 25, 400);
  const age = sanitizeNumber(coalesceNumber(profile?.age, onboarding?.age), 13, 100);
  const heightCm = sanitizeNumber(coalesceNumber(profile?.heightCm, onboarding?.height), 120, 240);
  const gender = profile?.gender ?? (onboarding?.gender === 'undisclosed' ? 'other' : onboarding?.gender ?? null);
  const workoutDays = sanitizeNumber(onboarding?.workoutDaysPerWeek ?? null, 0, 14);

  let estimatedCalories: number | null = null;
  if (weightKg && age && heightCm) {
    const bmr =
      gender === 'female'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
        : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const activityMultiplier = workoutDays && workoutDays >= 5 ? 1.55 : workoutDays && workoutDays >= 3 ? 1.375 : 1.2;
    const tdee = bmr * activityMultiplier;
    estimatedCalories =
      resolvedGoal === 'loss'
        ? Math.max(Math.round(tdee - 500), 1200)
        : resolvedGoal === 'gain'
          ? Math.round(tdee + 300)
          : Math.round(tdee);
  }

  let estimatedProtein: number | null = null;
  if (weightKg) {
    const multiplier = resolvedGoal === 'loss' ? 2 : resolvedGoal === 'gain' ? 1.8 : 1.6;
    estimatedProtein = Math.round(weightKg * multiplier);
  }

  return {
    caloriesTarget: goal?.caloriesTarget ?? estimatedCalories,
    proteinTargetG: goal?.proteinTargetG ?? estimatedProtein,
    carbsTargetG: goal?.carbsTargetG ?? null,
    fatTargetG: goal?.fatTargetG ?? null,
  };
}

export function scoreWorkoutFrequencyFromBehavior(sessionCount14d: number): RawScore {
  if (sessionCount14d >= 10) return { score: 0.95, available: true };
  if (sessionCount14d >= 7) return { score: 0.82, available: true };
  if (sessionCount14d >= 4) return { score: 0.64, available: true };
  if (sessionCount14d >= 1) return { score: 0.28, available: true };
  return { score: 0, available: false };
}

export function scoreWorkoutFrequencyFromOnboarding(onboarding?: PersonaOnboardingInput | null): RawScore {
  if (!onboarding) return { score: 0.58, available: false };

  const days = onboarding.workoutDaysPerWeek ?? 3;
  if (days >= 5 || onboarding.experience === 'advanced') {
    return { score: 0.92, available: true };
  }
  if (days >= 3) {
    return { score: 0.67, available: true };
  }
  if (days >= 1) {
    return { score: onboarding.experience === 'beginner' ? 0.48 : 0.54, available: true };
  }
  return { score: 0.48, available: true };
}

function inferProteinScore(calories: number, proteinG: number) {
  if (calories <= 0 || proteinG <= 0) return 0.45;
  const density = (proteinG * 4) / Math.max(calories, 1);
  if (density >= 0.3) return 0.95;
  if (density >= 0.22) return 0.82;
  if (density >= 0.16) return 0.72;
  return 0.5;
}

function inferCalorieScore(calories: number) {
  if (calories >= 1300 && calories <= 2600) return 0.75;
  if (calories > 0) return 0.58;
  return 0.45;
}

export function scoreDietFromBehavior(
  meals7d: PersonaMealDaySummary[],
  targets: PersonaTargets,
): RawScore {
  const loggedDays = meals7d.filter((day) => day.entryCount > 0);
  if (loggedDays.length === 0) {
    return { score: 0, available: false };
  }

  const dayScores = loggedDays.map((day) => {
    const proteinScore =
      typeof targets.proteinTargetG === 'number' && targets.proteinTargetG > 0
        ? clamp(day.protein_g / targets.proteinTargetG)
        : inferProteinScore(day.calories, day.protein_g);

    const calorieScore =
      typeof targets.caloriesTarget === 'number' && targets.caloriesTarget > 0
        ? clamp(1 - Math.abs(day.calories - targets.caloriesTarget) / targets.caloriesTarget)
        : inferCalorieScore(day.calories);

    return average([proteinScore, calorieScore]);
  });

  return {
    score: clamp(average(dayScores), 0, 1),
    available: true,
  };
}

export function scoreDietFromOnboarding(onboarding?: PersonaOnboardingInput | null): RawScore {
  if (!onboarding) return { score: 0.76, available: false };

  const restrictionCount = onboarding.dietaryRestrictions?.length ?? 0;
  const goal = onboarding.goal ?? 'health';
  let score =
    goal === 'muscle_gain' || goal === 'strength_gain'
      ? 0.9
      : goal === 'weight_loss'
        ? 0.8
        : 0.76;

  if (restrictionCount >= 3) {
    score -= 0.05;
  } else if (restrictionCount >= 1) {
    score -= 0.02;
  }

  if (onboarding.overeatingHabit === 'often') {
    score -= 0.04;
  } else if (onboarding.overeatingHabit === 'sometimes') {
    score -= 0.02;
  }

  return {
    score: clamp(score, 0.72, 0.95),
    available: true,
  };
}

function applyStarterGuardrails(
  stage: PersonaStage,
  goal: PersonaGoal,
  frequency: PersonaFrequency,
  diet: PersonaDiet,
): { frequency: PersonaFrequency; diet: PersonaDiet; forcedPersonaId: PersonaId | null } {
  if (stage !== 'starter') {
    return { frequency, diet, forcedPersonaId: null };
  }

  return {
    frequency: frequency === 'sporadic' ? 'steady' : frequency,
    diet: diet === 'cheater' ? 'balanced' : diet,
    forcedPersonaId: goal === 'gain' ? 'bear' : goal === 'loss' ? 'deer' : 'retriever',
  };
}

function selectPersonaId(
  stage: PersonaStage,
  goal: PersonaGoal,
  frequency: PersonaFrequency,
  diet: PersonaDiet,
): PersonaId {
  const guarded = applyStarterGuardrails(stage, goal, frequency, diet);
  if (guarded.forcedPersonaId) {
    return guarded.forcedPersonaId;
  }

  if (goal === 'gain') {
    if (frequency === 'hardcore' && diet === 'protein') return 'gorilla';
    if (frequency === 'hardcore' || diet === 'protein') return 'bull';
    if (frequency === 'steady' && diet === 'balanced') return 'bear';
    return 'fox';
  }

  if (goal === 'loss') {
    if (frequency === 'hardcore' && diet === 'protein') return 'cheetah';
    if (frequency === 'hardcore' || diet === 'protein') return 'hawk';
    if (frequency === 'steady' && diet === 'balanced') return 'deer';
    return 'rabbit';
  }

  if (frequency === 'hardcore' && diet === 'protein') return 'wolf';
  if (frequency === 'steady' && diet === 'balanced') return 'retriever';
  if (frequency === 'hardcore' || diet === 'protein') return 'otter';
  return 'sloth';
}

export function deriveDailyState(input: {
  stage: PersonaStage;
  todayWorkoutCompleted: boolean;
  todayMeals: PersonaMealDaySummary | null;
  targets: PersonaTargets;
  accountAgeDays: number | null;
}): PersonaDailyState {
  const todayMealCount = input.todayMeals?.mealCount ?? 0;
  const calories = input.todayMeals?.calories ?? 0;
  const protein = input.todayMeals?.protein_g ?? 0;
  const caloriesTarget = input.targets.caloriesTarget;
  const proteinTarget = input.targets.proteinTargetG;

  if (input.accountAgeDays !== null && input.accountAgeDays < 3) {
    if (
      input.todayWorkoutCompleted &&
      typeof caloriesTarget === 'number' &&
      caloriesTarget > 0 &&
      calories >= caloriesTarget * 0.8 &&
      calories <= caloriesTarget * 1.1
    ) {
      return 'ACTIVE';
    }
    return 'RESTING';
  }

  if (
    input.todayWorkoutCompleted &&
    typeof proteinTarget === 'number' &&
    proteinTarget > 0 &&
    todayMealCount >= 2 &&
    protein < proteinTarget * 0.7
  ) {
    return 'TIRED';
  }

  if (
    typeof caloriesTarget === 'number' &&
    caloriesTarget > 0 &&
    todayMealCount >= 2 &&
    calories > caloriesTarget * 1.2
  ) {
    return 'FULL';
  }

  if (
    typeof caloriesTarget === 'number' &&
    caloriesTarget > 0 &&
    todayMealCount >= 2 &&
    calories < caloriesTarget * 0.7
  ) {
    return 'HUNGRY';
  }

  if (
    input.todayWorkoutCompleted &&
    typeof caloriesTarget === 'number' &&
    caloriesTarget > 0 &&
    calories >= caloriesTarget * 0.8 &&
    calories <= caloriesTarget * 1.1
  ) {
    return 'ACTIVE';
  }

  return 'RESTING';
}

function buildHeadlineMessage(input: {
  nickname: string;
  stage: PersonaStage;
  dailyState: PersonaDailyState;
}) {
  const coachingLead =
    input.stage === 'starter'
      ? '첫 주는 가볍게 기록만 해도 충분해요.'
      : input.stage === 'learning'
        ? '당신의 패턴이 조금씩 보이기 시작했어요.'
        : '이제 당신의 루틴이 꽤 선명해졌어요.';

  switch (input.dailyState) {
    case 'ACTIVE':
      return `${input.nickname} 님, 오늘 리듬이 잘 맞고 있어요.`;
    case 'HUNGRY':
      return input.stage === 'starter'
        ? '오늘 식사를 조금 더 기록해볼까요?'
        : `${input.nickname} 님, 에너지 보충을 조금 더 챙겨보면 좋아요.`;
    case 'FULL':
      return `${input.nickname} 님, 다음 끼니는 조금 가볍게 균형을 맞춰봐요.`;
    case 'TIRED':
      return `${input.nickname} 님, 운동 후엔 단백질과 회복을 조금 더 챙겨볼까요?`;
    case 'RESTING':
    default:
      return coachingLead;
  }
}

function buildDataCompleteness(input: PersonaCalculationInput, accountAgeDays: number | null): PersonaDataCompleteness {
  const dietDays7d = input.meals7d.filter((day) => day.entryCount > 0).length;
  const todayMealCount = input.todayMeals?.mealCount ?? 0;
  const score = clamp(
    average([
      input.workouts.sessionCount14d > 0 ? Math.min(input.workouts.sessionCount14d / 10, 1) : 0,
      dietDays7d > 0 ? Math.min(dietDays7d / 7, 1) : 0,
      input.profile ? 1 : 0,
      input.goal ? 1 : 0.4,
      input.onboarding ? 1 : 0.3,
    ]),
  );

  return {
    hasProfile: Boolean(input.profile),
    hasGoal: Boolean(input.goal),
    hasOnboarding: Boolean(input.onboarding),
    accountAgeDays,
    workoutSessions14d: input.workouts.sessionCount14d,
    workoutDays14d: input.workouts.activeDays14d,
    dietDays7d,
    todayMealCount,
    score: round(score),
  };
}

function buildConfidence(stage: PersonaStage, completenessScore: number) {
  const range =
    stage === 'starter'
      ? [0.28, 0.58]
      : stage === 'learning'
        ? [0.44, 0.76]
        : [0.74, 0.96];

  return round(range[0] + (range[1] - range[0]) * completenessScore);
}

export function calculatePersonaProfile(input: PersonaCalculationInput): PersonaCalculationResult {
  const now = input.now ?? new Date();
  const accountAgeDays = getAccountAgeDays(input.profile?.createdAt, now);
  const targets = deriveTargets(input.profile, input.goal, input.onboarding);
  const stage = derivePersonaStage({
    accountCreatedAt: input.profile?.createdAt,
    workoutSessions14d: input.workouts.sessionCount14d,
    dietDays7d: input.meals7d.filter((day) => day.entryCount > 0).length,
    now,
  });

  const resolvedGoal = resolveGoalDimension(input.goal?.goalType, input.onboarding);
  const frequencyOnboarding = scoreWorkoutFrequencyFromOnboarding(input.onboarding);
  const frequencyBehavior = scoreWorkoutFrequencyFromBehavior(input.workouts.sessionCount14d);
  const dietOnboarding = scoreDietFromOnboarding(input.onboarding);
  const dietBehavior = scoreDietFromBehavior(input.meals7d, targets);

  const blendedFrequencyScore = blendScore(stage, frequencyOnboarding, frequencyBehavior);
  const blendedDietScore = blendScore(stage, dietOnboarding, dietBehavior);

  const guarded = applyStarterGuardrails(
    stage,
    resolvedGoal.goal,
    scoreToFrequency(blendedFrequencyScore),
    scoreToDiet(blendedDietScore),
  );

  const personaId = selectPersonaId(stage, resolvedGoal.goal, guarded.frequency, guarded.diet);
  const nickname = PERSONA_META[personaId].nickname;
  const dataCompleteness = buildDataCompleteness(input, accountAgeDays);
  const confidence = buildConfidence(stage, dataCompleteness.score);
  const dailyState = deriveDailyState({
    stage,
    todayWorkoutCompleted: input.workouts.completedToday,
    todayMeals: input.todayMeals,
    targets,
    accountAgeDays,
  });

  const frequencyWeights = frequencyBehavior.available
    ? getStageBlend(stage)
    : { onboardingWeight: 1, behaviorWeight: 0 };
  const dietWeights = dietBehavior.available
    ? getStageBlend(stage)
    : { onboardingWeight: 1, behaviorWeight: 0 };

  return {
    personaId,
    personaStage: stage,
    confidence,
    dailyState,
    headlineMessage: buildHeadlineMessage({
      nickname,
      stage,
      dailyState,
    }),
    nickname,
    sourceBreakdown: {
      overall: {
        onboardingWeight: round(average([frequencyWeights.onboardingWeight, dietWeights.onboardingWeight])),
        behaviorWeight: round(average([frequencyWeights.behaviorWeight, dietWeights.behaviorWeight])),
      },
      frequency: frequencyWeights,
      diet: dietWeights,
      goalSource: resolvedGoal.source,
      workoutSessions14d: input.workouts.sessionCount14d,
      dietDays7d: input.meals7d.filter((day) => day.entryCount > 0).length,
      aiOnboardingUsed: Boolean(input.onboarding),
    },
    dataCompleteness,
    resolvedGoal: resolvedGoal.goal,
    resolvedFrequency: guarded.frequency,
    resolvedDiet: guarded.diet,
    targets,
  };
}
