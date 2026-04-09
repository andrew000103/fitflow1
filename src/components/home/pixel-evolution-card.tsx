import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';

import { getHealthLevelContent } from '../../lib/health-level-content';
import {
  CHARACTER_LEVELS,
  type CharacterLevelId,
} from '../../lib/pixel-character-config';
import type { EvolutionChecklistItem, PersonaDailyState } from '../../lib/persona-engine';
import { useAppTheme } from '../../theme';

interface PixelEvolutionCardProps {
  levelId?: CharacterLevelId | null;
  levelName?: string | null;
  nextLevelName?: string | null;
  progressToNext?: number | null;
  headline?: string | null;
  progressMessage?: string | null;
  supportingMessage?: string | null;
  checklist?: EvolutionChecklistItem[];
  dailyState?: PersonaDailyState | null;
  hasWorkoutToday?: boolean;
  mealEntryCountToday?: number;
  proteinToday?: number | null;
  proteinGoal?: number | null;
  loading?: boolean;
  ctaLabel?: string | null;
  onPressCta?: (() => void) | null;
}

function formatPercent(progress?: number | null) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) return '0%';
  return `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`;
}

function buildNextStepMessage(
  nextLevelName?: string | null,
  checklist: EvolutionChecklistItem[] = [],
  progressToNext?: number | null,
  progressMessage?: string | null,
) {
  const incomplete = checklist.filter((item) => !item.complete);

  if (!nextLevelName) {
    return '지금 루틴을 안정적으로 유지해보세요. 현재 단계의 완성도를 다지는 것이 가장 중요해요.';
  }

  if (incomplete.length > 0) {
    const [first, second] = incomplete;
    const parts = [first, second].filter(Boolean).map((item) => {
      const remaining = Math.max(item.target - item.current, 0);
      return `${item.label} ${remaining}${item.label.includes('운동') || item.label.includes('기록') || item.label.includes('달성') ? '회' : ''}`;
    });
    return `${nextLevelName} 단계까지 ${parts.join(', ')} 더 채워보세요.`;
  }

  if (progressMessage?.trim()) {
    return progressMessage;
  }

  return `${nextLevelName} 단계까지 ${formatPercent(progressToNext)} 정도 진행됐어요. 지금 페이스를 유지해보세요.`;
}

function buildWorkoutTip(
  baseTip: string | undefined,
  checklist: EvolutionChecklistItem[] = [],
  hasWorkoutToday?: boolean,
) {
  const workoutItem = checklist.find((item) => !item.complete && item.label.includes('운동'));
  if (workoutItem) {
    const remaining = Math.max(workoutItem.target - workoutItem.current, 0);
    return `${workoutItem.label} ${remaining}회만 더 채우는 걸 이번 주 우선순위로 잡아보세요. ${baseTip ?? ''}`.trim();
  }

  if (!hasWorkoutToday) {
    return `오늘 운동 기록이 아직 없어요. 짧게라도 한 세션을 시작하면 흐름을 이어가기 훨씬 쉬워져요. ${baseTip ?? ''}`.trim();
  }

  return baseTip ?? '이번 주에는 자주 하는 운동 1~2개만이라도 꾸준히 이어가며 기록을 남겨보세요.';
}

function buildDietTip(
  baseTip: string | undefined,
  mealEntryCountToday?: number,
  proteinToday?: number | null,
  proteinGoal?: number | null,
) {
  if ((mealEntryCountToday ?? 0) === 0) {
    return `오늘 식단 기록이 아직 없어요. 첫 끼부터 가볍게 기록하면 레벨 안내도 더 정확해져요. ${baseTip ?? ''}`.trim();
  }

  if (
    typeof proteinToday === 'number'
    && typeof proteinGoal === 'number'
    && proteinGoal > 0
    && proteinToday < proteinGoal * 0.6
  ) {
    const remaining = Math.max(Math.round(proteinGoal - proteinToday), 0);
    return `단백질이 아직 ${remaining}g 정도 부족해요. 다음 식사에서 단백질 한 가지를 먼저 채워보세요. ${baseTip ?? ''}`.trim();
  }

  return baseTip ?? '하루 전체를 완벽하게 맞추기보다 단백질과 식사 기록부터 차근차근 정리해보세요.';
}

function buildSimpleHeadline(
  headline?: string | null,
  shortBlurb?: string | null,
) {
  const conciseHeadline = headline?.trim();
  if (conciseHeadline) return conciseHeadline;

  const conciseBlurb = shortBlurb?.trim();
  if (conciseBlurb) return conciseBlurb;

  return '지금 페이스를 이어가보세요.';
}

function InfoBlock({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  const { colors, radius, typography } = useAppTheme();

  return (
    <View style={[styles.infoBlock, { backgroundColor: colors.background, borderRadius: radius.lg, borderColor: colors.border }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.separator, borderRadius: radius.md }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.accent} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {title}
        </Text>
        <Text style={[styles.infoBody, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function PixelEvolutionCard({
  levelId,
  levelName,
  nextLevelName,
  progressToNext,
  headline,
  progressMessage,
  supportingMessage,
  checklist = [],
  hasWorkoutToday,
  mealEntryCountToday,
  proteinToday,
  proteinGoal,
  loading = false,
  ctaLabel,
  onPressCta,
}: PixelEvolutionCardProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const hasAssignedCharacter = Boolean(levelId && levelName);
  const isEmptyState = !hasAssignedCharacter && Boolean(ctaLabel && onPressCta);
  const levelMeta = useMemo(
    () => CHARACTER_LEVELS.find((item) => item.id === levelId),
    [levelId],
  );
  const levelContent = getHealthLevelContent(levelId);
  const nextStepMessage = buildNextStepMessage(nextLevelName, checklist, progressToNext, progressMessage);
  const reliabilityNote = supportingMessage?.trim() || null;
  const workoutTip = buildWorkoutTip(levelContent?.workoutTip, checklist, hasWorkoutToday);
  const dietTip = buildDietTip(levelContent?.dietTip, mealEntryCountToday, proteinToday, proteinGoal);
  const simpleHeadline = buildSimpleHeadline(headline, levelContent?.shortBlurb);

  if (isEmptyState) {
    return (
      <View style={[styles.container, { borderBottomColor: colors.border, padding: spacing.lg }]}>
        <View style={styles.emptyStateWrap}>
          <Text style={[styles.emptyStateTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
            내 현재 레벨을 확인해보세요
          </Text>
          <Text style={[styles.emptyStateDescription, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            테스트를 바탕으로 현재 수준과 다음 단계를 간단히 정리해드려요.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPressCta ?? undefined}
            style={[styles.emptyStateButton, { backgroundColor: colors.accent, borderRadius: radius.full }]}
          >
            <Text style={[styles.emptyStateButtonLabel, { color: '#FFFFFF', fontFamily: typography.fontFamily }]}>
              {ctaLabel}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              현재 레벨
            </Text>
            <View style={styles.titleRow}>
              <Text style={[styles.levelTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                {levelName ?? levelMeta?.name ?? '현재 레벨'}
              </Text>
            </View>
            <Text style={[styles.headline, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              {simpleHeadline}
            </Text>
          </View>
        </View>

        <View style={[styles.infoGrid, { marginTop: spacing.md }]}>
          <InfoBlock icon="stairs-up" title={nextLevelName ? `다음 단계: ${nextLevelName}` : '지금 단계 유지'} body={nextStepMessage} />
          <InfoBlock
            icon="dumbbell"
            title="운동 팁"
            body={workoutTip}
          />
          <InfoBlock
            icon="silverware-fork-knife"
            title="식단 팁"
            body={dietTip}
          />
        </View>

        {reliabilityNote && (
          <View style={[styles.noteWrap, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.md }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.noteText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              {reliabilityNote}
            </Text>
          </View>
        )}

        {ctaLabel && onPressCta && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPressCta}
            style={[
              styles.ctaButton,
              {
                backgroundColor: colors.accentMuted,
                borderColor: colors.border,
                borderRadius: radius.full,
                marginTop: spacing.md,
              },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: colors.accent, fontFamily: typography.fontFamily }]}>
              {ctaLabel}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headline: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  infoGrid: {
    gap: 10,
  },
  infoBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  infoIconWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  noteWrap: {
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyStateWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyStateButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  ctaButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  ctaLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
});
