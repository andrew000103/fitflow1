import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';

import {
  ARCHETYPE_META,
  CHARACTER_LEVELS,
  DEFAULT_PIXEL_VARIANT,
  PIXEL_IMAGE_MAP,
  type CharacterArchetypeId,
  type CharacterLevelId,
  type PixelVariantId,
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
  loading?: boolean;
  ctaLabel?: string | null;
  onPressCta?: (() => void) | null;
  variantId?: PixelVariantId | null;
  archetypeId?: CharacterArchetypeId | null;
}

const STATE_META: Record<PersonaDailyState, { icon: string; label: string }> = {
  ACTIVE: { icon: 'arm-flex-outline', label: '활성' },
  RESTING: { icon: 'weather-night', label: '휴식' },
  HUNGRY: { icon: 'food-apple-outline', label: '배고픔' },
  FULL: { icon: 'silverware-fork-knife', label: '포만' },
  TIRED: { icon: 'battery-low', label: '회복 필요' },
};

type CharacterLevelMetaItem = (typeof CHARACTER_LEVELS)[number];

function formatPercent(progress?: number | null) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) return '0%';
  return `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`;
}

function PixelLevelViewer({
  currentLevelId,
  variantId,
  visible,
  onClose,
}: {
  currentLevelId?: CharacterLevelId | null;
  variantId: PixelVariantId;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<CharacterLevelMetaItem>>(null);
  const sliderWidth = Math.max(width - 32, 280);
  const currentIndex = Math.max(CHARACTER_LEVELS.findIndex((item) => item.id === currentLevelId), 0);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: currentIndex, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: Math.min(height * 0.82, 760),
              paddingBottom: spacing.xl,
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.modalHeader, { paddingHorizontal: spacing.lg }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                픽셀 캐릭터 도감
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                좌우로 넘기면서 전 단계와 다음 단계를 구경해보세요.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.separator, borderRadius: radius.full }]}>
              <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={CHARACTER_LEVELS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="center"
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({ index, length: sliderWidth, offset: sliderWidth * index })}
            renderItem={({ item }: { item: CharacterLevelMetaItem }) => {
              const isCurrent = item.id === currentLevelId;
              const imageSource = PIXEL_IMAGE_MAP[variantId][item.id];
              return (
                <View style={[styles.slide, { width: sliderWidth, paddingHorizontal: spacing.lg }]}>
                  <View style={[styles.slideCard, { backgroundColor: colors.background, borderRadius: radius.xl, padding: spacing.lg }]}>
                    <View style={styles.slideHeader}>
                      <View>
                        <Text style={[styles.slideNickname, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                          {item.nickname}
                        </Text>
                        <Text style={[styles.slideLevel, { color: colors.text, fontFamily: typography.fontFamily }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.slideVibe, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                          {item.vibe}
                        </Text>
                      </View>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.accentMuted, borderRadius: radius.full }]}>
                          <Text style={[styles.currentBadgeText, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                            현재 단계
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.slideImageWrap, { backgroundColor: colors.separator, borderRadius: radius.lg }]}>
                      {imageSource ? (
                        <Image source={imageSource} style={styles.slideImage} resizeMode="contain" />
                      ) : (
                        <MaterialCommunityIcons name="human" size={72} color={colors.textTertiary} />
                      )}
                    </View>

                    <ScrollView
                      style={styles.slideDescriptionScroll}
                      contentContainerStyle={styles.slideDescriptionContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={[styles.slideDescription, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                        {item.description}
                      </Text>
                    </ScrollView>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
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
  dailyState,
  loading = false,
  ctaLabel,
  onPressCta,
  variantId,
  archetypeId,
}: PixelEvolutionCardProps) {
  const { colors, spacing, radius, typography } = useAppTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const activeVariant: PixelVariantId = variantId ?? DEFAULT_PIXEL_VARIANT;
  const hasAssignedCharacter = Boolean(levelId && levelName);
  const isEmptyState = !hasAssignedCharacter && Boolean(ctaLabel && onPressCta);
  const isLoadingAssignedState = hasAssignedCharacter && loading;
  const imageSource = levelId ? PIXEL_IMAGE_MAP[activeVariant][levelId] : null;
  const stateMeta = dailyState ? STATE_META[dailyState] : null;
  const progressWidth = `${Math.round(Math.min(Math.max(progressToNext ?? 0, 0), 1) * 100)}%` as `${number}%`;
  const levelMeta = useMemo(
    () => CHARACTER_LEVELS.find((item) => item.id === levelId),
    [levelId],
  );
  const archetypeMeta = archetypeId ? ARCHETYPE_META[archetypeId] : null;

  if (isEmptyState) {
    return (
      <>
        <View style={[styles.container, { borderBottomColor: colors.border, padding: spacing.lg }]}>
          <View style={styles.emptyStateWrap}>
            <Text style={[styles.emptyStateTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
              내 헬스 레벨을 확인해보세요
            </Text>
            <Text style={[styles.emptyStateDescription, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              준비되면 지금 루틴 기준으로 바로 판정할 수 있어요.
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

        <PixelLevelViewer currentLevelId={levelId} variantId={activeVariant} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
      </>
    );
  }

  return (
    <>
      <View style={[styles.container, { borderBottomColor: colors.border, padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={[styles.levelTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                {isLoadingAssignedState
                  ? '진화 상태 계산 중'
                  : hasAssignedCharacter
                  ? `${levelMeta?.nickname ?? levelName}`
                  : '캐릭터를 설정해보세요'}
              </Text>
              {archetypeMeta && hasAssignedCharacter && (
                <View style={[styles.archetypeBadge, { backgroundColor: colors.accentMuted, borderRadius: radius.full }]}>
                  <Text style={[styles.archetypeBadgeText, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                    {archetypeMeta.name}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.headline, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              {headline ?? levelMeta?.description ?? '운동과 식단 기록에 따라 캐릭터가 성장해요.'}
            </Text>
          </View>

          {hasAssignedCharacter && stateMeta && (
            <View style={[styles.stateBadge, { backgroundColor: colors.accentMuted, borderRadius: radius.full }]}>
              <MaterialCommunityIcons name={stateMeta.icon as any} size={14} color={colors.accent} />
              <Text style={[styles.stateLabel, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                {stateMeta.label}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.heroRow, { marginTop: spacing.md }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (levelId) setViewerOpen(true);
            }}
            style={[styles.imageButton, { borderRadius: radius.lg }]}
          >
            <View style={[styles.imageWrap, { backgroundColor: colors.separator, borderRadius: radius.lg }]}>
              {imageSource ? (
                <Image source={imageSource} style={styles.image} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="human" size={40} color={colors.textTertiary} />
              )}
            </View>
            {hasAssignedCharacter && (
              <View style={[styles.peekBadge, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.full }]}>
                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={14} color={colors.textSecondary} />
                <Text style={[styles.peekBadgeText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  단계 보기
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.progressPanel}>
            {hasAssignedCharacter ? (
              <>
                <Text style={[styles.nextLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {nextLevelName ? `다음 진화: ${nextLevelName}` : '최종 진화 완료'}
                </Text>
                <Text style={[styles.percent, { color: colors.text, fontFamily: typography.fontFamily }]}>
                  {nextLevelName ? formatPercent(progressToNext) : '100%'}
                </Text>

                <View style={[styles.progressTrack, { backgroundColor: colors.separator, borderRadius: radius.full }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.accent, borderRadius: radius.full, width: nextLevelName ? progressWidth : '100%' },
                    ]}
                  />
                </View>

                <Text style={[styles.progressMessage, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {progressMessage ?? '다음 진화를 위한 기록을 쌓아보세요.'}
                </Text>
              </>
            ) : null}
            {supportingMessage && (
              <Text style={[styles.supportingMessage, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
                {supportingMessage}
              </Text>
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
        </View>

        {hasAssignedCharacter && checklist.length > 0 && (
          <View style={[styles.checklistWrap, { marginTop: spacing.md }]}>
            {checklist.map((item) => (
              <View key={item.id} style={styles.checklistRow}>
                <MaterialCommunityIcons
                  name={item.complete ? 'check-circle' : 'circle-outline'}
                  size={16}
                  color={item.complete ? colors.success : colors.textTertiary}
                />
                <Text style={[styles.checklistLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {item.label}
                </Text>
                <Text style={[styles.checklistValue, { color: colors.text, fontFamily: typography.fontFamily }]}>
                  {item.current}/{item.target}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <PixelLevelViewer currentLevelId={levelId} variantId={activeVariant} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  archetypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  archetypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headline: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  stateBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  imageButton: {
    position: 'relative',
  },
  imageWrap: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 132,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  peekBadge: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    bottom: -8,
    flexDirection: 'row',
    gap: 4,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
  },
  peekBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressPanel: {
    flex: 1,
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
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  percent: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  progressTrack: {
    height: 10,
    marginTop: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  progressMessage: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  supportingMessage: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  ctaButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  checklistWrap: {
    gap: 10,
  },
  checklistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 13,
  },
  checklistValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    minHeight: 480,
  },
  modalHandle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 5,
    marginTop: 10,
    width: 40,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  slide: {
    paddingBottom: 12,
  },
  slideCard: {
    flex: 1,
    minHeight: 480,
  },
  slideHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  slideNickname: {
    fontSize: 13,
    fontWeight: '700',
  },
  slideLevel: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  slideVibe: {
    fontSize: 13,
    marginTop: 4,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slideImageWrap: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    marginTop: 18,
    maxHeight: 240,
    overflow: 'hidden',
    padding: 8,
    width: '100%',
  },
  slideImage: {
    height: '100%',
    width: '100%',
  },
  slideDescriptionScroll: {
    flex: 1,
    marginTop: 16,
    minHeight: 120,
  },
  slideDescriptionContent: {
    paddingBottom: 12,
  },
  slideDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});
