import { Exercise } from '../types/workout';

type ExerciseLike = Pick<Exercise, 'name_ko'>;

export function normalizeExerciseName(name: string) {
  return name.trim().replace(/\s+/g, '').toLocaleLowerCase();
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
