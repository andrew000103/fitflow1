import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { AppCard } from '../../components/common/AppCard';
import { AppProgressBar } from '../../components/common/AppProgressBar';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';

import { useDietStore } from '../../stores/diet-store';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { getPlanCycleInfo } from '../../lib/ai-plan-schedule';
import { getUserProfile, getLatestUserGoal } from '../../lib/profile';
import { useAppTheme } from '../../theme';
import { UserProfileRecord } from '../../types/profile';
import { DietStackParamList } from '../../types/navigation';
import { MEAL_TYPE_LABEL, MealEntry, MealType, NUTRITION_UNIT_LABEL, NutritionUnit } from '../../types/food';

type Props = {
  navigation: NativeStackNavigationProp<DietStackParamList, 'DietMain'>;
};

function calcTargetCaloriesFromProfile(profile: UserProfileRecord, goalType?: string | null): number {
  const { age, height_cm, weight_kg, gender } = profile;
  if (!age || !height_cm || !weight_kg) return 2000;
  const bmr = gender === 'female'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    : 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const tdee = bmr * 1.375;
  if (goalType === 'weight_loss') return Math.max(Math.round(tdee - 500), 1200);
  if (goalType === 'muscle_gain') return Math.round(tdee + 300);
  return Math.round(tdee);
}
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const RING_SIZE = 180;
const RING_STROKE = 14;
const isWeb = Platform.OS === 'web';

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][value.getDay()];
  return `${month}월 ${day}일 ${weekday}요일`;
}

function formatAmount(amount: number, unit: NutritionUnit) {
  return unit === 'serving' ? amount.toFixed(amount % 1 === 0 ? 0 : 1) : Math.round(amount).toString();
}

function MacroProgress({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const { colors, typography } = useAppTheme();
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLabelRow}>
        <Text style={[styles.macroLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>{label}</Text>
        <Text style={[styles.macroVal, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
          {current.toFixed(0)} / {goal}g
        </Text>
      </View>
      <AppProgressBar progress={current / goal} color={color} height={6} />
    </View>
  );
}

function MealSection({ title, entries, onAdd, onOpenMenu }: { title: string; entries: MealEntry[]; onAdd: () => void; onOpenMenu: (entry: MealEntry) => void }) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <AppCard style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>{title}</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accentMuted }]} onPress={onAdd}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
          추가된 음식이 없습니다.
        </Text>
      ) : (
        <View style={styles.entryList}>
          {entries.map((entry, idx) => (
            <TouchableOpacity key={entry.id} style={[styles.entryRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]} onPress={() => onOpenMenu(entry)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryName, { color: colors.text, fontFamily: typography.fontFamily }]}>{entry.food.name}</Text>
                <Text style={[styles.entrySub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {formatAmount(entry.amount, entry.amount_unit)}{NUTRITION_UNIT_LABEL[entry.amount_unit]} · {entry.calories} kcal
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </AppCard>
  );
}

function getPlanDietForDate(weekStart: string, todayKey: string, weeklyDietLength: number) {
  const start = new Date(weekStart + 'T00:00:00');
  const [year, month, day] = todayKey.split('-').map(Number);
  const today = new Date(year, month - 1, day);
  const diffDays = Math.round((today.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0 || diffDays >= weeklyDietLength) return null;
  return diffDays;
}

export default function DietScreen({ navigation }: Props) {
  const { colors, typography, spacing, isDark } = useAppTheme();
  const entriesByDate = useDietStore((state) => state.entriesByDate);
  const removeEntry = useDietStore((state) => state.removeEntry);
  const updateAmount = useDietStore((state) => state.updateAmount);
  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const { user } = useAuthStore();
  const appliedSections = currentPlan?.isApplied ? currentPlan.appliedSections ?? ['workout', 'diet', 'goals'] : [];
  const appliedGoalPlan = currentPlan?.isApplied && appliedSections.includes('goals') ? currentPlan : null;
  const appliedDietPlan = currentPlan?.isApplied && appliedSections.includes('diet') ? currentPlan : null;

  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [macroGoals, setMacroGoals] = useState({ protein_g: 150, carbs_g: 250, fat_g: 65 });
  const [selectedEntry, setSelectedEntry] = useState<MealEntry | null>(null);
  const [editingAmount, setEditingAmount] = useState('');

  useEffect(() => {
    if (appliedGoalPlan) {
      setCalorieGoal(appliedGoalPlan.targetCalories);
      setMacroGoals({
        protein_g: appliedGoalPlan.targetMacros.protein,
        carbs_g: appliedGoalPlan.targetMacros.carbs,
        fat_g: appliedGoalPlan.targetMacros.fat,
      });
      return;
    }
    (async () => {
      if (!user?.id) return;
      try {
        const [profile, goal] = await Promise.all([getUserProfile(user.id), getLatestUserGoal(user.id)]);
        if (goal?.calories_target) {
          setCalorieGoal(goal.calories_target);
          if (goal.protein_target_g || goal.carbs_target_g || goal.fat_target_g) {
            setMacroGoals({
              protein_g: goal.protein_target_g ?? 150,
              carbs_g: goal.carbs_target_g ?? 250,
              fat_g: goal.fat_target_g ?? 65,
            });
          }
          return;
        }
        if (profile) {
          setCalorieGoal(calcTargetCaloriesFromProfile(profile, goal?.goal_type));
        }
      } catch {}
    })();
  }, [appliedGoalPlan, user?.id]);

  const today = useMemo(() => getTodayKey(), []);
  const dayEntries = entriesByDate[today] ?? [];
  const todayPlanDiet = useMemo(() => {
    if (!appliedDietPlan) return null;
    const planIndex = getPlanDietForDate(appliedDietPlan.weekStart, today, appliedDietPlan.weeklyDiet.length);
    return planIndex == null ? null : appliedDietPlan.weeklyDiet[planIndex] ?? null;
  }, [appliedDietPlan, today]);
  const dietCycleInfo = useMemo(
    () => (appliedDietPlan ? getPlanCycleInfo(appliedDietPlan) : null),
    [appliedDietPlan]
  );

  const totals = useMemo(() => dayEntries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein_g: acc.protein_g + e.protein_g,
    carbs_g: acc.carbs_g + e.carbs_g,
    fat_g: acc.fat_g + e.fat_g,
  }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }), [dayEntries]);

  const grouped = useMemo(() => MEAL_ORDER.reduce((acc, type) => {
    acc[type] = dayEntries.filter(e => e.meal_type === type);
    return acc;
  }, {} as Record<MealType, MealEntry[]>), [dayEntries]);

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(totals.calories / calorieGoal, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const handleSaveAmount = () => {
    if (!selectedEntry) return;
    const next = parseFloat(editingAmount);
    if (next > 0) updateAmount(today, selectedEntry.id, next);
    setSelectedEntry(null);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="식단" subtitle={formatDateLabel(today)} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppCard variant="elevated" style={styles.summaryCard}>
          <View style={styles.ringArea}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={radius} stroke={colors.trackBg} strokeWidth={RING_STROKE} fill="none" />
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={radius} stroke={totals.calories > calorieGoal ? colors.error : colors.accent} strokeWidth={RING_STROKE} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" rotation="-90" originX={RING_SIZE/2} originY={RING_SIZE/2} />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.caloriesTotal, { color: colors.text, fontFamily: typography.fontFamily }]}>{totals.calories}</Text>
              <Text style={[styles.caloriesGoal, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>/ {calorieGoal} kcal</Text>
            </View>
          </View>

          <View style={styles.macroList}>
            <MacroProgress label="단백질" current={totals.protein_g} goal={macroGoals.protein_g} color={colors.protein} />
            <MacroProgress label="탄수화물" current={totals.carbs_g} goal={macroGoals.carbs_g} color={colors.carbs} />
            <MacroProgress label="지방" current={totals.fat_g} goal={macroGoals.fat_g} color={colors.fat} />
          </View>
        </AppCard>

        {todayPlanDiet && (
          <AppCard variant="elevated" style={styles.aiDietCard}>
            <View style={styles.aiDietHeader}>
              <Text style={[styles.aiDietTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                적용된 AI 식단 가이드
              </Text>
              <View style={[styles.aiDietBadge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.aiDietBadgeText, { color: colors.accent }]}>적용됨</Text>
              </View>
            </View>
            <Text style={[styles.aiDietMeta, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              {dietCycleInfo?.started
                ? `${dietCycleInfo.cycle + 1}주차 · Day ${(dietCycleInfo.dayIndex ?? 0) + 1} 기준 추천 식단이에요`
                : '플랜 시작일 전이라 첫 주 식단을 미리 보여드리고 있어요'}
            </Text>
            {todayPlanDiet.meals.map((meal, index) => (
              <View key={`${meal.timing}-${index}`} style={[styles.aiMealRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiMealTiming, { color: colors.text, fontFamily: typography.fontFamily }]}>
                    {meal.timing}
                  </Text>
                  <Text style={[styles.aiMealFoods, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                    {meal.foods.join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.aiMealCalories, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                  {meal.calories} kcal
                </Text>
              </View>
            ))}
            <Text style={[styles.aiDietCaption, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
              실제 섭취는 아래에서 직접 기록하고, AI 식단은 참고 가이드로 활용하세요.
            </Text>
          </AppCard>
        )}

        <View style={styles.mealSections}>
          {MEAL_ORDER.map(type => (
            <MealSection key={type} title={MEAL_TYPE_LABEL[type]} entries={grouped[type]} onAdd={() => navigation.navigate('FoodSearch', { mealType: type, date: today })} onOpenMenu={e => { setSelectedEntry(e); setEditingAmount(String(e.amount)); }} />
          ))}
        </View>
      </ScrollView>

      {selectedEntry && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSelectedEntry(null)} />
          <AppCard style={styles.sheet}>
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>{selectedEntry.food.name}</Text>
            <View style={styles.editRow}>
              <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} value={editingAmount} onChangeText={t => setEditingAmount(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" autoFocus />
              <Text style={{ color: colors.textSecondary }}>{NUTRITION_UNIT_LABEL[selectedEntry.amount_unit]}</Text>
            </View>
            <View style={styles.sheetFooter}>
              <AppButton variant="error" label="삭제" onPress={() => { removeEntry(today, selectedEntry.id); setSelectedEntry(null); }} style={{ flex: 1 }} />
              <AppButton variant="primary" label="저장" onPress={handleSaveAmount} style={{ flex: 2 }} />
            </View>
          </AppCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  summaryCard: { padding: 20 },
  aiDietCard: { padding: 16 },
  aiDietHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  aiDietTitle: { fontSize: 16, fontWeight: '700' },
  aiDietBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  aiDietBadgeText: { fontSize: 12, fontWeight: '700' },
  aiDietMeta: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  aiMealRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  aiMealTiming: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  aiMealFoods: { fontSize: 13, lineHeight: 19 },
  aiMealCalories: { fontSize: 13, fontWeight: '700' },
  aiDietCaption: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  ringArea: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  caloriesTotal: { fontSize: 36, fontWeight: '800' },
  caloriesGoal: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  macroList: { marginTop: 24, gap: 14 },
  macroRow: { gap: 8 },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: 14, fontWeight: '600' },
  macroVal: { fontSize: 12 },
  mealSections: { gap: 12 },
  mealCard: { padding: 16 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealTitle: { fontSize: 17, fontWeight: '700' },
  addButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
  entryList: { marginTop: 4 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  entryName: { fontSize: 15, fontWeight: '600' },
  entrySub: { fontSize: 12, marginTop: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  sheetFooter: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
