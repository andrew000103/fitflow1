import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import { SwapExerciseSheet } from '../../components/ai/SwapExerciseSheet';
import { getLatestUserGoal, saveUserGoal } from '../../lib/profile';
import {
  buildWorkoutHistorySection,
  fetchUserHistorySummary,
  generateAIPlan,
  saveAIPlanToSupabase,
  updateAIPlanSnapshotInSupabase,
} from '../../lib/ai-planner';
import { AI_GOAL_LABEL, AIPlan, OnboardingData, WorkoutDay, useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { GoalType } from '../../types/profile';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DAY_LABEL_KO = ['일', '월', '화', '수', '목', '금', '토']; // JS getDay() 기준

function getDayDate(weekStart: string, dayLabel: string): Date {
  const n = parseInt(dayLabel.replace('day', ''), 10) - 1; // 0-based
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d;
}

function formatDayHeader(weekStart: string, dayLabel: string): string {
  const d = getDayDate(weekStart, dayLabel);
  const dayKo = DAY_LABEL_KO[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${dayKo})`;
}

type PlanApplySection = 'workout' | 'diet' | 'goals';

function mapAIGoalToUserGoal(goal?: OnboardingData['goal'] | null): GoalType | undefined {
  if (!goal) return undefined;
  if (goal === 'weight_loss') return 'loss';
  if (goal === 'muscle_gain' || goal === 'strength_gain') return 'gain';
  return 'maintain';
}

function formatAppliedSectionLabel(section: PlanApplySection) {
  if (section === 'workout') return '운동';
  if (section === 'diet') return '식단';
  return '목표';
}

// ─── GoalSummaryCard ──────────────────────────────────────────────────────────
function GoalSummaryCard({
  plan,
  onboardingData,
  colors,
}: {
  plan: AIPlan;
  onboardingData: OnboardingData | null;
  colors: any;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const primaryStrengthFocusLabel: Record<NonNullable<OnboardingData['primaryStrengthFocus']>, string> = {
    squat: '스쿼트',
    bench: '벤치프레스',
    deadlift: '데드리프트',
    balanced: '전신 균형',
  };

  return (
    <View style={[cardStyles.wrap, { backgroundColor: colors.card }]}>
      <View style={cardStyles.header}>
        <Text style={[cardStyles.title, { color: colors.text }]}>목표</Text>
        {onboardingData?.goal && (
          <View style={[cardStyles.goalBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[cardStyles.goalBadgeText, { color: colors.accent }]}>
              {AI_GOAL_LABEL[onboardingData.goal]}
            </Text>
          </View>
        )}
      </View>
      {onboardingData?.goal === 'strength_gain' && onboardingData.primaryStrengthFocus && (
        <Text style={[cardStyles.subLabel, { color: colors.textSecondary }]}>
          우선 리프트: {primaryStrengthFocusLabel[onboardingData.primaryStrengthFocus]}
        </Text>
      )}
      <View style={[cardStyles.row, isCompact && cardStyles.rowCompact]}>
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.accent }]}>
            {plan.targetCalories.toLocaleString()}
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>kcal</Text>
        </View>
        <View style={[cardStyles.divider, isCompact && cardStyles.dividerCompact, { backgroundColor: colors.border }]} />
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.protein }]}>
            {plan.targetMacros.protein}g
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>단백질</Text>
        </View>
        <View style={[cardStyles.divider, isCompact && cardStyles.dividerCompact, { backgroundColor: colors.border }]} />
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.carbs }]}>
            {plan.targetMacros.carbs}g
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>탄수화물</Text>
        </View>
        <View style={[cardStyles.divider, isCompact && cardStyles.dividerCompact, { backgroundColor: colors.border }]} />
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.fat }]}>
            {plan.targetMacros.fat}g
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>지방</Text>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: { borderRadius: 16, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '600' },
  goalBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  goalBadgeText: { fontSize: 12, fontWeight: '700' },
  subLabel: { fontSize: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowCompact: { flexWrap: 'wrap', rowGap: 12 },
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: 4 },
  dividerCompact: { width: '100%', height: StyleSheet.hairlineWidth, marginHorizontal: 0 },
});

// ─── WorkoutDayCard ───────────────────────────────────────────────────────────
function WorkoutDayCard({
  day,
  weekStart,
  colors,
  onSwap,
}: {
  day: WorkoutDay;
  weekStart: string;
  colors: any;
  onSwap?: (exIdx: number, exerciseName: string) => void;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const dayNum = day.dayLabel.replace('day', '');
  const dateStr = formatDayHeader(weekStart, day.dayLabel);

  if (day.isRestDay) {
    return (
      <View style={[wdStyles.wrap, { backgroundColor: colors.card }]}>
        <View style={wdStyles.header}>
          <View>
            <Text style={[wdStyles.dayText, { color: colors.textSecondary }]}>Day {dayNum}</Text>
            <Text style={[wdStyles.dateText, { color: colors.textTertiary }]}>{dateStr}</Text>
          </View>
          <View style={[wdStyles.restBadge, { backgroundColor: colors.separator }]}>
            <Text style={[wdStyles.restText, { color: colors.textTertiary }]}>휴식</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[wdStyles.wrap, { backgroundColor: colors.card }]}>
      <View style={wdStyles.header}>
        <View>
          <Text style={[wdStyles.dayText, { color: colors.text }]}>Day {dayNum}</Text>
          <Text style={[wdStyles.dateText, { color: colors.textTertiary }]}>{dateStr}</Text>
        </View>
        {day.focus && (
          <Text style={[wdStyles.focusText, isCompact && wdStyles.focusTextCompact, { color: colors.accent }]}>{day.focus}</Text>
        )}
      </View>
      {day.exercises.map((ex, i) => (
        <View key={i} style={[wdStyles.exRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
          <View style={{ flex: 1 }}>
            <Text style={[wdStyles.exName, { color: colors.text }]}>{ex.name}</Text>
            <Text style={[wdStyles.exDetail, { color: colors.textSecondary }]}>
              {ex.sets}세트 × {ex.repsRange}회{ex.note ? `  · ${ex.note}` : ''}
            </Text>
          </View>
          {onSwap && (
            <TouchableOpacity
              onPress={() => onSwap(i, ex.name)}
              style={{ padding: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 12, color: colors.accent }}>교체</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const wdStyles = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 },
  dayText: { fontSize: 15, fontWeight: '600' },
  dateText: { fontSize: 12, marginTop: 2 },
  focusText: { fontSize: 13 },
  focusTextCompact: { flex: 1, textAlign: 'right' },
  restBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  restText: { fontSize: 12 },
  exRow: { paddingVertical: 8 },
  exName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  exDetail: { fontSize: 13 },
});

// ─── ExplanationCard ──────────────────────────────────────────────────────────
function ExplanationCard({ plan, colors }: { plan: AIPlan; colors: any }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[exStyles.wrap, { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.accent + '60' }]}>
      <TouchableOpacity
        style={exStyles.toggle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[exStyles.toggleText, { color: colors.text }]}>
          이 플랜이 당신에게 맞는 이유
        </Text>
        <Text style={[exStyles.chevron, { color: colors.accent }]}>
          {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={[exStyles.body, { borderTopColor: colors.border }]}>
          <Text style={[exStyles.summary, { color: colors.text }]}>
            {plan.explanation.summary}
          </Text>
          <Text style={[exStyles.detail, { color: colors.textSecondary }]}>
            {plan.explanation.detail}
          </Text>
          {plan.explanation.sources.length > 0 && (
            <View style={exStyles.sources}>
              <Text style={[exStyles.sourcesTitle, { color: colors.textTertiary }]}>
                참고 기준
              </Text>
              {plan.explanation.sources.map((s, i) => (
                <Text key={i} style={[exStyles.sourceItem, { color: colors.textTertiary }]}>
                  · {s}
                </Text>
              ))}
            </View>
          )}
          <View style={[exStyles.disclaimer, { backgroundColor: colors.separator }]}>
            <Text style={[exStyles.disclaimerText, { color: colors.textTertiary }]}>
              ⚠️ 이 계획은 의료적 조언이 아닙니다. 건강 이상이 있으면 전문가와 상담하세요.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const exStyles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  toggleText: { fontSize: 15, fontWeight: '600' },
  chevron: { fontSize: 13 },
  body: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  summary: { fontSize: 15, fontWeight: '500', marginBottom: 10, lineHeight: 22 },
  detail: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  sources: { marginBottom: 12 },
  sourcesTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  sourceItem: { fontSize: 12, lineHeight: 18 },
  disclaimer: { borderRadius: 8, padding: 10 },
  disclaimerText: { fontSize: 12, lineHeight: 18 },
});

// ─── DietTab ──────────────────────────────────────────────────────────────────
function DietTab({ plan, colors }: { plan: AIPlan; colors: any }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const diet = plan.weeklyDiet[0];
  if (!diet) return null;

  const macros = [
    { label: '단백질', value: plan.targetMacros.protein, color: colors.protein },
    { label: '탄수화물', value: plan.targetMacros.carbs, color: colors.carbs },
    { label: '지방', value: plan.targetMacros.fat, color: colors.fat },
  ];

  return (
    <>
      {/* 목표 매크로 */}
      <View style={[dtStyles.macroCard, { backgroundColor: colors.card }]}>
        <View style={[dtStyles.macroHeader, isCompact && dtStyles.macroHeaderCompact]}>
          <Text style={[dtStyles.title, { color: colors.text }]}>하루 목표</Text>
          <Text style={[dtStyles.calText, { color: colors.accent }]}>
            {plan.targetCalories.toLocaleString()} kcal
          </Text>
        </View>
        {macros.map((m) => (
          <View key={m.label} style={dtStyles.macroRow}>
            <Text style={[dtStyles.macroLabel, { color: colors.textSecondary }]}>{m.label}</Text>
            <Text style={[dtStyles.macroValue, { color: m.color }]}>{m.value}g</Text>
          </View>
        ))}
      </View>

      {/* 끼니별 */}
      {diet.meals.map((meal, i) => (
        <View key={i} style={[dtStyles.mealCard, { backgroundColor: colors.card }]}>
          <View style={[dtStyles.mealHeader, isCompact && dtStyles.mealHeaderCompact]}>
            <Text style={[dtStyles.mealTiming, { color: colors.text }]}>{meal.timing}</Text>
            <Text style={[dtStyles.mealCal, { color: colors.textSecondary }]}>
              약 {meal.calories}kcal
            </Text>
          </View>
          {meal.foods.map((food, j) => (
            <Text key={j} style={[dtStyles.foodItem, { color: colors.textSecondary }]}>
              · {food}
            </Text>
          ))}
          <Text style={[dtStyles.macroLine, { color: colors.textTertiary }]}>
            단 {meal.macros.protein}g · 탄 {meal.macros.carbs}g · 지 {meal.macros.fat}g
          </Text>
        </View>
      ))}

      {/* 면책 */}
      <View style={[dtStyles.disclaimerBox, { backgroundColor: colors.card }]}>
        <Text style={[dtStyles.disclaimerText, { color: colors.textTertiary }]}>
          ⚠️ 이 식단은 예시입니다. 식단 탭에서 직접 기록하면 더 정확한 추적이 가능합니다.
        </Text>
      </View>
    </>
  );
}

const dtStyles = StyleSheet.create({
  macroCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  macroHeaderCompact: { alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 15, fontWeight: '600' },
  calText: { fontSize: 17, fontWeight: '700' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  macroLabel: { fontSize: 14 },
  macroValue: { fontSize: 14, fontWeight: '600' },
  mealCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealHeaderCompact: { alignItems: 'flex-start', gap: 8 },
  mealTiming: { fontSize: 15, fontWeight: '600' },
  mealCal: { fontSize: 13 },
  foodItem: { fontSize: 14, lineHeight: 22 },
  macroLine: { fontSize: 12, marginTop: 8 },
  disclaimerBox: { borderRadius: 14, padding: 14, marginBottom: 10 },
  disclaimerText: { fontSize: 13, lineHeight: 20 },
});

const sheetStyles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  weekLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  weekLabelCompact: {
    fontSize: 14,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  dayGridCompact: {
    justifyContent: 'space-between',
  },
  selectionBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionRow: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCheckText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  applyPrimaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  applyPrimaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

// ─── 시작일 선택 시트 ────────────────────────────────────────────────────────────

const WEEK_DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function StartDateSheet({
  visible,
  currentStartDate,
  onConfirm,
  onClose,
  colors,
}: {
  visible: boolean;
  currentStartDate: string;
  onConfirm: (newStartDate: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // offset 변경 시 선택 초기화
  const handleOffsetChange = (delta: number) => {
    setWeekOffset(prev => prev + delta);
    setSelectedDateStr(null);
  };

  // 현재 주 월요일 기준 + offset 주
  const weekMonday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff + weekOffset * 7);
    return mon;
  }, [weekOffset]);

  // 7일 배열 (월~일)
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: d,
        dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        dayKo: WEEK_DAY_KO[d.getDay()],
        isCurrentStart: dateStr === currentStartDate,
      };
    }),
  [weekMonday, currentStartDate]);

  const rangeLabel = `${weekDays[0].label} ~ ${weekDays[6].label}`;

  const handleConfirm = () => {
    if (!selectedDateStr) return;
    onConfirm(selectedDateStr);
    setWeekOffset(0);
    setSelectedDateStr(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[sheetStyles.container, isCompact && sheetStyles.containerCompact, { backgroundColor: colors.card }]}>
              {/* 핸들바 */}
              <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
              <Text style={[sheetStyles.title, { color: colors.text }]}>
                플랜 시작일 변경
              </Text>
              <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>
                선택한 날짜를 Day 1로 두고 7일 플랜이 반복됩니다
              </Text>

              {/* 주 네비게이터 */}
              <View style={sheetStyles.weekNav}>
                <TouchableOpacity
                  onPress={() => handleOffsetChange(-1)}
                  style={{ padding: 8 }}
                  disabled={weekOffset <= -4}
                >
                  <Text style={{ fontSize: 22, color: weekOffset <= -4 ? colors.border : colors.accent }}>‹</Text>
                </TouchableOpacity>
                <Text style={[sheetStyles.weekLabel, isCompact && sheetStyles.weekLabelCompact, { color: colors.text }]}>{rangeLabel}</Text>
                <TouchableOpacity
                  onPress={() => handleOffsetChange(1)}
                  style={{ padding: 8 }}
                  disabled={weekOffset >= 12}
                >
                  <Text style={{ fontSize: 22, color: weekOffset >= 12 ? colors.border : colors.accent }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* 날짜 버튼 행 */}
              <View style={[sheetStyles.dayGrid, isCompact && sheetStyles.dayGridCompact]}>
                {weekDays.map((day, i) => {
                  const isSelected = selectedDateStr === day.dateStr;
                  const isCurrent = day.isCurrentStart;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedDateStr(day.dateStr)}
                      style={{
                        width: isCompact ? '30.5%' : undefined,
                        flex: isCompact ? undefined : 1,
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent : isCurrent ? colors.accent + '80' : colors.border,
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? '#fff' : colors.accent }}>
                        {day.dayKo}
                      </Text>
                      <Text style={{ fontSize: 10, marginTop: 2, color: isSelected ? '#fff' : colors.textSecondary }}>
                        {day.label}
                      </Text>
                      {isCurrent && !isSelected && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 2 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 선택 확인 텍스트 */}
              {selectedDateStr && (
                <View style={[sheetStyles.selectionBox, { backgroundColor: colors.accentMuted }]}>
                  <Text style={{ fontSize: 13, color: colors.text }}>
                    Day 1: {weekDays.find(d => d.dateStr === selectedDateStr)?.label} ({weekDays.find(d => d.dateStr === selectedDateStr)?.dayKo}) ~
                    Day 7: {(() => {
                      const start = new Date(selectedDateStr + 'T00:00:00');
                      start.setDate(start.getDate() + 6);
                      return `${start.getMonth() + 1}/${start.getDate()} (${WEEK_DAY_KO[start.getDay()]})`;
                    })()}
                  </Text>
                </View>
              )}

              {/* 확정 버튼 */}
              <TouchableOpacity
                style={[sheetStyles.primaryButton, { backgroundColor: selectedDateStr ? colors.accent : colors.border }]}
                onPress={handleConfirm}
                disabled={!selectedDateStr}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>이 날로 시작</Text>
              </TouchableOpacity>
              <TouchableOpacity style={sheetStyles.secondaryAction} onPress={onClose}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── 재생성 바텀시트 ────────────────────────────────────────────────────────────

function RegenBottomSheet({
  visible,
  hasOnboardingData,
  onRegenSame,
  onRegenNew,
  onClose,
  colors,
}: {
  visible: boolean;
  hasOnboardingData: boolean;
  onRegenSame: () => void;
  onRegenNew: () => void;
  onClose: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[sheetStyles.container, isCompact && sheetStyles.containerCompact, { backgroundColor: colors.card }]}>
              {/* 핸들바 */}
              <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
              <Text style={[sheetStyles.title, { color: colors.text }]}>
                플랜 다시 만들기
              </Text>
              <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>
                어떻게 새 플랜을 만들까요?
              </Text>

              {/* 기존 정보로 재생성 */}
              <TouchableOpacity
                style={{ paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, opacity: hasOnboardingData ? 1 : 0.4 }}
                onPress={hasOnboardingData ? onRegenSame : undefined}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  기존 정보로 재생성
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
                  이전에 입력한 정보 그대로 새 플랜 생성
                </Text>
              </TouchableOpacity>

              {/* 새로 설문하기 */}
              <TouchableOpacity
                style={{ paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
                onPress={onRegenNew}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  새로 설문하기
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
                  질문에 다시 답해서 더 정확한 플랜 만들기
                </Text>
              </TouchableOpacity>

              {/* 취소 */}
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 16 }} onPress={onClose}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function ApplyConfirmSheet({
  visible,
  isReapply,
  selectedSections,
  onToggleSection,
  onConfirm,
  onClose,
  applying,
  colors,
}: {
  visible: boolean;
  isReapply: boolean;
  selectedSections: Record<PlanApplySection, boolean>;
  onToggleSection: (section: PlanApplySection) => void;
  onConfirm: () => void;
  onClose: () => void;
  applying: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const canConfirm = Object.values(selectedSections).some(Boolean) && !applying;

  const sectionRows: Array<{ key: PlanApplySection; title: string; description: string }> = [
    {
      key: 'workout',
      title: '운동 프로그램 적용',
      description: '운동 탭에서 이번 주 AI 운동 계획을 현재 플랜으로 사용합니다.',
    },
    {
      key: 'diet',
      title: '식단 계획 적용',
      description: '식단 탭에서 오늘의 AI 식단 추천을 함께 보여줍니다.',
    },
    {
      key: 'goals',
      title: '목표 칼로리/매크로 적용',
      description: '홈과 식단의 목표 칼로리, 단백질, 탄수화물, 지방 목표를 업데이트합니다.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[sheetStyles.container, isCompact && sheetStyles.containerCompact, { backgroundColor: colors.card }]}>
              <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
              <Text style={[sheetStyles.title, { color: colors.text }]}>
                {isReapply ? '현재 플랜을 다시 설정할까요?' : '이 플랜을 적용할까요?'}
              </Text>
              <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>
                {isReapply
                  ? '적용 범위를 다시 확인하면 홈, 운동, 식단 반영 상태를 업데이트합니다.'
                  : '적용할 범위를 확인한 뒤 승인하면 홈, 운동, 식단에 반영됩니다.'}
              </Text>

              {sectionRows.map((section) => {
                const selected = selectedSections[section.key];
                return (
                  <TouchableOpacity
                    key={section.key}
                    style={[
                      sheetStyles.sectionRow,
                      {
                        backgroundColor: selected ? colors.accentMuted : colors.background,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => onToggleSection(section.key)}
                    activeOpacity={0.85}
                  >
                    <View style={sheetStyles.sectionHeader}>
                      <Text style={[sheetStyles.sectionTitle, { color: colors.text }]}>
                        {section.title}
                      </Text>
                      <View
                        style={[
                          sheetStyles.sectionCheck,
                          {
                            backgroundColor: selected ? colors.accent : 'transparent',
                            borderColor: selected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text style={[sheetStyles.sectionCheckText, { color: selected ? '#fff' : colors.textTertiary }]}>
                          {selected ? '✓' : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={[sheetStyles.sectionDescription, { color: colors.textSecondary }]}>
                      {section.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  sheetStyles.applyPrimaryButton,
                  { backgroundColor: canConfirm ? colors.accent : colors.border },
                ]}
                onPress={onConfirm}
                disabled={!canConfirm}
                activeOpacity={0.85}
              >
                <Text style={sheetStyles.applyPrimaryButtonText}>
                  {applying ? '적용 중...' : isReapply ? '다시 설정하기' : '적용하고 닫기'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={sheetStyles.secondaryAction} onPress={onClose}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const resultStyles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  regenBtn: {
    paddingVertical: 8,
    paddingLeft: 8,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  completeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  tabCompact: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextCompact: {
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  footerActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
  },
  footerSecondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerPrimaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  planMetaCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planMetaTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  planMetaBody: {
    fontSize: 15,
    fontWeight: '600',
  },
  planMetaHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});

// ─── AIPlanResultScreen ───────────────────────────────────────────────────────
export default function AIPlanResultScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const s = resultStyles;
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const { currentPlan, onboardingData, setCurrentPlan, setGenerating, setError, updateWeekStart, swapExercise } =
    useAIPlanStore();
  const markCurrentPlanApplied = useAIPlanStore((s) => s.markCurrentPlanApplied);

  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [regenerating, setLocalRegenerating] = useState(false);
  const [applySheetVisible, setApplySheetVisible] = useState(false);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [regenSheetVisible, setRegenSheetVisible] = useState(false);
  const [startDateSheetVisible, setStartDateSheetVisible] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Record<PlanApplySection, boolean>>({
    workout: true,
    diet: true,
    goals: true,
  });

  const [swapSheet, setSwapSheet] = useState<{
    visible: boolean;
    dayLabel: string;
    exIdx: number;
    exerciseName: string;
  } | null>(null);

  const handleSwapOpen = (dayLabel: string, exIdx: number, exerciseName: string) => {
    setSwapSheet({ visible: true, dayLabel, exIdx, exerciseName });
  };

  const handleSwapSelect = async (newName: string) => {
    if (!swapSheet || !currentPlan) return;
    swapExercise(swapSheet.dayLabel as WorkoutDay['dayLabel'], swapSheet.exIdx, newName);
    setSwapSheet(null);
    const updatedPlan = useAIPlanStore.getState().currentPlan;
    if (updatedPlan) {
      updateAIPlanSnapshotInSupabase(updatedPlan).catch(() => {});
    }
  };

  const handleOpenCustomExerciseSearch = () => {
    if (!swapSheet) return;
    const nextSwapTarget = { ...swapSheet };
    setSwapSheet(null);
    navigation.navigate('AIExerciseSearch', {
      dayLabel: nextSwapTarget.dayLabel as WorkoutDay['dayLabel'],
      exerciseIndex: nextSwapTarget.exIdx,
      exerciseName: nextSwapTarget.exerciseName,
    });
  };

  const openApplySheet = () => {
    if (regenerating || !currentPlan) return;
    setApplySheetVisible(true);
  };

  const toggleApplySection = (section: PlanApplySection) => {
    setSelectedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApplyConfirm = async () => {
    if (!currentPlan) return;

    const appliedSections = (Object.entries(selectedSections) as Array<[PlanApplySection, boolean]>)
      .filter(([, enabled]) => enabled)
      .map(([section]) => section);

    if (appliedSections.length === 0) {
      Alert.alert('적용 항목 선택', '적어도 한 가지 항목은 선택해주세요.');
      return;
    }

    setApplyingPlan(true);
    try {
      const nextAppliedPlan: AIPlan = {
        ...currentPlan,
        isApplied: true,
        appliedAt: new Date().toISOString(),
        appliedSections,
      };

      if (user?.id && selectedSections.goals) {
        const existingGoal = await getLatestUserGoal(user.id);
        await saveUserGoal(
          user.id,
          {
            goal_type: mapAIGoalToUserGoal(onboardingData?.goal),
            calories_target: currentPlan.targetCalories,
            protein_target_g: currentPlan.targetMacros.protein,
            carbs_target_g: currentPlan.targetMacros.carbs,
            fat_target_g: currentPlan.targetMacros.fat,
          },
          existingGoal?.id
        );
      }

      await updateAIPlanSnapshotInSupabase(nextAppliedPlan);
      markCurrentPlanApplied(appliedSections);
      setApplySheetVisible(false);
      const appliedLabel = appliedSections.map(formatAppliedSectionLabel).join(', ');
      Alert.alert(
        '플랜 적용 완료',
        `${appliedLabel}이(가) 지금부터 내 계획에 반영됩니다.`,
        [
          {
            text: '확인',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              }),
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '플랜 적용에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setApplyingPlan(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onboardingData) return;
    setLocalRegenerating(true);
    setGenerating(true);
    try {
      const history = user?.id ? await fetchUserHistorySummary(user.id) : null;
      let workoutHistorySection = '';
      if (user?.id && currentPlan) {
        workoutHistorySection = await buildWorkoutHistorySection(user.id, currentPlan);
      }

      const plan = await generateAIPlan(onboardingData, history, workoutHistorySection);
      setCurrentPlan(plan);
      if (user?.id) {
        saveAIPlanToSupabase(user.id, plan, onboardingData).catch(() => {});
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '플랜 재생성에 실패했습니다.';
      setError(msg);
      Alert.alert('오류', msg);
    } finally {
      setLocalRegenerating(false);
      setGenerating(false);
    }
  };

  const handleStartDateConfirm = (newStartDate: string) => {
    if (!currentPlan) return;

    const updatedPlan: AIPlan = {
      ...currentPlan,
      weekStart: newStartDate,
    };
    updateAIPlanSnapshotInSupabase(updatedPlan)
      .then(() => {
        updateWeekStart(newStartDate);
        setStartDateSheetVisible(false);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '플랜 시작일 변경에 실패했습니다.';
        Alert.alert('오류', message);
      });
  };

  if (!currentPlan) {
    return (
      <AIFlowScreen scroll={false}>
        <View style={s.emptyWrap}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            플랜 데이터가 없습니다.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent }}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </AIFlowScreen>
    );
  }

  const sortedWorkout = [...currentPlan.weeklyWorkout].sort(
    (a, b) => parseInt(a.dayLabel.replace('day', '')) - parseInt(b.dayLabel.replace('day', ''))
  );

  const workoutDays = sortedWorkout.filter((d) => !d.isRestDay).length;
  const weekLabel = (() => {
    const start = new Date(currentPlan.weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `Day1 ${fmt(start)} ~ Day7 ${fmt(end)}`;
  })();
  const isAppliedPlan = Boolean(currentPlan.isApplied);

  return (
    <AIFlowScreen
      header={
        <>
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={[s.backText, { color: colors.accent }]}>← 닫기</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={[s.headerTitle, { color: colors.text }]}>내 AI 플랜</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={regenerating || applyingPlan}
              style={s.regenBtn}
            >
              <Text style={[s.completeText, { color: regenerating || applyingPlan ? colors.textTertiary : colors.accent }]}>
                완료
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[s.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            {(['workout', 'diet'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, isCompact && s.tabCompact, activeTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, isCompact && s.tabTextCompact, { color: activeTab === tab ? colors.accent : colors.textSecondary }]}>
                  {tab === 'workout' ? `운동 계획 (주 ${workoutDays}일)` : '식단 계획'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      }
      contentContainerStyle={s.content}
      footer={
        <View style={s.footerActions}>
          <TouchableOpacity
            style={[s.footerSecondaryBtn, { borderColor: colors.border }, (regenerating || applyingPlan) && { opacity: 0.5 }]}
            onPress={() => setStartDateSheetVisible(true)}
            disabled={regenerating || applyingPlan}
            activeOpacity={0.8}
          >
            <Text style={[s.footerSecondaryText, { color: colors.textSecondary }]}>플랜 시작일 변경</Text>
          </TouchableOpacity>

          {!isAppliedPlan ? (
            <>
              <TouchableOpacity
                style={[s.footerPrimaryBtn, { backgroundColor: regenerating ? colors.border : colors.accent }]}
                onPress={openApplySheet}
                disabled={regenerating || applyingPlan}
                activeOpacity={0.85}
              >
                <Text style={s.footerPrimaryText}>
                  {applyingPlan ? '적용 중...' : regenerating ? '생성 중...' : '이 플랜 적용하기'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.footerSecondaryBtn, { borderColor: colors.border }, (regenerating || applyingPlan) && { opacity: 0.5 }]}
                onPress={() => setRegenSheetVisible(true)}
                disabled={regenerating || applyingPlan}
                activeOpacity={0.8}
              >
                <Text style={[s.footerSecondaryText, { color: colors.textSecondary }]}>다른 플랜 받아보기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[s.footerPrimaryBtn, { backgroundColor: regenerating ? colors.border : colors.accent }]}
              onPress={() => setRegenSheetVisible(true)}
              disabled={regenerating || applyingPlan}
              activeOpacity={0.85}
            >
              <Text style={s.footerPrimaryText}>
                {regenerating ? '생성 중...' : '플랜 재설정'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      }
    >

      <View style={[s.planMetaCard, { backgroundColor: colors.card }]}>
        <Text style={[s.planMetaTitle, { color: colors.text }]}>플랜 주기</Text>
        <Text style={[s.planMetaBody, { color: colors.textSecondary }]}>{weekLabel}</Text>
        <Text style={[s.planMetaHint, { color: colors.textTertiary }]}>
          선택한 시작일을 기준으로 Day 1부터 Day 7까지 반복됩니다.
        </Text>
      </View>

      <StartDateSheet
        visible={startDateSheetVisible}
        currentStartDate={currentPlan.weekStart}
        onConfirm={handleStartDateConfirm}
        onClose={() => setStartDateSheetVisible(false)}
        colors={colors}
      />

      <ApplyConfirmSheet
        visible={applySheetVisible}
        isReapply={isAppliedPlan}
        selectedSections={selectedSections}
        onToggleSection={toggleApplySection}
        onConfirm={handleApplyConfirm}
        onClose={() => setApplySheetVisible(false)}
        applying={applyingPlan}
        colors={colors}
      />

      <RegenBottomSheet
        visible={regenSheetVisible}
        hasOnboardingData={onboardingData !== null}
        onRegenSame={() => { setRegenSheetVisible(false); handleRegenerate(); }}
        onRegenNew={() => { setRegenSheetVisible(false); navigation.navigate('AIOnboarding'); }}
        onClose={() => setRegenSheetVisible(false)}
        colors={colors}
      />

      {swapSheet && (
        <SwapExerciseSheet
          exerciseName={swapSheet.exerciseName}
          visible={swapSheet.visible}
          onSelect={handleSwapSelect}
          onPressCustomSelect={handleOpenCustomExerciseSearch}
          onClose={() => setSwapSheet(null)}
          colors={colors}
        />
      )}

      {/* 컨텐츠 */}
      <GoalSummaryCard plan={currentPlan} onboardingData={onboardingData} colors={colors} />

      {activeTab === 'workout' ? (
        <>
          <ExplanationCard plan={currentPlan} colors={colors} />
          {sortedWorkout.map((day) => (
            <WorkoutDayCard
              key={day.dayLabel}
              day={day}
              weekStart={currentPlan.weekStart}
              colors={colors}
              onSwap={(exIdx, exerciseName) => handleSwapOpen(day.dayLabel, exIdx, exerciseName)}
            />
          ))}
        </>
      ) : (
        <DietTab plan={currentPlan} colors={colors} />
      )}

      <View style={{ height: 12 }} />
    </AIFlowScreen>
  );
}
