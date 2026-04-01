import type { HamsterLevelId } from './persona-engine';
import type {
  AIExperience,
  AIGender,
  GymType,
  OnboardingData,
  StrengthEntry,
} from '../stores/ai-plan-store';

export type SurveyLevelId = Extract<
  HamsterLevelId,
  'beginner' | 'novice' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'veteran'
>;

type BigThreeKey = 'squat' | 'bench' | 'deadlift';

interface SurveyLevelMeta {
  id: SurveyLevelId;
  name: string;
  shortDescription: string;
  detail: string;
}

export interface SurveyLevelScoreBreakdown {
  experience: number;
  frequency: number;
  gymType: number;
  strengthEntries: number;
  strengthTotal: number;
  recovery: number;
  sleep: number;
  plateau: number;
  goal: number;
  total: number;
}

export interface SurveyLevelResult {
  levelId: SurveyLevelId;
  levelName: string;
  title: string;
  shortDescription: string;
  detail: string;
  rationaleTags: string[];
  reasons: string[];
  scoreBreakdown: SurveyLevelScoreBreakdown;
  totalScore: number;
  strongLevelCandidate: boolean;
  veteranQualified: boolean;
  bigThreeTotalKg: number | null;
  bigThreeEnteredCount: number;
}

const LEVEL_ORDER: SurveyLevelId[] = [
  'beginner',
  'novice',
  'intermediate',
  'upper_intermediate',
  'advanced',
  'veteran',
];

const LEVEL_META: Record<SurveyLevelId, SurveyLevelMeta> = {
  beginner: {
    id: 'beginner',
    name: '초심자',
    shortDescription: '첫 루틴을 안정적으로 시작하는 단계',
    detail: '지금은 완벽함보다 시작과 적응이 더 중요해요. 무리하지 않고 운동 습관을 만드는 것만으로도 충분히 좋은 출발입니다.',
  },
  novice: {
    id: 'novice',
    name: '초급자',
    shortDescription: '기초 루틴이 자리를 잡기 시작한 단계',
    detail: '헬스장과 기본 동작이 조금씩 익숙해지는 구간이에요. 일관성을 유지하면 몸 변화가 눈에 띄기 시작합니다.',
  },
  intermediate: {
    id: 'intermediate',
    name: '중급자',
    shortDescription: '운동이 생활 안으로 들어온 단계',
    detail: '운동 빈도와 루틴 이해도가 어느 정도 확보된 상태예요. 이제는 단순 반복보다 방향성 있는 설계가 점점 중요해집니다.',
  },
  upper_intermediate: {
    id: 'upper_intermediate',
    name: '중상급자',
    shortDescription: '루틴과 자기 조절이 꽤 안정된 단계',
    detail: '운동 경험과 루틴 수행력이 분명히 쌓였어요. 작은 차이가 성과를 가르는 구간이라 회복과 강도 관리가 중요합니다.',
  },
  advanced: {
    id: 'advanced',
    name: '상급자',
    shortDescription: '루틴을 스스로 조정할 수 있는 단계',
    detail: '운동 경험과 강도 이해도가 높아서, 이제는 더 정교한 프로그램 설계가 성과에 직접 영향을 줍니다.',
  },
  veteran: {
    id: 'veteran',
    name: '고인물',
    shortDescription: '상급 루틴과 중량 기준까지 통과한 단계',
    detail: '오랜 훈련 경험뿐 아니라 실제 수행 강도까지 확인된 상태예요. 단순 운동 경력보다 검증된 훈련 수준이 느껴지는 구간입니다.',
  },
};

const EXPERIENCE_POINTS: Record<AIExperience, number> = {
  beginner: 0,
  novice: 1,
  intermediate: 2,
  upper_intermediate: 3,
  advanced: 4,
};

const EXPERIENCE_MAX_LEVEL: Record<AIExperience, SurveyLevelId> = {
  beginner: 'novice',
  novice: 'intermediate',
  intermediate: 'upper_intermediate',
  upper_intermediate: 'advanced',
  advanced: 'veteran',
};

const GYM_TYPE_POINTS: Record<GymType, number> = {
  bodyweight: 0,
  dumbbell_only: 1,
  full_gym: 2,
  garage_gym: 2,
};

const GYM_TYPE_LABEL: Record<GymType, string> = {
  bodyweight: '맨몸 운동',
  dumbbell_only: '덤벨 위주',
  full_gym: '헬스장',
  garage_gym: '홈짐/파워랙',
};

const GOAL_POINTS: Partial<Record<OnboardingData['goal'], number>> = {
  strength_gain: 1,
  muscle_gain: 1,
  lean_bulk: 1,
};

const BIG_THREE_NAME_MAP: Record<BigThreeKey, string> = {
  squat: '바벨 스쿼트',
  bench: '벤치프레스',
  deadlift: '컨벤셔널 데드리프트',
};

const BIG_THREE_ALIASES: Record<string, BigThreeKey> = {
  '바벨 스쿼트': 'squat',
  스쿼트: 'squat',
  squat: 'squat',
  '벤치프레스': 'bench',
  벤치: 'bench',
  bench: 'bench',
  '컨벤셔널 데드리프트': 'deadlift',
  데드리프트: 'deadlift',
  deadlift: 'deadlift',
};

const BIG_THREE_TOTAL_THRESHOLDS: Record<
  Exclude<AIGender, 'undisclosed'>,
  { tier1: number; tier2: number; veteran: number }
> = {
  male: { tier1: 350, tier2: 430, veteran: 500 },
  female: { tier1: 200, tier2: 260, veteran: 300 },
};

function getLevelIndex(levelId: SurveyLevelId) {
  return LEVEL_ORDER.indexOf(levelId);
}

function getLowerLevel(left: SurveyLevelId, right: SurveyLevelId): SurveyLevelId {
  return getLevelIndex(left) <= getLevelIndex(right) ? left : right;
}

function getFrequencyPoints(days: number) {
  if (days >= 6) return 4;
  if (days === 5) return 3;
  if (days === 4) return 2;
  if (days === 3) return 1;
  return 0;
}

function getFrequencyMaxLevel(days: number): SurveyLevelId {
  if (days <= 2) return 'intermediate';
  return 'veteran';
}

function normalizeStrengthName(name: string) {
  return name.trim().toLowerCase();
}

function mapStrengthEntry(entry: StrengthEntry): { key: BigThreeKey; weightKg: number } | null {
  const normalized = normalizeStrengthName(entry.exercise);
  const key = BIG_THREE_ALIASES[normalized] ?? BIG_THREE_ALIASES[entry.exercise.trim()];
  if (!key || !Number.isFinite(entry.weightKg) || entry.weightKg <= 0) return null;
  return { key, weightKg: entry.weightKg };
}

function getBigThreeEntries(strengthProfile?: StrengthEntry[]) {
  const mappedEntries = (strengthProfile ?? [])
    .map(mapStrengthEntry)
    .filter((entry): entry is { key: BigThreeKey; weightKg: number } => Boolean(entry));

  const latestByKey = new Map<BigThreeKey, number>();
  for (const entry of mappedEntries) {
    latestByKey.set(entry.key, entry.weightKg);
  }

  return latestByKey;
}

function getStrengthEntryPoints(count: number) {
  if (count >= 3) return 3;
  if (count === 2) return 2;
  if (count === 1) return 1;
  return 0;
}

function getStrengthTotalPoints(gender: AIGender, bigThreeTotalKg: number | null) {
  if (gender === 'undisclosed' || bigThreeTotalKg === null) return 0;

  const thresholds = BIG_THREE_TOTAL_THRESHOLDS[gender];
  if (bigThreeTotalKg >= thresholds.veteran) return 3;
  if (bigThreeTotalKg >= thresholds.tier2) return 2;
  if (bigThreeTotalKg >= thresholds.tier1) return 1;
  return 0;
}

function getAdjustmentPoints(data: OnboardingData) {
  return {
    recovery:
      data.recoveryLevel === 'easy' ? 1 : data.recoveryLevel === 'hard' ? -1 : 0,
    sleep:
      data.sleepQuality === 'good' ? 1 : data.sleepQuality === 'poor' ? -1 : 0,
    plateau:
      data.plateauHistory === '없음' ? 1 : data.plateauHistory ? -1 : 0,
    goal: GOAL_POINTS[data.goal] ?? 0,
  };
}

function getLevelByScore(score: number): SurveyLevelId {
  if (score >= 12) return 'veteran';
  if (score >= 10) return 'advanced';
  if (score >= 8) return 'upper_intermediate';
  if (score >= 6) return 'intermediate';
  if (score >= 3) return 'novice';
  return 'beginner';
}

function qualifiesForVeteran(data: OnboardingData, bigThreeCount: number, bigThreeTotalKg: number | null) {
  if (data.experience !== 'advanced') return false;
  if (data.workoutDaysPerWeek < 4) return false;
  if (data.gymType !== 'full_gym' && data.gymType !== 'garage_gym') return false;
  if (data.gender === 'undisclosed') return false;
  if (bigThreeCount < 3 || bigThreeTotalKg === null) return false;
  return bigThreeTotalKg >= BIG_THREE_TOTAL_THRESHOLDS[data.gender].veteran;
}

function buildRationaleTags(data: OnboardingData, bigThreeCount: number, bigThreeTotalKg: number | null) {
  const tags = [
    `운동 경험: ${LEVEL_META[EXPERIENCE_MAX_LEVEL[data.experience]].name} 후보군`,
    `주 ${data.workoutDaysPerWeek}일 운동`,
    `운동 환경: ${GYM_TYPE_LABEL[data.gymType]}`,
  ];

  if (bigThreeCount > 0) {
    tags.push(`3대 입력 ${bigThreeCount}개`);
  }

  if (bigThreeTotalKg !== null) {
    tags.push(`3대 합 ${bigThreeTotalKg}kg`);
  }

  if (data.goal === 'strength_gain') {
    tags.push('근력 향상 목표');
  }

  return tags;
}

function buildReasons(
  data: OnboardingData,
  levelId: SurveyLevelId,
  veteranQualified: boolean,
  bigThreeCount: number,
  bigThreeTotalKg: number | null,
) {
  const reasons = [
    `${LEVEL_META[levelId].name} 판정은 운동 경험, 주당 빈도, 운동 환경, 회복 상태를 함께 반영했어요.`,
  ];

  if (bigThreeCount > 0) {
    reasons.push(`입력된 주요 중량 ${bigThreeCount}개를 강도 판정에 반영했어요.`);
  } else {
    reasons.push('중량 정보가 없어서 고강도 판정은 보수적으로 제한했어요.');
  }

  if (bigThreeTotalKg !== null) {
    reasons.push(`현재 입력 기준 3대 합은 ${bigThreeTotalKg}kg로 계산됐어요.`);
  }

  if (!veteranQualified && levelId !== 'veteran' && data.experience === 'advanced') {
    reasons.push('고인물 판정은 상급 경험 외에도 3대 기록과 훈련 환경 기준을 함께 통과해야 열려요.');
  }

  if (data.gender === 'undisclosed') {
    reasons.push('성별 미선택 상태에서는 고인물 컷 판정을 보수적으로 잠가두었어요.');
  }

  return reasons;
}

export function classifySurveyLevel(data: OnboardingData): SurveyLevelResult {
  const bigThreeEntries = getBigThreeEntries(data.strengthProfile);
  const bigThreeEnteredCount = bigThreeEntries.size;
  const bigThreeTotalKg = bigThreeEnteredCount > 0
    ? Array.from(bigThreeEntries.values()).reduce((sum, weight) => sum + weight, 0)
    : null;

  const adjustmentPoints = getAdjustmentPoints(data);
  const scoreBreakdown: SurveyLevelScoreBreakdown = {
    experience: EXPERIENCE_POINTS[data.experience],
    frequency: getFrequencyPoints(data.workoutDaysPerWeek),
    gymType: GYM_TYPE_POINTS[data.gymType],
    strengthEntries: getStrengthEntryPoints(bigThreeEnteredCount),
    strengthTotal: getStrengthTotalPoints(data.gender, bigThreeTotalKg),
    recovery: adjustmentPoints.recovery,
    sleep: adjustmentPoints.sleep,
    plateau: adjustmentPoints.plateau,
    goal: adjustmentPoints.goal,
    total: 0,
  };

  scoreBreakdown.total = Object.entries(scoreBreakdown)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);

  const rawLevel = getLevelByScore(scoreBreakdown.total);
  let maxAllowedLevel = EXPERIENCE_MAX_LEVEL[data.experience];
  maxAllowedLevel = getLowerLevel(maxAllowedLevel, getFrequencyMaxLevel(data.workoutDaysPerWeek));

  if (data.strengthProfile?.length !== undefined && data.strengthProfile.length === 0) {
    maxAllowedLevel = getLowerLevel(maxAllowedLevel, 'advanced');
  }

  if (data.gymType === 'bodyweight') {
    maxAllowedLevel = getLowerLevel(maxAllowedLevel, 'advanced');
  }

  const strongLevelCandidate = getLevelIndex(rawLevel) >= getLevelIndex('advanced');
  const veteranQualified = qualifiesForVeteran(data, bigThreeEnteredCount, bigThreeTotalKg);

  let finalLevel = getLowerLevel(rawLevel, maxAllowedLevel);
  if (rawLevel === 'veteran' && !veteranQualified) {
    finalLevel = 'advanced';
  } else if (finalLevel !== 'veteran' && veteranQualified) {
    finalLevel = 'veteran';
  }

  const meta = LEVEL_META[finalLevel];
  return {
    levelId: meta.id,
    levelName: meta.name,
    title: `${meta.name} 햄식이`,
    shortDescription: meta.shortDescription,
    detail: meta.detail,
    rationaleTags: buildRationaleTags(data, bigThreeEnteredCount, bigThreeTotalKg),
    reasons: buildReasons(data, finalLevel, veteranQualified, bigThreeEnteredCount, bigThreeTotalKg),
    scoreBreakdown,
    totalScore: scoreBreakdown.total,
    strongLevelCandidate,
    veteranQualified,
    bigThreeTotalKg,
    bigThreeEnteredCount,
  };
}

export const SURVEY_LEVEL_META = LEVEL_ORDER.map((levelId) => LEVEL_META[levelId]);
export const SURVEY_BIG_THREE_THRESHOLDS = BIG_THREE_TOTAL_THRESHOLDS;
export const SURVEY_BIG_THREE_LABELS = BIG_THREE_NAME_MAP;
