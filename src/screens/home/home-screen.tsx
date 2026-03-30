import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import CalorieRing from '../../components/home/calorie-ring';
import MacroBars from '../../components/home/macro-bars';
import PersonaSummaryCard, { type PersonaSummaryStage } from '../../components/home/persona-summary-card';
import { AppCard } from '../../components/common/AppCard';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';

import { getLatestUserGoal } from '../../lib/profile';
import { getPlanCycleInfo } from '../../lib/ai-plan-schedule';
import { supabase } from '../../lib/supabase';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useDietStore } from '../../stores/diet-store';
import { usePersonaStore } from '../../stores/persona-store';
import { useThemeStore } from '../../stores/theme-store';
import { useAppTheme } from '../../theme';
import { NutritionSummary } from '../../types/nutrition';
import { RootStackParamList } from '../../types/navigation';

// ─── Goals defaults (used when user_goals not set) ───────────────────────────
const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 250, fat: 60 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getLast7Days(): { date: string; label: string }[] {
  const labels = ['일', '월', '화', '수', '목', '금', '토'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: dateStr(d), label: labels[d.getDay()] });
  }
  return result;
}

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatAppliedSectionLabel(section: 'workout' | 'diet' | 'goals') {
  if (section === 'workout') return '운동';
  if (section === 'diet') return '식단';
  return '목표';
}

type PersonaCardState = {
  confidence: number | null;
  dailyState: string | null;
  hasPersona: boolean;
  headline: string | null;
  message: string | null;
  personaId: string | null;
  personaName: string | null;
  stage: PersonaSummaryStage | null;
};

// ─── WeeklyCalorieChart ───────────────────────────────────────────────────────
function WeeklyCalorieChart({
  data,
  goal,
}: {
  data: { date: string; label: string; calories: number }[];
  goal: number;
}) {
  const { colors, spacing } = useAppTheme();
  const screenW = Dimensions.get('window').width;
  const chartW = screenW - (spacing.lg * 4); // AppCard padding 16 * 2 + Outer margin 16 * 2
  const chartH = 96;
  const labelH = 20;
  const totalH = chartH + labelH;
  const n = data.length;
  const slotW = chartW / n;
  const barW = Math.max(slotW - 10, 6);
  const maxCal = Math.max(...data.map((d) => d.calories), goal, 1);
  const today = dateStr(new Date());

  return (
    <Svg width={chartW} height={totalH}>
      <Line
        x1={0} y1={chartH - (goal / maxCal) * chartH}
        x2={chartW} y2={chartH - (goal / maxCal) * chartH}
        stroke={colors.accent}
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.3}
      />

      {data.map((item, i) => {
        const slotX = i * slotW;
        const barX = slotX + (slotW - barW) / 2;
        const barH = item.calories > 0
          ? Math.max((item.calories / maxCal) * chartH, 4)
          : 0;
        const barY = chartH - barH;
        const isToday = item.date === today;

        return (
          <React.Fragment key={item.date}>
            <Rect
              x={barX} y={barY}
              width={barW} height={barH}
              rx={6}
              fill={isToday ? colors.accent : colors.trackBg}
            />
            <SvgText
              x={slotX + slotW / 2}
              y={chartH + 15}
              textAnchor="middle"
              fontSize={10}
              fill={isToday ? colors.accent : colors.textTertiary}
              fontWeight={isToday ? '700' : '500'}
            >
              {item.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── WeightLineChart ──────────────────────────────────────────────────────────
function WeightLineChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  const { colors, typography, spacing, isDark } = useAppTheme();
  const screenW = Dimensions.get('window').width;
  const chartW = screenW - (spacing.lg * 4);
  const chartH = 80;
  const padH = 8;
  const padV = 10;

  if (data.length < 2) {
    return (
      <View style={{ height: chartH, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textTertiary, fontFamily: typography.fontFamily, fontSize: 13 }}>
          데이터를 쌓고 체중 변화를 확인하세요
        </Text>
      </View>
    );
  }

  const weights = data.map((d) => d.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(maxW - minW, 1);
  const innerW = chartW - padH * 2;
  const innerH = chartH - padV * 2;
  const xStep = innerW / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: padH + i * xStep,
    y: padV + (1 - (d.weight_kg - minW) / range) * innerH,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <Svg width={chartW} height={chartH}>
      <Path
        d={pathD}
        stroke={colors.accent}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={isDark ? colors.background : '#FFF'} stroke={colors.accent} strokeWidth={2} />
      ))}
    </Svg>
  );
}

// ─── AIPlanCard ───────────────────────────────────────────────────────────────
function AIPlanCard() {
  const { colors, typography, spacing, radius } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentPlan, hasCompletedOnboarding, setNeedsOnboarding } = useAIPlanStore();
  const isAppliedPlan = Boolean(currentPlan?.isApplied);

  const handlePress = () => {
    if (currentPlan) {
      navigation.navigate('AIPlanResult', {});
    } else if (hasCompletedOnboarding) {
      navigation.navigate('AIOnboarding');
    } else {
      setNeedsOnboarding(true);
      navigation.navigate('AIConsent');
    }
  };

  const getContent = () => {
    if (currentPlan && isAppliedPlan) {
      const cycleInfo = getPlanCycleInfo(currentPlan);
      const todayPlan = cycleInfo.dayLabel
        ? currentPlan.weeklyWorkout.find((d) => d.dayLabel === cycleInfo.dayLabel)
        : null;
      const isRestDay = cycleInfo.started ? (todayPlan?.isRestDay ?? true) : true;
      const dateRange = (() => {
        const m = new Date(currentPlan.weekStart + 'T00:00:00');
        const s = new Date(m); s.setDate(m.getDate() + 6);
        return `Day1 ${m.getMonth()+1}/${m.getDate()}~Day7 ${s.getMonth()+1}/${s.getDate()}`;
      })();

      const appliedSections = (currentPlan.appliedSections ?? ['workout', 'diet', 'goals']) as Array<'workout' | 'diet' | 'goals'>;
      const appliedSectionsLabel = appliedSections.map(formatAppliedSectionLabel)
        .join(', ');

      return {
        icon: 'clipboard-text-outline',
        title: '반복 중인 AI 플랜',
        subtitle: `${currentPlan.targetCalories.toLocaleString()}kcal · 단백질 ${currentPlan.targetMacros.protein}g · ${appliedSectionsLabel} 적용`,
        extra: !cycleInfo.started
          ? '오늘: 시작 전'
          : `오늘: ${isRestDay ? '휴식일' : (todayPlan?.focus ?? '운동')}`,
        badge: cycleInfo.started ? `반복 ${cycleInfo.cycle + 1}주차` : dateRange,
        cta: '보기'
      };
    }

    if (currentPlan) {
      return {
        icon: 'clipboard-clock-outline',
        title: '검토 중인 AI 플랜',
        subtitle: '결과 화면에서 승인하면 홈, 운동, 식단에 반영됩니다',
        extra: null,
        badge: '미적용',
        cta: '검토하기'
      };
    }

    if (hasCompletedOnboarding) {
      return {
        icon: 'robot-outline',
        title: 'AI 플랜 준비 중',
        subtitle: '정보를 입력하면 맞춤 계획을 생성합니다',
        extra: null,
        badge: null,
        cta: '생성하기'
      };
    }

    return {
      icon: 'creation',
      title: 'AI 맞춤 플랜',
      subtitle: '나에게 딱 맞는 식단·운동 계획을 만들어보세요',
      extra: null,
      badge: null,
      cta: '시작하기'
    };
  };

  const content = getContent();

  return (
    <AppCard variant="elevated" style={aiStyles.card}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={aiStyles.row}>
        <View style={[aiStyles.iconWrap, { backgroundColor: colors.accentMuted }]}>
          <MaterialCommunityIcons name={content.icon as any} size={28} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={aiStyles.titleRow}>
            <Text style={[aiStyles.title, { color: colors.text, fontFamily: typography.fontFamily }]}>
              {content.title}
            </Text>
            {content.badge && (
              <View style={[aiStyles.badge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[aiStyles.badgeText, { color: colors.accent }]}>{content.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[aiStyles.sub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {content.subtitle}
          </Text>
          {content.extra && (
            <Text style={[aiStyles.todayLine, { color: content.extra.includes('휴식') ? colors.textTertiary : colors.accent }]}>
              {content.extra}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </AppCard>
  );
}

const aiStyles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  todayLine: { fontSize: 13, marginTop: 4, fontWeight: '600' },
});

// ─── TodayWorkoutCard ─────────────────────────────────────────────────────────
interface TodayWorkout {
  setCount: number;
  totalVolume: number;
  exerciseNames: string[];
}

function TodayWorkoutCard({ workout }: { workout: TodayWorkout | null }) {
  const { colors, typography, spacing, radius } = useAppTheme();
  const done = workout !== null;

  return (
    <AppCard style={twStyles.card}>
      <View style={[twStyles.icon, { backgroundColor: done ? colors.successMuted : colors.accentMuted }]}>
        <MaterialCommunityIcons
          name={done ? 'check-circle' : 'dumbbell'}
          size={26}
          color={done ? colors.success : colors.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: 16, fontWeight: '700', color: colors.text }}>
          {done ? '오늘 운동 완료!' : '오늘 운동을 시작해보세요'}
        </Text>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {done && workout
            ? `${workout.setCount}세트 · 총 볼륨 ${workout.totalVolume.toLocaleString()}kg`
            : '운동 탭에서 세션을 시작하세요'}
        </Text>
      </View>
      {!done && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      )}
    </AppCard>
  );
}

const twStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16 },
  icon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors, typography, isDark, spacing, radius } = useAppTheme();
  const { user } = useAuthStore();
  const toggle = useThemeStore((s) => s.toggle);
  const getDayTotals = useDietStore((s) => s.getDayTotals);
  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const syncRecurringPlanForToday = useAIPlanStore((s) => s.syncRecurringPlanForToday);
  const appliedPlan = currentPlan?.isApplied ? currentPlan : null;
  const appliedSections = currentPlan?.isApplied ? currentPlan.appliedSections ?? ['workout', 'diet', 'goals'] : [];
  const calculatePersona = usePersonaStore((s) => s.calculatePersona);
  const personaId = usePersonaStore((s) => s.personaId);
  const personaStage = usePersonaStore((s) => s.personaStage);
  const personaConfidence = usePersonaStore((s) => s.confidence);
  const personaDailyState = usePersonaStore((s) => s.dailyState);
  const personaHeadline = usePersonaStore((s) => s.headlineMessage);
  const personaSupportingMessage = usePersonaStore((s) => s.supportingMessage);
  const personaReliabilityState = usePersonaStore((s) => s.reliabilityState);
  const personaValidationWarnings = usePersonaStore((s) => s.validationWarnings);
  const personaNickname = usePersonaStore((s) => s.nickname);
  const isPersonaLoading = usePersonaStore((s) => s.isCalculating);
  const personaError = usePersonaStore((s) => s.error);

  const today = dateStr(new Date());
  const last7 = getLast7Days();

  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight_kg: number }[]>([]);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const remoteRequestIdRef = useRef(0);

  const todayTotals = getDayTotals(today);
  const nutrition: NutritionSummary = {
    calories: { current: todayTotals.calories, goal: goals.calories },
    protein: { current_g: todayTotals.protein_g, goal_g: goals.protein },
    carbs: { current_g: todayTotals.carbs_g, goal_g: goals.carbs },
    fat: { current_g: todayTotals.fat_g, goal_g: goals.fat },
  };

  const weeklyCalories = last7.map(({ date, label }) => ({
    date,
    label,
    calories: getDayTotals(date).calories,
  }));

  const personaSummary: PersonaCardState = {
    confidence: personaConfidence > 0 ? personaConfidence : null,
    dailyState: personaDailyState,
    hasPersona: Boolean(personaId || personaNickname || personaHeadline || personaStage),
    headline: personaHeadline,
    message:
      personaReliabilityState === 'error'
        ? '페르소나 정보를 잠시 불러오지 못했어요.'
        : personaSupportingMessage
          ?? (personaValidationWarnings.includes('low-data-completeness')
            ? '기록이 아직 적어서 오늘은 가벼운 추정 기반으로 보여드리고 있어요.'
            : personaValidationWarnings.includes('goal-derived-from-fallback')
              ? '현재 목표 정보가 충분하지 않아 기본 목표 가정이 일부 반영됐어요.'
              : null),
    personaId,
    personaName: personaNickname,
    stage: personaStage,
  };

  const fetchRemote = useCallback(async () => {
    if (!user?.id) return;
    const requestId = ++remoteRequestIdRef.current;

    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
    const todayEnd = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59, 999).toISOString();
    const weekAgo = dateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    try {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, total_volume_kg, workout_sets(set_number, exercises(name_ko))')
        .eq('user_id', user.id)
        .gte('started_at', todayStart)
        .lte('started_at', todayEnd)
        .not('ended_at', 'is', null);

      if (sessions && sessions.length > 0) {
        if (requestId !== remoteRequestIdRef.current) return;
        const allSets = sessions.flatMap((s: any) => s.workout_sets ?? []);
        setTodayWorkout({
          setCount: allSets.length,
          totalVolume: sessions.reduce((sum: number, s: any) => sum + (s.total_volume_kg ?? 0), 0),
          exerciseNames: [...new Set(allSets.map((s: any) => s.exercises?.name_ko).filter(Boolean))] as string[]
        });
      } else {
        if (requestId !== remoteRequestIdRef.current) return;
        setTodayWorkout(null);
      }
    } catch {}

    try {
      const { count } = await supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('started_at', `${weekAgo}T00:00:00.000Z`)
        .not('ended_at', 'is', null);
      if (requestId !== remoteRequestIdRef.current) return;
      setWeeklyCount(count ?? 0);
    } catch {}

    try {
      const { data: weights, error } = await supabase
        .from('body_weights')
        .select('measured_at, weight_kg')
        .eq('user_id', user.id)
        .gte('measured_at', `${weekAgo}T00:00:00.000Z`)
        .order('measured_at', { ascending: true });

      if (weights && !error) {
        if (requestId !== remoteRequestIdRef.current) return;
        setWeightHistory(weights.map((w: any) => ({ date: w.measured_at.split('T')[0], weight_kg: w.weight_kg })));
      }
    } catch {}

    try {
      const goal = await getLatestUserGoal(user.id);
      if (requestId !== remoteRequestIdRef.current) return;

      if (appliedPlan && appliedSections.includes('goals')) {
        setGoals({
          calories: appliedPlan.targetCalories ?? goal?.calories_target ?? DEFAULT_GOALS.calories,
          protein: appliedPlan.targetMacros.protein ?? goal?.protein_target_g ?? DEFAULT_GOALS.protein,
          carbs: appliedPlan.targetMacros.carbs ?? goal?.carbs_target_g ?? DEFAULT_GOALS.carbs,
          fat: appliedPlan.targetMacros.fat ?? goal?.fat_target_g ?? DEFAULT_GOALS.fat,
        });
      } else if (goal) {
        setGoals({
          calories: goal.calories_target ?? DEFAULT_GOALS.calories,
          protein: goal.protein_target_g ?? DEFAULT_GOALS.protein,
          carbs: goal.carbs_target_g ?? DEFAULT_GOALS.carbs,
          fat: goal.fat_target_g ?? DEFAULT_GOALS.fat,
        });
      } else {
        setGoals(DEFAULT_GOALS);
      }
    } catch {}
  }, [appliedPlan, appliedSections, user?.id, today]);

  const refreshPersona = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    await calculatePersona(user.id);
  }, [calculatePersona, user?.id]);

  useFocusEffect(useCallback(() => {
    if (user?.id) {
      syncRecurringPlanForToday(user.id).catch(() => {});
    }
    fetchRemote();
    refreshPersona();
  }, [fetchRemote, refreshPersona, syncRecurringPlanForToday, user?.id]));

  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight_kg : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <AppHeader
          title={`${user?.email ? user.email.split('@')[0] : '사용자'} 님`}
          subtitle={todayLabel()}
          rightAction={{
            icon: <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={24} color={colors.textSecondary} />,
            onPress: toggle
          }}
        />

        <View style={styles.summaryContainer}>
          <AppCard variant="elevated" style={styles.calorieCard}>
            <PersonaSummaryCard
              confidence={personaSummary.confidence}
              dailyState={personaSummary.dailyState}
              hasPersona={personaSummary.hasPersona}
              hasStore
              headline={personaSummary.headline}
              loading={isPersonaLoading}
              message={personaSummary.message}
              personaId={personaSummary.personaId}
              personaName={personaSummary.personaName}
              stage={personaSummary.stage}
            />
            <View style={styles.ringArea}>
              <CalorieRing current={nutrition.calories.current} goal={goals.calories} />
            </View>
            <View style={[styles.statRow, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.text }]}>{nutrition.calories.current.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>섭취</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: colors.text }]}>{goals.calories.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>목표</Text>
              </View>
            </View>
          </AppCard>

          <MacroBars nutrition={nutrition} />

          <TodayWorkoutCard workout={todayWorkout} />

          <AIPlanCard />
        </View>

        <View style={styles.trendSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.fontFamily, marginLeft: spacing.lg }]}>
            주간 트렌드
          </Text>

          <AppCard style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={[styles.trendTitle, { color: colors.text }]}>이번 주 칼로리</Text>
              <View style={[styles.trendBadge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.trendBadgeText, { color: colors.accent }]}>목표 {goals.calories.toLocaleString()}</Text>
              </View>
            </View>
            <WeeklyCalorieChart data={weeklyCalories} goal={goals.calories} />
          </AppCard>

          <View style={styles.dualTrendRow}>
            <AppCard style={[styles.miniTrendCard, { flex: 1 }]}>
              <View style={[styles.miniIcon, { backgroundColor: colors.successMuted }]}>
                <MaterialCommunityIcons name="dumbbell" size={18} color={colors.success} />
              </View>
              <Text style={[styles.miniValue, { color: colors.text }]}>{weeklyCount}회</Text>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>주간 운동</Text>
            </AppCard>

            <AppCard style={[styles.miniTrendCard, { flex: 1 }]}>
              <View style={[styles.miniIcon, { backgroundColor: colors.accentMuted }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.miniValue, { color: colors.text }]}>{latestWeight ? `${latestWeight}kg` : '-'}</Text>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>현재 체중</Text>
            </AppCard>
          </View>

          <AppCard style={styles.trendCard}>
            <Text style={[styles.trendTitle, { color: colors.text, marginBottom: 16 }]}>체중 변화</Text>
            <WeightLineChart data={weightHistory} />
          </AppCard>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 20 },
  summaryContainer: { gap: 12, marginTop: 12 },
  calorieCard: { marginHorizontal: 16, overflow: 'hidden' },
  ringArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  ringOverlay: { position: 'absolute', alignItems: 'center' },
  remainingVal: { fontSize: 32, fontWeight: '800' },
  remainingLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  statRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 12 },
  trendSection: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  trendCard: { marginHorizontal: 16, padding: 16 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  trendTitle: { fontSize: 16, fontWeight: '700' },
  trendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendBadgeText: { fontSize: 11, fontWeight: '700' },
  dualTrendRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  miniTrendCard: { padding: 16, alignItems: 'flex-start' },
  miniIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  miniValue: { fontSize: 18, fontWeight: '800' },
  miniLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
