import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { AppCard } from '../common/AppCard';
import { useAppTheme } from '../../theme';
import { FatigueScore, FatigueResult } from '../../lib/home-fatigue';

export type BodyFatigueItem = FatigueScore;

interface BodyFatigueCardProps {
  data: FatigueResult;
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

function getBarColor(score: number, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (score >= 85) return colors.error;
  if (score >= 65) return colors.carbs;
  if (score >= 40) return colors.accent;
  if (score >= 20) return colors.success;
  return colors.successMuted;
}

export default function BodyFatigueCard({
  data,
  title = '부위별 피로도',
  subtitle = '최근 운동 기록 기준으로 오늘 많이 쓴 부위를 계산했어요.',
  emptyLabel = '운동 기록이 쌓이면 자주 쓴 부위의 피로도를 보여드려요.',
  onPress,
  style,
}: BodyFatigueCardProps) {
  const { colors, typography, radius } = useAppTheme();
  const { items, unclassifiedCount } = data;
  const [infoOpen, setInfoOpen] = useState(false);

  const card = (
    <AppCard variant="elevated" style={[styles.card, { borderRadius: radius.xl }, style]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setInfoOpen(true)}
          style={[styles.infoButton, { backgroundColor: colors.separator, borderRadius: radius.full }]}
        >
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const width = `${Math.max(Math.min(item.score, 100), item.score === 0 ? 0 : 6)}%` as `${number}%`;
          return (
            <View key={item.category} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={[styles.category, { color: colors.text, fontFamily: typography.fontFamily }]}>
                  {item.category}
                </Text>
                <Text style={[styles.status, { color: getBarColor(item.score, colors), fontFamily: typography.fontFamily }]}>
                  {item.statusLabel}
                </Text>
              </View>

              <View style={[styles.track, { backgroundColor: colors.separator }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: getBarColor(item.score, colors),
                      width,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {items.every((item) => item.score === 0) && (
        <View style={[styles.emptyBox, { backgroundColor: colors.separator, borderRadius: radius.lg }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {emptyLabel}
          </Text>
        </View>
      )}

      {unclassifiedCount > 0 && (
        <View style={[styles.notice, { backgroundColor: colors.separator, borderRadius: radius.lg }]}>
          <Text style={[styles.noticeText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            분류되지 않은 운동 {unclassifiedCount}개는 피로도 계산에서 제외됐어요.
          </Text>
        </View>
      )}

      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setInfoOpen(false)} />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
              },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                피로도는 이렇게 계산돼요
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setInfoOpen(false)}
                style={[styles.closeButton, { backgroundColor: colors.separator, borderRadius: radius.full }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoList}>
              <Text style={[styles.infoItem, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                최근에 한 운동일수록 더 크게 반영돼요.
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                세트 수와 중량, 반복 수가 많을수록 피로도가 올라가요.
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                이두와 삼두는 팔, 복근은 코어로 묶어서 보여줘요.
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                기록이 없는 부위는 매우 낮은 상태로 표시돼요.
              </Text>
              <Text style={[styles.infoItem, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                이 수치는 회복 참고용 간단 지표예요.
              </Text>
              <Text style={[styles.infoFootnote, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
                일부 운동은 부위 분류가 없어 계산에서 제외될 수 있어요.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </AppCard>
  );

  if (!onPress) {
    return card;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, styles.pressableWrap]}>
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableWrap: {
    width: '100%',
  },
  card: {
    marginHorizontal: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyBox: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    paddingBottom: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 5,
    width: 40,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  infoList: {
    gap: 10,
    marginTop: 18,
  },
  infoItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoFootnote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  notice: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  list: {
    gap: 12,
    marginTop: 16,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
});
