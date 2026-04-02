import { Exercise } from '../types/workout';

type ExerciseLike = Pick<Exercise, 'name_ko'>;
type ExerciseCategoryLike = Pick<Exercise, 'category'>;

export const EXERCISE_CATEGORY_OPTIONS = [
  '전체',
  '하체',
  '어깨',
  '가슴',
  '팔',
  '복근',
  '등',
  '역도',
  '유산소',
  '기타',
] as const;

export type ExerciseCategoryOption = (typeof EXERCISE_CATEGORY_OPTIONS)[number];

export function normalizeExerciseName(name: string) {
  return name.trim().replace(/\s+/g, '').toLocaleLowerCase();
}

export function normalizeExerciseCategory(category: ExerciseCategoryLike['category']): ExerciseCategoryOption {
  if (!category) return '기타';

  const normalizedCategory = category.trim();
  if (EXERCISE_CATEGORY_OPTIONS.includes(normalizedCategory as ExerciseCategoryOption)) {
    return normalizedCategory as ExerciseCategoryOption;
  }

  return '기타';
}

export function dedupeExercisesByName<T extends ExerciseLike>(exercises: T[]) {
  const seen = new Set<string>();

  return exercises.filter((exercise) => {
    const key = normalizeExerciseName(exercise.name_ko);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
