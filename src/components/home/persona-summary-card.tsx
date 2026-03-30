import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '../../theme';

export type PersonaSummaryStage = 'starter' | 'learning' | 'established';

interface PersonaSummaryCardProps {
  confidence?: number | null;
  dailyState?: string | null;
  hasPersona?: boolean;
  hasStore?: boolean;
  headline?: string | null;
  loading?: boolean;
  message?: string | null;
  personaId?: string | null;
  personaName?: string | null;
  stage?: PersonaSummaryStage | null;
}

const STAGE_META: Record<
  PersonaSummaryStage,
  {
    badgeLabel: string;
    defaultHeadline: string;
    defaultMessage: string;
    emptyMessage: string;
    icon: string;
    withName: (name?: string | null) => string;
  }
> = {
  starter: {
    badgeLabel: '스타터',
    defaultHeadline: '루틴을 배우는 중이에요',
    defaultMessage: '첫 주는 가볍게 기록만 해도 충분해요.',
    emptyMessage: '기록이 쌓이면 더 또렷한 페르소나를 보여드릴게요.',
    icon: 'sprout-outline',
    withName: (name) => (name ? `${name}, 루틴을 배우는 중이에요` : '루틴을 배우는 중이에요'),
  },
  learning: {
    badgeLabel: '학습 중',
    defaultHeadline: '패턴이 조금씩 보이기 시작했어요',
    defaultMessage: '최근 기록을 바탕으로 페르소나를 다듬고 있어요.',
    emptyMessage: '운동과 식단 기록이 늘수록 페르소나가 더 선명해져요.',
    icon: 'chart-timeline-variant',
    withName: (name) => (name ? `${name} 패턴이 조금씩 보여요` : '패턴이 조금씩 보이기 시작했어요'),
  },
  established: {
    badgeLabel: '정착됨',
    defaultHeadline: '루틴이 꽤 선명해졌어요',
    defaultMessage: '쌓인 기록을 바탕으로 오늘의 상태를 안정적으로 보고 있어요.',
    emptyMessage: '최근 기록을 기반으로 루틴 상태를 정리하고 있어요.',
    icon: 'bullseye-arrow',
    withName: (name) => (name ? `${name} 루틴이 꽤 선명해졌어요` : '루틴이 꽤 선명해졌어요'),
  },
};

const DAILY_STATE_META: Record<string, { icon: string; message: string }> = {
  ACTIVE: {
    icon: 'arm-flex-outline',
    message: '오늘은 운동과 섭취 흐름이 잘 맞고 있어요.',
  },
  RESTING: {
    icon: 'weather-night',
    message: '휴식 흐름도 안정적으로 유지되고 있어요.',
  },
  HUNGRY: {
    icon: 'food-apple-outline',
    message: '오늘 식사를 조금 더 기록하면 상태를 더 정확히 볼 수 있어요.',
  },
  FULL: {
    icon: 'silverware-fork-knife',
    message: '오늘 섭취가 높은 편이에요. 다음 끼니를 조금 가볍게 조절해봐요.',
  },
  TIRED: {
    icon: 'battery-low',
    message: '운동은 잘했어요. 회복용 단백질을 챙기면 더 좋아요.',
  },
  LOG_MORE: {
    icon: 'notebook-edit-outline',
    message: '오늘 식사를 조금 더 기록해볼까요?',
  },
};

function formatConfidence(confidence?: number | null) {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence <= 0) {
    return null;
  }

  const normalized = confidence > 1 ? Math.min(confidence / 100, 1) : Math.min(confidence, 1);
  return `신뢰도 ${Math.round(normalized * 100)}%`;
}

function titleizePersonaId(personaId?: string | null) {
  if (!personaId) return null;

  return personaId
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function PersonaSummaryCard({
  confidence,
  dailyState,
  hasPersona = false,
  hasStore = false,
  headline,
  loading = false,
  message,
  personaId,
  personaName,
  stage,
}: PersonaSummaryCardProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  const stageKey: PersonaSummaryStage =
    stage === 'learning' || stage === 'established' || stage === 'starter'
      ? stage
      : 'starter';
  const stageMeta = STAGE_META[stageKey];
  const stateKey = dailyState?.toUpperCase() ?? '';
  const dailyMeta = DAILY_STATE_META[stateKey];
  const resolvedName = personaName?.trim() || titleizePersonaId(personaId);
  const confidenceLabel = formatConfidence(confidence);

  const resolvedHeadline = headline?.trim()
    || (loading
      ? '페르소나를 계산하는 중이에요'
      : hasStore
        ? (hasPersona ? stageMeta.withName(resolvedName) : stageMeta.defaultHeadline)
        : '루틴을 배우는 중이에요');

  const resolvedMessage = message?.trim()
    || (loading
      ? '최근 기록을 바탕으로 오늘의 성향을 정리하고 있어요.'
      : !hasStore
        ? '페르소나 데이터가 연결되면 이 자리에서 오늘의 성향 요약을 보여드려요.'
        : stageKey === 'starter' && ['HUNGRY', 'FULL', 'TIRED'].includes(stateKey)
          ? '첫 주에는 가볍게 기록만 쌓아도 충분해요. 데이터가 늘수록 더 또렷해져요.'
          : hasPersona
            ? (dailyMeta?.message ?? stageMeta.defaultMessage)
            : stageMeta.emptyMessage);

  const eyebrow = hasStore
    ? (resolvedName ? resolvedName : '페르소나 요약')
    : '페르소나 준비 중';

  const stageBadgeLabel = hasStore ? stageMeta.badgeLabel : '연결 대기';
  const iconName = loading ? 'progress-clock' : (dailyMeta?.icon ?? stageMeta.icon);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, padding: spacing.lg }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: loading ? colors.accentMuted : colors.separator,
            borderRadius: radius.md,
            marginRight: spacing.md,
          },
        ]}
      >
        <MaterialCommunityIcons name={iconName as any} size={20} color={colors.accent} />
      </View>

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {eyebrow}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.accentMuted, borderRadius: radius.full }]}>
              <Text style={[styles.badgeText, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                {stageBadgeLabel}
              </Text>
            </View>
            {confidenceLabel && (
              <View style={[styles.badge, { backgroundColor: colors.separator, borderRadius: radius.full }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {confidenceLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.headline, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {resolvedHeadline}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          {resolvedMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  iconWrap: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eyebrow: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
