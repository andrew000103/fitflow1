import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth-store';
import {
  ExerciseHistorySession,
  ExerciseTrendSummary,
} from '../types/workout';

type HistorySetRow = {
  id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  workout_sessions:
    | {
        id: string;
        started_at: string;
        ended_at: string;
      }
    | Array<{
        id: string;
        started_at: string;
        ended_at: string;
      }>
    | null;
};

type UseExerciseHistoryResult = {
  loading: boolean;
  error: string | null;
  sessions: ExerciseHistorySession[];
  summary: ExerciseTrendSummary | null;
  hasHistory: boolean;
};

const SESSION_FETCH_LIMIT = 8;
const SET_FETCH_LIMIT = 120;

function estimateOneRm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getSessionFromRow(row: HistorySetRow): {
  id: string;
  started_at: string;
  ended_at: string;
} | null {
  if (!row.workout_sessions) return null;
  return Array.isArray(row.workout_sessions) ? row.workout_sessions[0] ?? null : row.workout_sessions;
}

function buildSummary(sessions: ExerciseHistorySession[]): ExerciseTrendSummary | null {
  if (sessions.length === 0) return null;

  const recent = sessions.slice(0, 5);
  const last = sessions[0];
  const previous = sessions[1] ?? null;
  const now = Date.now();
  const last30dMs = 30 * 24 * 60 * 60 * 1000;
  const frequency30d = sessions.filter(
    (session) => now - new Date(session.endedAt).getTime() <= last30dMs,
  ).length;

  const avgTopWeightKg =
    recent.reduce((sum, session) => sum + session.topWeightKg, 0) / recent.length;
  const avgVolumeKg =
    recent.reduce((sum, session) => sum + session.totalVolumeKg, 0) / recent.length;
  const avgEstimatedOneRmKg =
    recent.reduce((sum, session) => sum + session.estimatedOneRmKg, 0) / recent.length;

  return {
    sessionCount: sessions.length,
    frequency30d,
    avgTopWeightKg: round1(avgTopWeightKg),
    avgVolumeKg: round1(avgVolumeKg),
    avgEstimatedOneRmKg: round1(avgEstimatedOneRmKg),
    topWeightDeltaKg: previous ? round1(last.topWeightKg - previous.topWeightKg) : null,
    volumeDeltaKg: previous ? round1(last.totalVolumeKg - previous.totalVolumeKg) : null,
    estimatedOneRmDeltaKg: previous
      ? round1(last.estimatedOneRmKg - previous.estimatedOneRmKg)
      : null,
  };
}

export function useExerciseHistory(
  exerciseId?: string,
  enabled: boolean = true,
): UseExerciseHistoryResult {
  const userId = useAuthStore((state) => state.user?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ExerciseHistorySession[]>([]);
  const [summary, setSummary] = useState<ExerciseTrendSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      if (!enabled) return;

      if (!exerciseId || exerciseId.startsWith('local::') || !userId) {
        if (!cancelled) {
          setLoading(false);
          setError(null);
          setSessions([]);
          setSummary(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('workout_sets')
          .select('id, set_number, weight_kg, reps, workout_sessions!inner(id, started_at, ended_at)')
          .eq('exercise_id', exerciseId)
          .eq('workout_sessions.user_id', userId)
          .not('workout_sessions.ended_at', 'is', null)
          .order('workout_sessions(ended_at)', { ascending: false })
          .order('set_number', { ascending: true })
          .limit(SET_FETCH_LIMIT);

        if (queryError) throw queryError;

        const grouped = new Map<string, ExerciseHistorySession>();

        for (const row of (data ?? []) as HistorySetRow[]) {
          const session = getSessionFromRow(row);
          if (!session?.ended_at) continue;

          const existing = grouped.get(session.id);
          const historySet = {
            id: row.id,
            setNumber: row.set_number,
            weightKg: row.weight_kg,
            reps: row.reps,
            volumeKg: row.weight_kg * row.reps,
          };

          if (existing) {
            existing.sets.push(historySet);
            existing.totalVolumeKg += historySet.volumeKg;
            existing.totalReps += historySet.reps;
            existing.topWeightKg = Math.max(existing.topWeightKg, historySet.weightKg);
            existing.estimatedOneRmKg = Math.max(
              existing.estimatedOneRmKg,
              estimateOneRm(historySet.weightKg, historySet.reps),
            );
            continue;
          }

          grouped.set(session.id, {
            sessionId: session.id,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            sets: [historySet],
            totalVolumeKg: historySet.volumeKg,
            topWeightKg: historySet.weightKg,
            estimatedOneRmKg: estimateOneRm(historySet.weightKg, historySet.reps),
            totalReps: historySet.reps,
          });
        }

        const nextSessions = Array.from(grouped.values())
          .map((session) => ({
            ...session,
            sets: [...session.sets].sort((a, b) => a.setNumber - b.setNumber),
            totalVolumeKg: round1(session.totalVolumeKg),
            topWeightKg: round1(session.topWeightKg),
            estimatedOneRmKg: round1(session.estimatedOneRmKg),
          }))
          .sort(
            (a, b) =>
              new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
          )
          .slice(0, SESSION_FETCH_LIMIT);

        if (!cancelled) {
          setSessions(nextSessions);
          setSummary(buildSummary(nextSessions));
        }
      } catch {
        if (!cancelled) {
          setError('운동 기록을 불러오지 못했어요.');
          setSessions([]);
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [enabled, exerciseId, userId]);

  return {
    loading,
    error,
    sessions,
    summary,
    hasHistory: sessions.length > 0,
  };
}
