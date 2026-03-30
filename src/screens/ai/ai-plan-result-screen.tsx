import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchUserHistorySummary,
  generateAIPlan,
  saveAIPlanToSupabase,
} from '../../lib/ai-planner';
import { AIPlan, WorkoutDay, useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

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

// ─── GoalSummaryCard ──────────────────────────────────────────────────────────
function GoalSummaryCard({ plan, colors }: { plan: AIPlan; colors: any }) {
  return (
    <View style={[cardStyles.wrap, { backgroundColor: colors.card }]}>
      <Text style={[cardStyles.title, { color: colors.text }]}>목표</Text>
      <View style={cardStyles.row}>
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.accent }]}>
            {plan.targetCalories.toLocaleString()}
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>kcal</Text>
        </View>
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.protein }]}>
            {plan.targetMacros.protein}g
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>단백질</Text>
        </View>
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.item}>
          <Text style={[cardStyles.value, { color: colors.carbs }]}>
            {plan.targetMacros.carbs}g
          </Text>
          <Text style={[cardStyles.label, { color: colors.textSecondary }]}>탄수화물</Text>
        </View>
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
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
  title: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 11, marginTop: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: 4 },
});

// ─── WorkoutDayCard ───────────────────────────────────────────────────────────
function WorkoutDayCard({ day, weekStart, colors }: { day: WorkoutDay; weekStart: string; colors: any }) {
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
          <Text style={[wdStyles.focusText, { color: colors.accent }]}>{day.focus}</Text>
        )}
      </View>
      {day.exercises.map((ex, i) => (
        <View key={i} style={[wdStyles.exRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
          <Text style={[wdStyles.exName, { color: colors.text }]}>{ex.name}</Text>
          <Text style={[wdStyles.exDetail, { color: colors.textSecondary }]}>
            {ex.sets}세트 × {ex.repsRange}회
            {ex.note ? `  · ${ex.note}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const wdStyles = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayText: { fontSize: 15, fontWeight: '600' },
  dateText: { fontSize: 12, marginTop: 2 },
  focusText: { fontSize: 13 },
  restBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  restText: { fontSize: 12 },
  exRow: { paddingVertical: 8 },
  exName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  exDetail: { fontSize: 13 },
});

// ─── ExplanationCard ──────────────────────────────────────────────────────────
function ExplanationCard({ plan, colors }: { plan: AIPlan; colors: any }) {
  const [open, setOpen] = useState(true);

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
        <View style={dtStyles.macroHeader}>
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
          <View style={dtStyles.mealHeader}>
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
  title: { fontSize: 15, fontWeight: '600' },
  calText: { fontSize: 17, fontWeight: '700' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  macroLabel: { fontSize: 14 },
  macroValue: { fontSize: 14, fontWeight: '600' },
  mealCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealTiming: { fontSize: 15, fontWeight: '600' },
  mealCal: { fontSize: 13 },
  foodItem: { fontSize: 14, lineHeight: 22 },
  macroLine: { fontSize: 12, marginTop: 8 },
  disclaimerBox: { borderRadius: 14, padding: 14, marginBottom: 10 },
  disclaimerText: { fontSize: 13, lineHeight: 20 },
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
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 }}>
              {/* 핸들바 */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                Day 1 시작일 선택
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                선택한 날이 Day 1이 됩니다 (Day 7까지 순서대로 이어집니다)
              </Text>

              {/* 주 네비게이터 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => handleOffsetChange(-1)}
                  style={{ padding: 8 }}
                  disabled={weekOffset <= -4}
                >
                  <Text style={{ fontSize: 22, color: weekOffset <= -4 ? colors.border : colors.accent }}>‹</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{rangeLabel}</Text>
                <TouchableOpacity
                  onPress={() => handleOffsetChange(1)}
                  style={{ padding: 8 }}
                  disabled={weekOffset >= 12}
                >
                  <Text style={{ fontSize: 22, color: weekOffset >= 12 ? colors.border : colors.accent }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* 날짜 버튼 행 */}
              <View style={{ flexDirection: 'row', gap: 5, marginBottom: 20 }}>
                {weekDays.map((day, i) => {
                  const isSelected = selectedDateStr === day.dateStr;
                  const isCurrent = day.isCurrentStart;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedDateStr(day.dateStr)}
                      style={{
                        flex: 1,
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
                <View style={{ backgroundColor: colors.accentMuted, borderRadius: 10, padding: 12, marginBottom: 16 }}>
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
                style={{ backgroundColor: selectedDateStr ? colors.accent : colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
                onPress={handleConfirm}
                disabled={!selectedDateStr}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>이 날로 시작</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }} onPress={onClose}>
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 }}>
              {/* 핸들바 */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                플랜 다시 만들기
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
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

// ─── AIPlanResultScreen ───────────────────────────────────────────────────────
export default function AIPlanResultScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const { currentPlan, onboardingData, setCurrentPlan, setGenerating, setError, updateWeekStart } =
    useAIPlanStore();

  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [regenerating, setLocalRegenerating] = useState(false);
  const [regenSheetVisible, setRegenSheetVisible] = useState(false);
  const [startDateSheetVisible, setStartDateSheetVisible] = useState(false);

  const handleRegenerate = async () => {
    if (!onboardingData) return;
    setLocalRegenerating(true);
    setGenerating(true);
    try {
      const history = user?.id ? await fetchUserHistorySummary(user.id) : null;
      const plan = await generateAIPlan(onboardingData, history);
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
    updateWeekStart(newStartDate);
    setStartDateSheetVisible(false);
    // Supabase 비동기 업데이트 (결과 무시)
    if (user?.id && currentPlan) {
      supabase
        .from('ai_plans')
        .update({ week_start: newStartDate })
        .eq('id', currentPlan.id)
        .then(() => {});
    }
  };

  if (!currentPlan) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.emptyWrap}>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            플랜 데이터가 없습니다.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent }}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={[s.backText, { color: colors.accent }]}>← 닫기</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.text }]}>이번 주 AI 플랜</Text>
          <TouchableOpacity onPress={() => setStartDateSheetVisible(true)} activeOpacity={0.7}>
            <Text style={[s.headerSub, { color: colors.accent }]}>{weekLabel} ✎</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setRegenSheetVisible(true)}
          disabled={regenerating}
          style={s.regenBtn}
        >
          <Text style={[s.regenText, { color: regenerating ? colors.textTertiary : colors.accent }]}>
            {regenerating ? '생성 중...' : '재생성'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭바 */}
      <View style={[s.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(['workout', 'diet'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, { color: activeTab === tab ? colors.accent : colors.textSecondary }]}>
              {tab === 'workout' ? `운동 계획 (주 ${workoutDays}일)` : '식단 계획'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StartDateSheet
        visible={startDateSheetVisible}
        currentStartDate={currentPlan.weekStart}
        onConfirm={handleStartDateConfirm}
        onClose={() => setStartDateSheetVisible(false)}
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

      {/* 컨텐츠 */}
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <GoalSummaryCard plan={currentPlan} colors={colors} />

        {activeTab === 'workout' ? (
          <>
            <ExplanationCard plan={currentPlan} colors={colors} />
            {sortedWorkout.map((day) => (
              <WorkoutDayCard key={day.dayLabel} day={day} weekStart={currentPlan.weekStart} colors={colors} />
            ))}
          </>
        ) : (
          <DietTab plan={currentPlan} colors={colors} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 56 },
  backText: { fontSize: 15 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSub: { fontSize: 12, marginTop: 1 },
  regenBtn: { minWidth: 56, alignItems: 'flex-end' },
  regenText: { fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '500' },
  content: { padding: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16 },
});
