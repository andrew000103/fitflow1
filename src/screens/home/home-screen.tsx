import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalorieRing from '../../components/home/calorie-ring';
import MacroBars from '../../components/home/macro-bars';
import WorkoutStatusCard from '../../components/home/workout-status-card';
import { useAuthStore } from '../../stores/auth-store';
import { useThemeStore } from '../../stores/theme-store';
import { useAppTheme } from '../../theme';
import { NutritionSummary } from '../../types/nutrition';
import { WorkoutSummary } from '../../types/workout';

// TODO: Supabase에서 오늘 날짜 기준으로 데이터 가져오기 (meal_logs, workout_sessions)
const MOCK_NUTRITION: NutritionSummary = {
  calories: { current: 1480, goal: 2200 },
  protein: { current_g: 95, goal_g: 150 },
  carbs: { current_g: 180, goal_g: 250 },
  fat: { current_g: 42, goal_g: 60 },
};

const MOCK_WORKOUT: WorkoutSummary = {
  completed: false,
  total_volume_kg: 0,
  set_count: 0,
};

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export default function HomeScreen() {
  const { colors, typography, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const toggle = useThemeStore((s) => s.toggle);

  // TODO: replace with real Zustand store backed by Supabase
  const nutrition = MOCK_NUTRITION;
  const workout = MOCK_WORKOUT;

  const consumed = nutrition.calories.current;
  const goal = nutrition.calories.goal;
  const remaining = Math.max(goal - consumed, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.date, { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.size.sm }]}>
              {todayLabel()}
            </Text>
            <Text style={[styles.greeting, { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
              {user?.email ? user.email.split('@')[0] : '게스트'} 님
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggle}
            style={[styles.themeBtn, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Calorie Card ────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
          <View style={styles.ringArea}>
            <CalorieRing current={consumed} goal={goal} />
          </View>

          {/* Stat chips */}
          <View style={[styles.statRow, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent, fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
                {remaining.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.size.xs }]}>
                남은 칼로리
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text, fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
                {goal.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.size.xs }]}>
                목표 칼로리
              </Text>
            </View>
          </View>
        </View>

        {/* ── Workout Card ────────────────────────────────── */}
        <View style={styles.section}>
          <WorkoutStatusCard workout={workout} />
        </View>

        {/* ── Macro Card ──────────────────────────────────── */}
        <View style={styles.section}>
          <MacroBars nutrition={nutrition} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  date: {
    marginBottom: 2,
  },
  greeting: {},
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  // Calorie card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  ringArea: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  statValue: {},
  statLabel: {
    marginTop: 3,
  },

  section: {
    marginTop: 12,
  },
});
