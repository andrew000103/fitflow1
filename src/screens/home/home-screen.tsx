import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import BodyFatigueCard from '../../components/home/body-fatigue-card';
import PixelEvolutionCard from '../../components/home/pixel-evolution-card';
import ProteinRemainingCard from '../../components/home/protein-remaining-card';
import { AppCard } from '../../components/common/AppCard';
import { AppHeader } from '../../components/common/AppHeader';

import { calculateBodyFatigue, FatigueResult } from '../../lib/home-fatigue';
import { getLatestUserGoal, getUserProfile } from '../../lib/profile';
import { getPlanCycleInfo } from '../../lib/ai-plan-schedule';
import { supabase } from '../../lib/supabase';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useDietStore } from '../../stores/diet-store';
import { usePersonaStore } from '../../stores/persona-store';
import { useThemeStore } from '../../stores/theme-store';
import { useAppTheme } from '../../theme';
import { MainTabParamList, RootStackParamList } from '../../types/navigation';

// ─── Goals defaults (used when user_goals not set) ───────────────────────────
const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 250, fat: 60 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function getQuickCharacterStyleCopy(
  trainingStyle?: 'health' | 'physique' | 'performance' | null,
  dietConsistency?: 'low' | 'medium' | 'high' | null,
) {
  const styleCopy = trainingStyle === 'performance'
    ? '기록 향상 중심 루틴'
    : trainingStyle === 'physique'
      ? '몸만들기 중심 루틴'
      : '건강관리 중심 루틴';

  const dietCopy = dietConsistency === 'high'
    ? '식단도 꽤 꾸준히 챙기는 편이에요.'
    : dietConsistency === 'medium'
      ? '식단은 가끔씩 균형을 맞추는 편이에요.'
      : '지금은 운동 중심으로 리듬을 만드는 단계예요.';

  return {
    headline: `${styleCopy}에 맞춰 현재 수준을 먼저 정리해두었어요.`,
    supporting: `${dietCopy} 더 정확한 운동·식단 가이드를 원하면 테스트를 해보세요.`,
  };
}

// ─── AIPlanCard ───────────────────────────────────────────────────────────────
function AIPlanCard() {
  const { colors, typography, spacing, radius } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentPlan, hasCompletedOnboarding, surveyLevelResult, setNeedsOnboarding } = useAIPlanStore();
  const isAppliedPlan = Boolean(currentPlan?.isApplied);

  const handlePress = () => {
    if (currentPlan) {
      navigation.navigate('AIPlanResult', {});
    } else if (hasCompletedOnboarding) {
      navigation.navigate(surveyLevelResult ? 'AILevelResult' : 'AIOnboarding');
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
        title: surveyLevelResult ? `${surveyLevelResult.levelName} 맞춤 AI 플랜` : 'AI 플랜 준비 중',
        subtitle: surveyLevelResult
          ? '현재 레벨 결과를 바탕으로 운동·식단 계획을 이어서 만들 수 있어요'
          : '정보를 입력하면 맞춤 계획을 생성합니다',
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

function TodayWorkoutCard({
  workout,
  onPress,
}: {
  workout: TodayWorkout | null;
  onPress: () => void;
}) {
  const { colors, typography, spacing, radius } = useAppTheme();
  const done = workout !== null;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
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
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </AppCard>
    </TouchableOpacity>
  );
}

const twStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 16 },
  icon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors, typography, isDark, spacing } = useAppTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Home'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const { user } = useAuthStore();
  const toggle = useThemeStore((s) => s.toggle);
  const getDayTotals = useDietStore((s) => s.getDayTotals);
  const getDayEntries = useDietStore((s) => s.getDayEntries);
  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const hasCompletedOnboarding = useAIPlanStore((s) => s.hasCompletedOnboarding);
  const setNeedsOnboarding = useAIPlanStore((s) => s.setNeedsOnboarding);
  const syncRecurringPlanForToday = useAIPlanStore((s) => s.syncRecurringPlanForToday);
  const appliedPlan = currentPlan?.isApplied ? currentPlan : null;
  const appliedSections = currentPlan?.isApplied ? currentPlan.appliedSections ?? ['workout', 'diet', 'goals'] : [];
  const calculatePersona = usePersonaStore((s) => s.calculatePersona);
  const quickCharacterProfile = usePersonaStore((s) => s.quickCharacterProfile);
  const personaLevelId = usePersonaStore((s) => s.levelId);
  const personaLevelName = usePersonaStore((s) => s.levelName);
  const personaNextLevelName = usePersonaStore((s) => s.nextLevelName);
  const personaProgressToNext = usePersonaStore((s) => s.progressToNext);
  const personaChecklist = usePersonaStore((s) => s.checklist);
  const personaDailyState = usePersonaStore((s) => s.dailyState);
  const personaHeadline = usePersonaStore((s) => s.headlineMessage);
  const personaProgressMessage = usePersonaStore((s) => s.progressMessage);
  const personaSupportingMessage = usePersonaStore((s) => s.supportingMessage);
  const personaReliabilityState = usePersonaStore((s) => s.reliabilityState);
  const isPersonaLoading = usePersonaStore((s) => s.isCalculating);
  const personaVariantId = usePersonaStore((s) => s.variantId);
  const personaArchetypeId = usePersonaStore((s) => s.archetypeId);

  const today = dateStr(new Date());
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [fatigueData, setFatigueData] = useState<FatigueResult>({ items: [], unclassifiedCount: 0 });
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [homeNickname, setHomeNickname] = useState<string | null>(null);
  const remoteRequestIdRef = useRef(0);

  const todayTotals = getDayTotals(today);
  const todayEntries = getDayEntries(today);

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
      const { data: latestWeightRow, error } = await supabase
        .from('body_weights')
        .select('weight_kg')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error) {
        if (requestId !== remoteRequestIdRef.current) return;
        setLatestWeight(latestWeightRow?.weight_kg ?? null);
      }
    } catch {}

    try {
      const fatigueSince = new Date();
      fatigueSince.setDate(fatigueSince.getDate() - 4);
      const { data: fatigueSets } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, exercises(name_ko, category), workout_sessions!inner(started_at, user_id, ended_at)')
        .eq('workout_sessions.user_id', user.id)
        .not('workout_sessions.ended_at', 'is', null)
        .gte('workout_sessions.started_at', fatigueSince.toISOString());

      if (requestId !== remoteRequestIdRef.current) return;
      const fatigueScores = calculateBodyFatigue(
        (fatigueSets ?? []).map((set: any) => ({
          category: Array.isArray(set.exercises) ? set.exercises[0]?.category ?? null : set.exercises?.category ?? null,
          exerciseName: Array.isArray(set.exercises) ? set.exercises[0]?.name_ko ?? null : set.exercises?.name_ko ?? null,
          weightKg: set.weight_kg ?? 0,
          reps: set.reps ?? 0,
          startedAt: Array.isArray(set.workout_sessions)
            ? set.workout_sessions[0]?.started_at
            : set.workout_sessions?.started_at,
        })),
      );
      setFatigueData(fatigueScores);
    } catch {
      if (requestId !== remoteRequestIdRef.current) return;
      setFatigueData({ items: [], unclassifiedCount: 0 });
    }

    try {
      const profile = await getUserProfile(user.id);
      if (requestId !== remoteRequestIdRef.current) return;
      setHomeNickname(profile?.nickname?.trim() || null);
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

  useEffect(() => {
    if (!user?.id) return;
    calculatePersona(user.id).catch(() => {});
  }, [
    calculatePersona,
    currentPlan?.id,
    onboardingData?.experience,
    quickCharacterProfile?.completedAt,
    user?.id,
  ]);

  const displayName = homeNickname || (user?.email ? user.email.split('@')[0] : '사용자');
  const hasDetailedCharacterProfile = Boolean(currentPlan || onboardingData || hasCompletedOnboarding || surveyLevelResult);
  const activeQuickCharacterProfile = quickCharacterProfile?.userId === user?.id ? quickCharacterProfile : null;
  const hasQuickCharacterProfile = Boolean(activeQuickCharacterProfile);
  const hasAnyCharacterProfile = Boolean(surveyLevelResult || hasDetailedCharacterProfile || hasQuickCharacterProfile);
  const displayLevelId = surveyLevelResult?.levelId ?? personaLevelId;
  const displayLevelName = surveyLevelResult?.levelName ?? personaLevelName;
  const quickCharacterCopy = getQuickCharacterStyleCopy(
    activeQuickCharacterProfile?.trainingStyle,
    activeQuickCharacterProfile?.dietConsistency ?? null,
  );
  const hamsterCtaLabel = hasDetailedCharacterProfile
    ? null
    : '내 헬스 레벨 판정받기';
  const hamsterCtaSupportingMessage = hasDetailedCharacterProfile
    ? personaSupportingMessage
      ? `최근 기록 기준: ${personaSupportingMessage}`
      : surveyLevelResult?.description ?? null
    : hasQuickCharacterProfile
      ? '예전 빠른 설정 대신, 이제는 테스트 한 번으로 현재 헬스 레벨과 다음 단계를 더 정확하게 정리해드려요.'
      : 'AI 플랜 없이도 괜찮아요. 테스트 한 번으로 지금 내 루틴 기준 헬스 레벨을 먼저 확인할 수 있어요.';
  const hamsterCtaHeadline = hasDetailedCharacterProfile
    ? surveyLevelResult?.vibe ?? (personaHeadline ? `최근 기록 기준: ${personaHeadline}` : null)
    : hasQuickCharacterProfile
      ? `${quickCharacterCopy.headline} 지금은 테스트 기반 판정으로 더 정확하게 다시 볼 수 있어요.`
      : null;
  const handleHamsterCtaPress = useCallback(() => {
    if (hasCompletedOnboarding && surveyLevelResult) {
      navigation.navigate('AILevelResult');
      return;
    }
    if (hasCompletedOnboarding) {
      navigation.navigate('AIOnboarding');
      return;
    }
    if (hasQuickCharacterProfile) {
      setNeedsOnboarding(true);
      navigation.navigate('AIConsent');
      return;
    }
    setNeedsOnboarding(true);
    navigation.navigate('AIConsent');
  }, [hasCompletedOnboarding, hasQuickCharacterProfile, navigation, setNeedsOnboarding, surveyLevelResult]);
  const handleWorkoutCardPress = useCallback(() => {
    navigation.navigate('Workout');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <AppHeader
          title={`${displayName} 님`}
          subtitle={todayLabel()}
          rightAction={{
            icon: <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={24} color={colors.textSecondary} />,
            onPress: toggle
          }}
        />

        <View style={styles.summaryContainer}>
          <AppCard variant="elevated" style={styles.calorieCard}>
            <PixelEvolutionCard
              ctaLabel={hamsterCtaLabel}
              checklist={personaChecklist}
              dailyState={personaDailyState}
              headline={hamsterCtaHeadline}
              levelId={hasAnyCharacterProfile ? displayLevelId : null}
              levelName={hasAnyCharacterProfile ? displayLevelName : null}
              loading={isPersonaLoading}
              nextLevelName={hasAnyCharacterProfile ? personaNextLevelName : null}
              onPressCta={hamsterCtaLabel ? handleHamsterCtaPress : null}
              progressMessage={
                !hasAnyCharacterProfile
                  ? null
                  : personaReliabilityState === 'error'
                  ? '최근 기록 기준 레벨 안내를 잠시 불러오지 못했어요.'
                  : personaProgressMessage
                  ? `최근 기록 기준: ${personaProgressMessage}`
                  : null
              }
              progressToNext={hasAnyCharacterProfile ? personaProgressToNext : null}
              hasWorkoutToday={Boolean(todayWorkout)}
              mealEntryCountToday={todayEntries.length}
              proteinToday={todayTotals.protein_g}
              proteinGoal={goals.protein}
              supportingMessage={hamsterCtaSupportingMessage}
              variantId={personaVariantId}
              archetypeId={personaArchetypeId}
            />
          </AppCard>

          <AIPlanCard />

          <ProteinRemainingCard
            currentProtein={todayTotals.protein_g}
            goalProtein={goals.protein}
          />

          <TodayWorkoutCard workout={todayWorkout} onPress={handleWorkoutCardPress} />

          <BodyFatigueCard data={fatigueData} />
        </View>

        <View style={styles.trendSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.fontFamily, marginLeft: spacing.lg }]}>
            주간 트렌드
          </Text>

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
              <Text style={[styles.miniValue, { color: colors.text }]}>{latestWeight != null ? `${latestWeight}kg` : '-'}</Text>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>현재 체중</Text>
            </AppCard>
          </View>
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
  trendSection: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  dualTrendRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  miniTrendCard: { padding: 16, alignItems: 'flex-start' },
  miniIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  miniValue: { fontSize: 18, fontWeight: '800' },
  miniLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
