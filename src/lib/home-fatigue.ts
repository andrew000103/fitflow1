import { BUILT_IN_EXERCISES } from '../constants/exercises';

export type SourceFatigueCategory = '가슴' | '등' | '어깨' | '하체' | '이두' | '삼두' | '복근';
export type FatigueCategory = '가슴' | '등' | '어깨' | '팔' | '코어' | '하체';

export interface FatigueSetRecord {
  category: string | null;
  exerciseName?: string | null;
  weightKg: number | null;
  reps: number | null;
  startedAt: string;
}

export interface FatigueScore {
  category: FatigueCategory;
  score: number;
  statusLabel: string;
}

export interface FatigueResult {
  items: FatigueScore[];
  unclassifiedCount: number;
}

const FATIGUE_CATEGORIES: FatigueCategory[] = ['가슴', '등', '어깨', '팔', '코어', '하체'];
const DAY_DECAY = [1, 0.72, 0.48, 0.3, 0.18] as const;
const CATEGORY_GROUP_MAP: Record<SourceFatigueCategory, FatigueCategory> = {
  가슴: '가슴',
  등: '등',
  어깨: '어깨',
  이두: '팔',
  삼두: '팔',
  복근: '코어',
  하체: '하체',
};

const exerciseCategoryMap = new Map(BUILT_IN_EXERCISES.map((exercise) => [exercise.name_ko, exercise.category]));

function normalizeCategory(category?: string | null, exerciseName?: string | null): SourceFatigueCategory | null {
  const resolved = category ?? (exerciseName ? exerciseCategoryMap.get(exerciseName) : null) ?? null;
  if (!resolved) return null;
  return resolved in CATEGORY_GROUP_MAP ? (resolved as SourceFatigueCategory) : null;
}

function getStatusLabel(score: number) {
  if (score >= 85) return '매우 높음';
  if (score >= 65) return '높음';
  if (score >= 40) return '보통';
  if (score >= 20) return '낮음';
  return '매우 낮음';
}

export function calculateBodyFatigue(records: FatigueSetRecord[], now = new Date()): FatigueResult {
  const totals = new Map<FatigueCategory, number>();
  FATIGUE_CATEGORIES.forEach((category) => totals.set(category, 0));
  let unclassifiedCount = 0;

  records.forEach((record) => {
    const sourceCategory = normalizeCategory(record.category, record.exerciseName);
    if (!sourceCategory) {
      unclassifiedCount += 1;
      return;
    }
    const category = CATEGORY_GROUP_MAP[sourceCategory];

    const startedAt = new Date(record.startedAt);
    const diffDays = Math.floor((now.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 || diffDays >= DAY_DECAY.length) return;

    const decay = DAY_DECAY[diffDays];
    const reps = Math.max(record.reps ?? 0, 0);
    const weight = Math.max(record.weightKg ?? 0, 0);
    const volumeBonus = Math.min((weight * reps) / 120, 10);
    const setScore = (6 + volumeBonus) * decay;
    totals.set(category, (totals.get(category) ?? 0) + setScore);
  });

  const items = FATIGUE_CATEGORIES
    .map((category) => {
      const rawScore = totals.get(category) ?? 0;
      const normalizedScore = Math.min(Math.round(rawScore * 2.4), 100);
      return {
        category,
        score: normalizedScore,
        statusLabel: getStatusLabel(normalizedScore),
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    items,
    unclassifiedCount,
  };
}
