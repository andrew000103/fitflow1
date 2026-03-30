import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgramStore } from '../../stores/program-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutSummary'>;
  route: RouteProp<WorkoutStackParamList, 'WorkoutSummary'>;
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

type ConfettiPiece = {
  x: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  color: string;
};

const CONFETTI_COLORS = ['#FF6B6B', '#F4A261', '#2A9D8F', '#4D96FF', '#FFD93D', '#9B5DE5'];

function createConfettiPieces(screenWidth: number, count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, index) => ({
    x: Math.random() * screenWidth,
    size: 8 + (index % 3) * 4,
    delay: Math.random() * 500,
    duration: 2100 + Math.random() * 1300,
    rotation: Math.random() > 0.5 ? 1 : -1,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }));
}

export default function WorkoutSummaryScreen({ navigation, route }: Props) {
  const { colors, typography } = useAppTheme();
  const { totalVolumeKg, setCount, durationSeconds, exercises, nsunsAmrapResults, userProgramId } = route.params;
  const { saveUserTMs } = useProgramStore();
  const { user } = useAuthStore();
  const [tmSaving, setTmSaving] = useState(false);
  const [tmApplied, setTmApplied] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const confettiPieces = useRef(createConfettiPieces(screenWidth, 28)).current;
  const confettiProgress = useRef(confettiPieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = confettiProgress.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: confettiPieces[index].duration,
        delay: confettiPieces[index].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    Animated.stagger(45, animations).start();
  }, [confettiPieces, confettiProgress]);

  const stats = [
    { label: '운동 시간', value: formatDuration(durationSeconds), icon: 'clock-outline' as const },
    { label: '총 볼륨', value: `${totalVolumeKg.toLocaleString()}kg`, icon: 'weight-kilogram' as const },
    { label: '완료 세트', value: `${setCount}세트`, icon: 'check-circle-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.confettiLayer}>
        {confettiPieces.map((piece, index) => {
          const progress = confettiProgress[index];
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-80, screenHeight * 0.62],
          });
          const translateX = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, piece.rotation * 18, piece.rotation * 44],
          });
          const rotate = progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${piece.rotation * 320}deg`],
          });
          const opacity = progress.interpolate({
            inputRange: [0, 0.08, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          });

          return (
            <Animated.View
              key={`${piece.x}-${index}`}
              style={[
                styles.confettiPiece,
                {
                  left: piece.x,
                  width: piece.size,
                  height: piece.size * 1.8,
                  backgroundColor: piece.color,
                  opacity,
                  transform: [{ translateY }, { translateX }, { rotate }],
                },
              ]}
            />
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="weight-lifter" size={46} color={colors.accent} />
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xxl,
              fontWeight: typography.weight.heavy,
              color: colors.text,
              marginTop: 12,
            }}
          >
            운동 완료!
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.md,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons name={stat.icon} size={22} color={colors.accent} />
              <Text
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.xl,
                  fontWeight: typography.weight.bold,
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.size.xs,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* nSuns AMRAP 결과 */}
        {nsunsAmrapResults && nsunsAmrapResults.length > 0 && (
          <View style={[styles.breakdown, { backgroundColor: colors.card, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
              <MaterialCommunityIcons name="trending-up" size={18} color={colors.accent} />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text }}>
                Training Max 업데이트
              </Text>
            </View>
            {nsunsAmrapResults.map((r) => (
              <View key={r.exerciseKey} style={[styles.exRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text }}>
                    {r.exerciseName}
                  </Text>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 }}>
                    AMRAP {r.amrapReps}회 · 현재 TM {r.currentTm}kg
                  </Text>
                </View>
                {r.suggestedIncrease > 0 ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.accent }}>
                      +{r.suggestedIncrease}kg
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary }}>
                      → {r.newTm}kg
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary }}>
                    유지
                  </Text>
                )}
              </View>
            ))}
            {!tmApplied && userProgramId && user && nsunsAmrapResults.some((r) => r.suggestedIncrease > 0) && (
              <TouchableOpacity
                style={[styles.tmBtn, { backgroundColor: tmSaving ? colors.textTertiary : colors.accent, marginTop: 12 }]}
                activeOpacity={0.85}
                disabled={tmSaving}
                onPress={async () => {
                  setTmSaving(true);
                  try {
                    const updates: Record<string, number> = {};
                    nsunsAmrapResults.forEach((r) => { updates[r.exerciseKey] = r.newTm; });
                    await saveUserTMs(userProgramId, user.id, updates);
                    setTmApplied(true);
                  } catch (e: any) {
                    Alert.alert('저장 실패', e.message ?? 'TM 업데이트 중 오류가 발생했습니다.');
                  } finally {
                    setTmSaving(false);
                  }
                }}
              >
                {tmSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: '#fff' }}>
                    TM 업데이트 적용
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {tmApplied && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 6 }}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.success }}>
                  TM이 업데이트되었습니다
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Exercise breakdown */}
        {exercises.length > 0 && (
          <View style={[styles.breakdown, { backgroundColor: colors.card }]}>
            <Text
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.md,
                fontWeight: typography.weight.semibold,
                color: colors.text,
                marginBottom: 12,
              }}
            >
              운동 내역
            </Text>
            {exercises.map((ex: { name: string; sets: number; volume_kg: number }, i: number) => (
              <View
                key={i}
                style={[
                  styles.exRow,
                  { borderBottomColor: colors.border },
                  i === exercises.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={[styles.exDot, { backgroundColor: colors.accentMuted }]}>
                  <MaterialCommunityIcons name="dumbbell" size={14} color={colors.accent} />
                </View>
                <Text
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.md,
                    fontWeight: typography.weight.medium,
                    color: colors.text,
                    flex: 1,
                  }}
                >
                  {ex.name}
                </Text>
                <View style={styles.exStats}>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary }}>
                    {ex.sets}세트
                  </Text>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textTertiary }}>
                    {ex.volume_kg.toLocaleString()}kg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Done button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={[styles.doneBtnText, { fontFamily: typography.fontFamily }]}>완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 2,
  },
  confettiPiece: {
    position: 'absolute',
    top: -24,
    borderRadius: 2,
  },

  hero: { alignItems: 'center', paddingVertical: 32 },
  trophy: { fontSize: 64 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },

  breakdown: {
    borderRadius: 16,
    padding: 16,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  exDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exStats: { alignItems: 'flex-end', gap: 2 },
  tmBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },

  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
