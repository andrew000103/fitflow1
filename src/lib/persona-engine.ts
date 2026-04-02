import type { GoalType } from '../types/profile';
import { CHARACTER_LEVELS, type CharacterLevelId } from './pixel-character-config';

export type { CharacterLevelId } from './pixel-character-config';

export type PersonaDailyState = 'ACTIVE' | 'RESTING' | 'HUNGRY' | 'FULL' | 'TIRED';


export interface PersonaOnboardingInput {
  goal?: 'weight_loss' | 'muscle_gain' | 'lean_bulk' | 'strength_gain' | 'maintenance' | 'health' | null;
  experience?: 'beginner' | 'novice' | 'intermediate' | 'upper_intermediate' | 'advanced' | null;
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
  totalCompletedSessions: number;
  sessionCount14d: number;
  sessionCount28d: number;
  sessionCount56d: number;
  activeDays14d: number;
  activeDays28d: number;
  activeDays56d: number;
  completedToday: boolean;
  latestCompletedAt: string | null;
}

export interface PersonaGoalSnapshot {
  goalType?: GoalType | null;
  caloriesTarget?: number | null;
  proteinTargetG?: number | null;
  carbsTargetG?: number | null;
  fatTargetG?: number | null;
}

export interface EvolutionChecklistItem {
  id: string;
  label: string;
  current: number;
  target: number;
  complete: boolean;
}

export interface PersonaCalculationInput {
  goal: PersonaGoalSnapshot | null;
  onboarding: PersonaOnboardingInput | null;
  workouts: PersonaWorkoutSummary;
  meals14d: PersonaMealDaySummary[];
  meals28d: PersonaMealDaySummary[];
  meals56d: PersonaMealDaySummary[];
  todayMeals: PersonaMealDaySummary | null;
}

export interface PersonaCalculationResult {
  levelId: CharacterLevelId;
  levelName: string;
  nextLevelId: CharacterLevelId | null;
  nextLevelName: string | null;
  progressToNext: number;
  headlineMessage: string;
  progressMessage: string;
  checklist: EvolutionChecklistItem[];
  dailyState: PersonaDailyState;
}

interface LevelRequirement {
  metric: MetricId;
  target: number;
  label: string;
}

interface LevelMeta {
  id: CharacterLevelId;
  name: string;
  vibe: string;
  description: string;
  requirements: LevelRequirement[];
}

type MetricId =
  | 'total_workouts'
  | 'workouts_14d'
  | 'workouts_28d'
  | 'workouts_56d'
  | 'active_days_14d'
  | 'active_days_28d'
  | 'active_days_56d'
  | 'diet_logs_14d'
  | 'diet_logs_28d'
  | 'protein_hits_14d'
  | 'nutrition_hits_14d'
  | 'nutrition_hits_28d';

interface ProgressMetrics {
  total_workouts: number;
  workouts_14d: number;
  workouts_28d: number;
  workouts_56d: number;
  active_days_14d: number;
  active_days_28d: number;
  active_days_56d: number;
  diet_logs_14d: number;
  diet_logs_28d: number;
  protein_hits_14d: number;
  nutrition_hits_14d: number;
  nutrition_hits_28d: number;
}

const LEVELS: LevelMeta[] = [
  {
    id: 'beginner',
    name: '초심자',
    vibe: '첫 루틴을 시작한 픽셀',
    description: '오늘 처음으로 운동화 끈을 묶었습니다. 러닝머신 버튼이 어디 있는지도 모르고, 덤벨은 왜 이렇게 종류가 많은지도 모르겠어요. 근데 있잖아요, 모르면서도 여기까지 온 것 자체가 이미 대단한 거예요. 이 픽셀, 분명히 뭔가 됩니다.',
    requirements: [],
  },
  {
    id: 'novice',
    name: '초급자',
    vibe: '몸이 운동 리듬을 익히는 픽셀',
    description: '헬스장 가는 길이 이제 조금 익숙해졌어요. 줄넘기가 가끔 발에 걸리고, 다음 날 계단이 무서워지는 날도 있지만, 그게 다 성장통이라는 걸 이 픽셀는 이미 알고 있어요. 포기 안 하는 것, 그게 제일 어려운 스킬인데 이미 장착 완료입니다.',
    requirements: [{ metric: 'total_workouts', target: 3, label: '누적 운동' }],
  },
  {
    id: 'intermediate',
    name: '중급자',
    vibe: '운동이 일상에 들어온 픽셀',
    description: '슬슬 보입니다. 3개월 전 나랑 지금 나 사이의 차이가. 거울 속 픽셀가 달라졌고, 들고 있는 무게도 달라졌어요. 남들한테 보여주려고 시작했든, 건강 때문에 시작했든, 이제는 그냥 하고 싶어서 하게 됩니다. 이게 진짜 운동러의 시작이에요.',
    requirements: [
      { metric: 'total_workouts', target: 8, label: '누적 운동' },
      { metric: 'active_days_14d', target: 4, label: '최근 14일 운동한 날' },
    ],
  },
  {
    id: 'upper_intermediate',
    name: '중상급자',
    vibe: '루틴이 꽤 안정된 픽셀',
    description: '루틴이 생겼습니다. 어떤 날은 하기 싫어도 몸이 먼저 헬스장 방향으로 걸어가고 있어요. 기구 세팅도 척척, 세트 사이 쉬는 시간도 대충 맞아 들어가는 수준. 주변 픽셀들이 슬쩍 따라 하기 시작했지만, 이 픽셀는 이미 다음 동작으로 넘어간 뒤예요.',
    requirements: [
      { metric: 'total_workouts', target: 15, label: '누적 운동' },
      { metric: 'active_days_14d', target: 6, label: '최근 14일 운동한 날' },
      { metric: 'diet_logs_14d', target: 3, label: '최근 14일 식단 기록' },
    ],
  },
  {
    id: 'advanced',
    name: '상급자',
    vibe: '운동과 식단을 함께 챙기는 픽셀',
    description: '운동이 숙제에서 언어가 된 픽셀입니다. 몸으로 대화하고, 무게로 표현하고, 루틴으로 하루를 설계해요. 쉬는 날도 스트레칭은 하고 있고, 밥 먹을 때도 단백질 계산이 자동으로 돌아가는 뇌 구조. 이쯤 되면 운동이 삶의 일부가 아니라, 삶 자체가 운동 중심으로 재편된 겁니다.',
    requirements: [
      { metric: 'total_workouts', target: 25, label: '누적 운동' },
      { metric: 'active_days_28d', target: 10, label: '최근 28일 운동한 날' },
      { metric: 'diet_logs_14d', target: 5, label: '최근 14일 식단 기록' },
    ],
  },
  {
    id: 'veteran',
    name: '고인물',
    vibe: '운동 냄새만 맡아도 몸이 반응하는 픽셀',
    description: '몇 년째 같은 자리, 같은 시간, 같은 기구. 근데 이 픽셀의 몸은 매년 달라지고 있어요. 변화 없어 보이는 루틴 안에서 조금씩, 꾸준히, 묵묵히 쌓아온 것들이 있거든요. 헬스장 직원보다 이 공간을 더 잘 아는 존재. 전설은 갑자기 나타나는 게 아니라 이렇게 만들어집니다.',
    requirements: [
      { metric: 'total_workouts', target: 40, label: '누적 운동' },
      { metric: 'active_days_28d', target: 12, label: '최근 28일 운동한 날' },
      { metric: 'protein_hits_14d', target: 4, label: '최근 14일 단백질 목표 달성' },
    ],
  },
  {
    id: 'artisan',
    name: '달인',
    vibe: '꾸준함이 묵직해진 픽셀',
    description: '더 이상 무게가 목표가 아니에요. 완성도가 목표입니다. 1kg 차이도 폼이 무너지면 의미 없다는 걸 몸으로 아는 경지예요. 기록보다 감각을 믿고, 숫자보다 질을 쫓는 픽셀. 옆에서 보면 조용한데, 자세히 보면 모든 동작이 정교하게 설계되어 있어요. 장인이란 게 바로 이런 거죠.',
    requirements: [
      { metric: 'total_workouts', target: 60, label: '누적 운동' },
      { metric: 'active_days_28d', target: 14, label: '최근 28일 운동한 날' },
      { metric: 'diet_logs_14d', target: 7, label: '최근 14일 식단 기록' },
    ],
  },
  {
    id: 'master',
    name: '마스터',
    vibe: '루틴을 통제하는 픽셀',
    description: '헬스장에서 이 픽셀가 운동을 시작하면, 주변 소음이 줄어드는 것 같은 느낌이 납니다. 실제로는 아무것도 안 바뀌었는데, 분위기가 바뀌어요. 오랜 시간이 만들어낸 집중력과 무게감이 공간을 채우는 거예요. 말 한마디 없어도 존경받는 픽셀, 마스터는 그런 존재입니다.',
    requirements: [
      { metric: 'total_workouts', target: 85, label: '누적 운동' },
      { metric: 'active_days_28d', target: 16, label: '최근 28일 운동한 날' },
      { metric: 'protein_hits_14d', target: 6, label: '최근 14일 단백질 목표 달성' },
    ],
  },
  {
    id: 'grandmaster',
    name: '그랜드마스터',
    vibe: '기록이 쌓여 존재감이 생긴 픽셀',
    description: '이미 증명할 게 없는 픽셀에요. 남한테 보여줄 필요도, 기록을 자랑할 필요도 없어요. 그냥 하면 됩니다. 오늘도 어제처럼, 내일도 오늘처럼. 그 반복이 쌓여서 이 경지까지 온 거니까요. 누가 쳐다봐도, 안 쳐다봐도 똑같은 루틴. 그게 그랜드마스터의 힘입니다.',
    requirements: [
      { metric: 'total_workouts', target: 115, label: '누적 운동' },
      { metric: 'active_days_28d', target: 18, label: '최근 28일 운동한 날' },
      { metric: 'nutrition_hits_14d', target: 8, label: '최근 14일 영양 목표 달성' },
    ],
  },
  {
    id: 'god',
    name: '신',
    vibe: '루틴의 끝에 도달한 픽셀',
    description: '월계관, 날개, 지구 한 알. 이 픽셀한테 운동 몇 년 했냐고 물어보는 건 실례입니다. 시간을 초월한 존재니까요. 무게를 드는 게 아니라 중력이 이 픽셀한테 협조하는 거예요. 말이 필요 없고, 설명이 필요 없고, 그냥 빛납니다. 그게 다예요.',
    requirements: [
      { metric: 'total_workouts', target: 240, label: '누적 운동' },
      { metric: 'workouts_56d', target: 40, label: '최근 56일 운동' },
      { metric: 'active_days_56d', target: 28, label: '최근 56일 활동일' },
      { metric: 'nutrition_hits_28d', target: 16, label: '최근 28일 영양 목표 달성' },
    ],
  },
];



/**
 * 픽셀 캐릭터 레벨 메타 (10단계)
 * pixel-character-config.ts의 CHARACTER_LEVELS와 동기화됨
 */
export const CHARACTER_LEVEL_META = CHARACTER_LEVELS;

const START_LEVEL_BY_EXPERIENCE: Record<NonNullable<PersonaOnboardingInput['experience']>, CharacterLevelId> = {
  beginner: 'beginner',
  novice: 'novice',
  intermediate: 'intermediate',
  upper_intermediate: 'upper_intermediate',
  advanced: 'advanced',
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function countLoggedDays(days: PersonaMealDaySummary[]) {
  return days.filter((day) => day.entryCount > 0).length;
}

function countProteinHitDays(days: PersonaMealDaySummary[], proteinTarget?: number | null) {
  if (!proteinTarget || proteinTarget <= 0) return 0;
  return days.filter((day) => day.entryCount > 0 && day.protein_g >= proteinTarget * 0.9).length;
}

function countNutritionHitDays(
  days: PersonaMealDaySummary[],
  caloriesTarget?: number | null,
  proteinTarget?: number | null,
) {
  return days.filter((day) => {
    if (day.entryCount <= 0) return false;

    const calorieHit = caloriesTarget && caloriesTarget > 0
      ? day.calories >= caloriesTarget * 0.8 && day.calories <= caloriesTarget * 1.15
      : false;
    const proteinHit = proteinTarget && proteinTarget > 0 ? day.protein_g >= proteinTarget * 0.9 : false;
    return calorieHit || proteinHit;
  }).length;
}

function buildMetrics(input: PersonaCalculationInput): ProgressMetrics {
  return {
    total_workouts: input.workouts.totalCompletedSessions,
    workouts_14d: input.workouts.sessionCount14d,
    workouts_28d: input.workouts.sessionCount28d,
    workouts_56d: input.workouts.sessionCount56d,
    active_days_14d: input.workouts.activeDays14d,
    active_days_28d: input.workouts.activeDays28d,
    active_days_56d: input.workouts.activeDays56d,
    diet_logs_14d: countLoggedDays(input.meals14d),
    diet_logs_28d: countLoggedDays(input.meals28d),
    protein_hits_14d: countProteinHitDays(input.meals14d, input.goal?.proteinTargetG),
    nutrition_hits_14d: countNutritionHitDays(
      input.meals14d,
      input.goal?.caloriesTarget,
      input.goal?.proteinTargetG,
    ),
    nutrition_hits_28d: countNutritionHitDays(
      input.meals28d,
      input.goal?.caloriesTarget,
      input.goal?.proteinTargetG,
    ),
  };
}

function getLevelIndex(levelId: CharacterLevelId) {
  return LEVELS.findIndex((level) => level.id === levelId);
}

function getStartLevelId(onboarding?: PersonaOnboardingInput | null): CharacterLevelId {
  const experience = onboarding?.experience;
  return experience ? START_LEVEL_BY_EXPERIENCE[experience] : 'beginner';
}

function meetsLevel(level: LevelMeta, metrics: ProgressMetrics) {
  return level.requirements.every((requirement) => metrics[requirement.metric] >= requirement.target);
}

function getTotalWorkoutRequirement(level: LevelMeta) {
  return level.requirements.find((requirement) => requirement.metric === 'total_workouts')?.target ?? 0;
}

function buildChecklist(requirements: LevelRequirement[], metrics: ProgressMetrics): EvolutionChecklistItem[] {
  return requirements.map((requirement) => ({
    id: requirement.metric,
    label: requirement.label,
    current: metrics[requirement.metric],
    target: requirement.target,
    complete: metrics[requirement.metric] >= requirement.target,
  }));
}

function buildProgress(requirements: LevelRequirement[], metrics: ProgressMetrics) {
  if (requirements.length === 0) return 1;

  const weightByMetric: Partial<Record<MetricId, number>> = {
    total_workouts: 0.5,
    workouts_14d: 0.3,
    workouts_28d: 0.3,
    workouts_56d: 0.25,
    active_days_14d: 0.35,
    active_days_28d: 0.35,
    active_days_56d: 0.15,
    diet_logs_14d: 0.2,
    diet_logs_28d: 0.2,
    protein_hits_14d: 0.2,
    nutrition_hits_14d: 0.2,
    nutrition_hits_28d: 0.2,
  };

  const weights = requirements.map((requirement) => weightByMetric[requirement.metric] ?? 0.2);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  const progress = requirements.reduce((sum, requirement, index) => {
    const ratio = clamp(metrics[requirement.metric] / requirement.target);
    return sum + ratio * weights[index];
  }, 0);

  return round(totalWeight > 0 ? progress / totalWeight : 0);
}

function getCurrentAndNextLevel(metrics: ProgressMetrics, onboarding?: PersonaOnboardingInput | null) {
  const startIndex = getLevelIndex(getStartLevelId(onboarding));
  let currentIndex = startIndex;

  for (let index = startIndex + 1; index < LEVELS.length; index += 1) {
    const totalWorkoutGate = getTotalWorkoutRequirement(LEVELS[index]);
    if (metrics.total_workouts < totalWorkoutGate) break;
    currentIndex = index;
  }

  return {
    currentLevel: LEVELS[currentIndex],
    nextLevel: LEVELS[currentIndex + 1] ?? null,
  };
}

function buildDailyState(input: PersonaCalculationInput): PersonaDailyState {
  const caloriesTarget = input.goal?.caloriesTarget ?? null;
  const proteinTarget = input.goal?.proteinTargetG ?? null;
  const today = input.todayMeals;

  if (!today || today.entryCount === 0) {
    return input.workouts.completedToday ? 'TIRED' : 'RESTING';
  }

  if (caloriesTarget && today.calories < caloriesTarget * 0.45) {
    return 'HUNGRY';
  }

  if (caloriesTarget && today.calories > caloriesTarget * 1.2) {
    return 'FULL';
  }

  if (input.workouts.completedToday && proteinTarget && today.protein_g < proteinTarget * 0.75) {
    return 'TIRED';
  }

  if (input.workouts.completedToday) {
    return 'ACTIVE';
  }

  return 'RESTING';
}

function buildHeadlineMessage(level: LevelMeta, nextLevel: LevelMeta | null, progressToNext: number) {
  if (!nextLevel) {
    return `${level.name} 픽셀에 도달했어요. 지금은 완성형 루틴을 유지하는 구간이에요.`;
  }

  if (progressToNext >= 1) {
    return `${nextLevel.name} 진화 조건을 채웠어요. 이번 갱신에서 바로 진화합니다.`;
  }

  if (progressToNext >= 0.8) {
    return `${level.name} 픽셀가 ${nextLevel.name} 진화를 코앞에 두고 있어요.`;
  }

  return `${level.name} 픽셀가 차근차근 ${nextLevel.name}을 향해 성장 중이에요.`;
}

function buildProgressMessage(
  level: LevelMeta,
  nextLevel: LevelMeta | null,
  checklist: EvolutionChecklistItem[],
  progressToNext: number,
) {
  if (!nextLevel) {
    return `${level.vibe}. 지금은 기록을 유지하는 것만으로도 충분해요.`;
  }

  const incomplete = checklist
    .filter((item) => !item.complete)
    .sort((a, b) => (a.target - a.current) - (b.target - b.current))[0];

  if (!incomplete) {
    return `${nextLevel.name} 진화 준비가 끝났어요. 홈에 들어올 때마다 최신 상태로 반영돼요.`;
  }

  const remaining = Math.max(incomplete.target - incomplete.current, 0);

  if (progressToNext >= 0.75) {
    return `${incomplete.label} ${remaining}${incomplete.label.includes('운동') || incomplete.label.includes('기록') || incomplete.label.includes('달성') ? '회' : ''}만 더 채우면 ${nextLevel.name}로 진화해요.`;
  }

  return `${nextLevel.name}까지 ${Math.round(progressToNext * 100)}%. 지금은 ${incomplete.label}을 ${remaining}만큼 더 쌓는 게 가장 빨라요.`;
}

export function calculatePersonaProfile(input: PersonaCalculationInput): PersonaCalculationResult {
  const metrics = buildMetrics(input);
  const { currentLevel, nextLevel } = getCurrentAndNextLevel(metrics, input.onboarding);
  const checklist = nextLevel ? buildChecklist(nextLevel.requirements, metrics) : [];
  const progressToNext = nextLevel ? buildProgress(nextLevel.requirements, metrics) : 1;
  const dailyState = buildDailyState(input);

  return {
    levelId: currentLevel.id,
    levelName: currentLevel.name,
    nextLevelId: nextLevel?.id ?? null,
    nextLevelName: nextLevel?.name ?? null,
    progressToNext,
    headlineMessage: buildHeadlineMessage(currentLevel, nextLevel, progressToNext),
    progressMessage: buildProgressMessage(currentLevel, nextLevel, checklist, progressToNext),
    checklist,
    dailyState,
  };
}
