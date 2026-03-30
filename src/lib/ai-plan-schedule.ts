import { AIPlan, WorkoutDay } from '../stores/ai-plan-store';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export interface AIPlanCycleInfo {
  started: boolean;
  diffDays: number;
  cycle: number;
  dayIndex: number | null;
  dayLabel: WorkoutDay['dayLabel'] | null;
}

export function getPlanCycleInfo(plan: AIPlan, targetDate = new Date()): AIPlanCycleInfo {
  const planStart = startOfDay(new Date(`${plan.weekStart}T00:00:00`));
  const current = startOfDay(targetDate);
  const diffDays = Math.floor((current.getTime() - planStart.getTime()) / DAY_MS);

  if (diffDays < 0) {
    return {
      started: false,
      diffDays,
      cycle: 0,
      dayIndex: null,
      dayLabel: null,
    };
  }

  const dayIndex = diffDays % 7;

  return {
    started: true,
    diffDays,
    cycle: Math.floor(diffDays / 7),
    dayIndex,
    dayLabel: `day${dayIndex + 1}` as WorkoutDay['dayLabel'],
  };
}

export function getRecurringDayLabel(plan: AIPlan, targetDate = new Date()): WorkoutDay['dayLabel'] | null {
  return getPlanCycleInfo(plan, targetDate).dayLabel;
}

export function isPlanStarted(plan: AIPlan, targetDate = new Date()): boolean {
  return getPlanCycleInfo(plan, targetDate).started;
}

export function getCycleStartDate(plan: AIPlan, targetDate = new Date()): Date | null {
  const cycleInfo = getPlanCycleInfo(plan, targetDate);
  if (!cycleInfo.started) return null;

  const cycleStart = new Date(`${plan.weekStart}T00:00:00`);
  cycleStart.setDate(cycleStart.getDate() + cycleInfo.cycle * 7);
  return cycleStart;
}

export function getCycleDateRange(
  plan: AIPlan,
  cycle: number
): { start: Date; end: Date } | null {
  if (cycle < 0) return null;

  const start = new Date(`${plan.weekStart}T00:00:00`);
  start.setDate(start.getDate() + cycle * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
