import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import {
  ExerciseHistorySession,
  ExerciseTrendSummary,
} from '../../types/workout';

interface ExerciseHistoryPanelProps {
  loading: boolean;
  error?: string | null;
  sessions: ExerciseHistorySession[];
  summary: ExerciseTrendSummary | null;
  exerciseName?: string;
  isLocalExercise?: boolean;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function formatDelta(value: number | null, unit: string): string {
  if (value == null) return '비교 기록 없음';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${unit}`;
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors, typography } = useAppTheme();

  return (
    <View style={{ flex: 1, minWidth: 120, marginBottom: 12 }}>
      <Text
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.size.xs,
          color: colors.textSecondary,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function ExerciseHistoryPanel({
  loading,
  error,
  sessions,
  summary,
  exerciseName,
  isLocalExercise = false,
}: ExerciseHistoryPanelProps) {
  const { colors, typography } = useAppTheme();

  if (loading) {
    return (
      <View
        style={{
          paddingVertical: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} />
        <Text
          style={{
            marginTop: 12,
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            color: colors.textSecondary,
          }}
        >
          기록을 불러오는 중이에요.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            color: colors.textSecondary,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  if (isLocalExercise) {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            color: colors.textSecondary,
            lineHeight: 22,
          }}
        >
          직접 만든 운동은 아직 공통 기록 히스토리를 연결하지 않았어요.
        </Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.md,
            fontWeight: typography.weight.semibold,
            color: colors.text,
            marginBottom: 8,
          }}
        >
          아직 이 운동 기록이 없어요.
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            color: colors.textSecondary,
            lineHeight: 22,
          }}
        >
          {exerciseName ? `${exerciseName}을(를) 기록하면 ` : ''}여기서 최근 세션과 변화 추이를 바로 볼 수 있어요.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {summary ? (
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.md,
              fontWeight: typography.weight.semibold,
              color: colors.text,
              marginBottom: 14,
            }}
          >
            이전 추이
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="최근 평균 최고중량" value={`${summary.avgTopWeightKg}kg`} />
            </View>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="최근 평균 볼륨" value={`${summary.avgVolumeKg}kg`} />
            </View>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="최근 평균 추정 1RM" value={`${summary.avgEstimatedOneRmKg}kg`} />
            </View>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="최근 30일 수행 횟수" value={`${summary.frequency30d}회`} />
            </View>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="직전 대비 최고중량" value={formatDelta(summary.topWeightDeltaKg, 'kg')} />
            </View>
            <View style={{ width: '50%', paddingHorizontal: 6 }}>
              <SummaryMetric label="직전 대비 볼륨" value={formatDelta(summary.volumeDeltaKg, 'kg')} />
            </View>
          </View>
        </View>
      ) : null}

      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.md,
            fontWeight: typography.weight.semibold,
            color: colors.text,
            marginBottom: 14,
          }}
        >
          최근 세션들
        </Text>

        {sessions.map((session, index) => (
          <View
            key={session.sessionId}
            style={{
              paddingTop: index === 0 ? 0 : 14,
              marginTop: index === 0 ? 0 : 14,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: colors.text,
                  }}
                >
                  {formatDateTime(session.endedAt)}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.xs,
                    color: colors.textSecondary,
                  }}
                >
                  {session.sets.length}세트 · 총 {session.totalReps}회
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.xs,
                    color: colors.textSecondary,
                  }}
                >
                  최고중량 {session.topWeightKg}kg
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.xs,
                    color: colors.textSecondary,
                  }}
                >
                  추정 1RM {session.estimatedOneRmKg}kg
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                color: colors.text,
                lineHeight: 22,
              }}
            >
              {session.sets.map((set) => `${set.weightKg}kg x ${set.reps}`).join('  ·  ')}
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontFamily: typography.fontFamily,
                fontSize: typography.size.xs,
                color: colors.textSecondary,
              }}
            >
              세션 볼륨 {session.totalVolumeKg}kg
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
