import {
  CHARACTER_LEVELS,
  type CharacterArchetypeId,
  type CharacterLevelId,
  type PixelVariantId,
} from './pixel-character-config';
import type {
  AIExperience,
  AIGender,
  GymType,
  OnboardingData,
  StrengthEntry,
} from '../stores/ai-plan-store';

export type SurveyLevelId = Extract<
  CharacterLevelId,
  'beginner' | 'novice' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'veteran'
>;

type BigThreeKey = 'squat' | 'bench' | 'deadlift';
type BinaryGender = Extract<AIGender, 'male' | 'female'>;

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
  /** 레벨 별명 (예: 헬린이, 루키, 강철인) */
  nickname: string;
  /** 레벨 분위기 한 줄 설명 */
  vibe: string;
  /** 레벨 상세 설명 */
  description: string;
  rationaleTags: string[];
  reasons: string[];
  scoreBreakdown: SurveyLevelScoreBreakdown;
  totalScore: number;
  strongLevelCandidate: boolean;
  veteranQualified: boolean;
  bigThreeTotalKg: number | null;
  bigThreeEnteredCount: number;
  /** 성별+목표 기반으로 배정된 픽셀 캐릭터 변형 */
  variantId: PixelVariantId;
  /** 운동 목표 분류 유형 */
  archetypeId: CharacterArchetypeId;
}

// ─── 픽셀 캐릭터 변형·아키타입 배정 ──────────────────────────────────────────

const POWER_GOALS = new Set<OnboardingData['goal']>(['strength_gain', 'muscle_gain', 'lean_bulk']);
const POWER_GYM_TYPES = new Set<GymType>(['full_gym', 'garage_gym']);

/**
 * 성별 + 목표 + 운동 환경 기반으로 픽셀 캐릭터 변형을 배정합니다.
 */
export function assignPixelVariant(
  gender: AIGender,
  goal: OnboardingData['goal'],
  gymType: GymType,
): PixelVariantId {
  const isPower = POWER_GOALS.has(goal) && POWER_GYM_TYPES.has(gymType);
  const binaryGender = toBinaryGender(gender);
  if (binaryGender === 'male') return isPower ? 'male-black' : 'male-lightblue';
  return isPower ? 'female-white' : 'female-pink';
}

/**
 * 목표 + 운동 환경 + 경험 기반으로 운동 아키타입(분류 유형)을 분류합니다.
 */
export function classifyArchetype(
  goal: OnboardingData['goal'],
  gymType: GymType,
  experience: OnboardingData['experience'],
): CharacterArchetypeId {
  if (goal === 'strength_gain' && POWER_GYM_TYPES.has(gymType)) return 'powerlifter';
  if ((goal === 'muscle_gain' || goal === 'lean_bulk') && gymType === 'full_gym') return 'mass_builder';
  if (goal === 'lean_bulk') return 'lean_body';
  if (goal === 'weight_loss') return 'dieter';
  if (goal === 'maintenance') return 'wellness';
  return 'all_rounder';
}

// ─── 레벨 메타 조회 ──────────────────────────────────────────────────────────

function getLevelMeta(levelId: SurveyLevelId) {
  return CHARACTER_LEVELS.find((level) => level.id === levelId);
}

// ─── 레벨 순서 ────────────────────────────────────────────────────────────────

const LEVEL_ORDER: SurveyLevelId[] = [
  'beginner',
  'novice',
  'intermediate',
  'upper_intermediate',
  'advanced',
  'veteran',
];

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
  BinaryGender,
  { tier1: number; tier2: number; veteran: number }
> = {
  male: { tier1: 350, tier2: 430, veteran: 500 },
  female: { tier1: 200, tier2: 260, veteran: 300 },
};

function toBinaryGender(gender: AIGender): BinaryGender {
  return gender === 'female' ? 'female' : 'male';
}

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
  if (bigThreeTotalKg === null) return 0;

  const thresholds = BIG_THREE_TOTAL_THRESHOLDS[toBinaryGender(gender)];
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
  if (bigThreeCount < 3 || bigThreeTotalKg === null) return false;
  return bigThreeTotalKg >= BIG_THREE_TOTAL_THRESHOLDS[toBinaryGender(data.gender)].veteran;
}

function buildRationaleTags(data: OnboardingData, bigThreeCount: number, bigThreeTotalKg: number | null) {
  const maxLevelId = EXPERIENCE_MAX_LEVEL[data.experience];
  const maxLevelMeta = getLevelMeta(maxLevelId);
  const tags = [
    `운동 경험: ${maxLevelMeta?.name ?? '알 수 없음'} 후보군`,
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
  const levelMeta = getLevelMeta(levelId);
  const reasons = [
    `${levelMeta?.name ?? '알 수 없음'} 판정은 운동 경험, 주당 빈도, 운동 환경, 회복 상태를 함께 반영했어요.`,
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

  const meta = getLevelMeta(finalLevel);
  if (!meta) {
    throw new Error(`Could not find level meta for ${finalLevel}`);
  }

  const variantId = assignPixelVariant(data.gender, data.goal, data.gymType);
  const archetypeId = classifyArchetype(data.goal, data.gymType, data.experience);

  return {
    levelId: meta.id as SurveyLevelId,
    levelName: meta.name,
    nickname: meta.nickname,
    vibe: meta.vibe,
    description: meta.description,
    rationaleTags: buildRationaleTags(data, bigThreeEnteredCount, bigThreeTotalKg),
    reasons: buildReasons(data, finalLevel, veteranQualified, bigThreeEnteredCount, bigThreeTotalKg),
    scoreBreakdown,
    totalScore: scoreBreakdown.total,
    strongLevelCandidate,
    veteranQualified,
    bigThreeTotalKg,
    bigThreeEnteredCount,
    variantId,
    archetypeId,
  };
}

export const SURVEY_BIG_THREE_THRESHOLDS = BIG_THREE_TOTAL_THRESHOLDS;
export const SURVEY_BIG_THREE_LABELS = BIG_THREE_NAME_MAP;
