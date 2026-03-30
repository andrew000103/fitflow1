import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutHistory'>;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetAction = {
  text: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
};

type SheetConfig = {
  title: string;
  message?: string;
  actions: SheetAction[];
};

interface HistorySet {
  id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_pr: boolean;
  exercises: { name_ko: string; category: string | null } | null;
}

interface HistorySession {
  id: string;
  started_at: string;
  ended_at: string;
  total_volume_kg: number | null;
  notes: string | null;
  workout_sets: HistorySet[];
}

interface HistorySetRow {
  id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_pr: boolean;
  exercises: Array<{ name_ko: string; category: string | null }> | { name_ko: string; category: string | null } | null;
}

interface HistorySessionRow {
  id: string;
  started_at: string;
  ended_at: string;
  total_volume_kg: number | null;
  notes: string | null;
  workout_sets: HistorySetRow[];
}

interface ExerciseSummary {
  name: string;
  setCount: number;
  bestSet: { weight_kg: number; reps: number } | null;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const DAY_ABBR = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDuration(startedAt: string, endedAt: string): string {
  const diff = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${m}분`;
}

function computeVolume(sets: HistorySet[]): number {
  return sets.reduce((v, s) => v + s.weight_kg * s.reps, 0);
}

function groupExercises(sets: HistorySet[]): ExerciseSummary[] {
  const map = new Map<string, ExerciseSummary>();
  for (const s of sets) {
    if (!s.exercises) continue;
    const name = s.exercises.name_ko;
    const ex = map.get(name);
    if (ex) {
      ex.setCount += 1;
      if (
        ex.bestSet === null ||
        s.weight_kg > ex.bestSet.weight_kg ||
        (s.weight_kg === ex.bestSet.weight_kg && s.reps > ex.bestSet.reps)
      ) {
        ex.bestSet = { weight_kg: s.weight_kg, reps: s.reps };
      }
    } else {
      map.set(name, { name, setCount: 1, bestSet: { weight_kg: s.weight_kg, reps: s.reps } });
    }
  }
  return Array.from(map.values());
}

function normalizeHistorySession(row: HistorySessionRow): HistorySession {
  return {
    ...row,
    workout_sets: row.workout_sets.map((set) => {
      let exercises: HistorySet['exercises'] = null;
      if (Array.isArray(set.exercises)) {
        exercises = set.exercises[0] ?? null;
      } else if (set.exercises && typeof set.exercises === 'object') {
        exercises = set.exercises as { name_ko: string; category: string | null };
      }
      return { ...set, exercises };
    }),
  };
}

function sessionDateStr(session: HistorySession): string {
  return toDateStr(new Date(session.started_at));
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

function BottomSheet({ config, onDismiss }: { config: SheetConfig | null; onDismiss: () => void }) {
  const { colors, typography } = useAppTheme();
  if (!config) return null;
  return (
    <View style={sheetStyles.overlay}>
      <TouchableOpacity style={sheetStyles.backdrop} onPress={onDismiss} activeOpacity={1} />
      <View style={[sheetStyles.sheet, { backgroundColor: colors.card }]}>
        <Text style={[sheetStyles.title, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {config.title}
        </Text>
        {config.message ? (
          <Text style={[sheetStyles.message, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {config.message}
          </Text>
        ) : null}
        <View style={[sheetStyles.divider, { backgroundColor: colors.border }]} />
        {config.actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={[
              sheetStyles.actionBtn,
              i < config.actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              action.style === 'cancel' && { marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
            ]}
            onPress={() => { onDismiss(); action.onPress?.(); }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                sheetStyles.actionText,
                { fontFamily: typography.fontFamily },
                action.style === 'destructive' && { color: '#FF3B30', fontWeight: '600' },
                action.style === 'cancel' && { color: colors.textSecondary },
                action.style !== 'destructive' && action.style !== 'cancel' && { color: colors.accent, fontWeight: '600' },
              ]}
            >
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingBottom: 36 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: 14, textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 16 },
  actionBtn: { paddingVertical: 16, alignItems: 'center', paddingHorizontal: 20 },
  actionText: { fontSize: 17 },
});

// ─── MonthCalendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  initialYear,
  initialMonth,
  workoutDates,
  onSelectDate,
  onClose,
}: {
  initialYear: number;
  initialMonth: number;
  workoutDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}) {
  const { colors, typography } = useAppTheme();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const today = new Date();
  const todayStr = toDateStr(today);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const canGoNext =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={calStyles.overlay}>
      <TouchableOpacity style={calStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[calStyles.sheet, { backgroundColor: colors.card }]}>
        {/* Title bar */}
        <View style={calStyles.calHeader}>
          <Text style={[calStyles.calTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
            날짜 선택
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Month navigation */}
        <View style={calStyles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[calStyles.monthLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {viewYear}년 {MONTH_NAMES[viewMonth]}
          </Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} disabled={!canGoNext}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={canGoNext ? colors.text : colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={calStyles.dayHeaders}>
          {DAY_ABBR.map(d => (
            <Text key={d} style={[calStyles.dayHeader, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {rows.map((row, ri) => (
          <View key={ri} style={calStyles.calRow}>
            {row.map((day, ci) => {
              if (!day) return <View key={ci} style={calStyles.calCell} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasWorkout = workoutDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              return (
                <TouchableOpacity
                  key={ci}
                  style={calStyles.calCell}
                  onPress={() => { if (!isFuture) { onSelectDate(dateStr); onClose(); } }}
                  disabled={isFuture}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    calStyles.calDayNum,
                    { color: isFuture ? colors.textTertiary : colors.text, fontFamily: typography.fontFamily },
                    isToday && { color: colors.accent, fontWeight: '700' },
                  ]}>
                    {day}
                  </Text>
                  {isToday && (
                    <Text style={[calStyles.todayLabel, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                      오늘
                    </Text>
                  )}
                  {hasWorkout && (
                    <View style={[calStyles.calDot, { backgroundColor: colors.accent }]} />
                  )}
                  {!hasWorkout && <View style={calStyles.calDotPlaceholder} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 16,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  calTitle: { fontSize: 17, fontWeight: '700' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, paddingVertical: 4 },
  calRow: { flexDirection: 'row' },
  calCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  calDayNum: { fontSize: 15 },
  todayLabel: { fontSize: 9, marginTop: 1 },
  calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  calDotPlaceholder: { width: 5, height: 5, marginTop: 2 },
});

// ─── WeekStrip ────────────────────────────────────────────────────────────────

function WeekStrip({
  weekStart,
  workoutDates,
  selectedDate,
  onPrevWeek,
  onNextWeek,
  onSelectDate,
}: {
  weekStart: Date;
  workoutDates: Set<string>;
  selectedDate: string | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectDate: (dateStr: string) => void;
}) {
  const { colors, typography } = useAppTheme();
  const today = new Date();
  const todayStr = toDateStr(today);
  const currentWeekStartStr = toDateStr(startOfWeek(today));
  const weekStartStr = toDateStr(weekStart);
  const canGoNext = weekStartStr < currentWeekStartStr;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);
  const startM = weekStart.getMonth();
  const endM = weekEnd.getMonth();
  const year = weekStart.getFullYear();
  const monthLabel =
    startM === endM
      ? `${year}년 ${MONTH_NAMES[startM]}`
      : `${year}년 ${MONTH_NAMES[startM]} · ${MONTH_NAMES[endM]}`;

  return (
    <View style={[weekStyles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={weekStyles.monthRow}>
        <TouchableOpacity onPress={onPrevWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[weekStyles.monthLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>
          {monthLabel}
        </Text>
        <TouchableOpacity onPress={onNextWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={!canGoNext}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={canGoNext ? colors.text : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={weekStyles.daysRow}>
        {days.map(d => {
          const dateStr = toDateStr(d);
          const hasWorkout = workoutDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > todayStr;
          return (
            <TouchableOpacity
              key={dateStr}
              style={weekStyles.dayCol}
              onPress={() => { if (!isFuture) onSelectDate(dateStr); }}
              disabled={isFuture}
              activeOpacity={0.7}
            >
              <Text style={[
                weekStyles.dayName,
                { color: isFuture ? colors.textTertiary : colors.textSecondary, fontFamily: typography.fontFamily },
              ]}>
                {DAY_ABBR[d.getDay()]}
              </Text>
              <View style={[
                weekStyles.dateCircle,
                isSelected && !isToday && { backgroundColor: colors.accent },
                isToday && isSelected && { backgroundColor: colors.accent },
              ]}>
                <Text style={[
                  weekStyles.dateNum,
                  { fontFamily: typography.fontFamily },
                  isFuture
                    ? { color: colors.textTertiary }
                    : isSelected || isToday
                    ? { color: isSelected ? '#fff' : colors.accent, fontWeight: '700' }
                    : { color: colors.text },
                ]}>
                  {d.getDate()}
                </Text>
              </View>
              <View style={weekStyles.dotWrap}>
                {hasWorkout && (
                  <View style={[weekStyles.dot, { backgroundColor: isSelected ? '#fff' : colors.accent }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const weekStyles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  monthLabel: { fontSize: 15, fontWeight: '600' },
  daysRow: { flexDirection: 'row' },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayName: { fontSize: 11 },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNum: { fontSize: 15 },
  dotWrap: { height: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

// ─── SessionCard ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onDelete,
}: {
  session: HistorySession;
  onDelete: (id: string) => void;
}) {
  const { colors, typography } = useAppTheme();
  const exercises = groupExercises(session.workout_sets);
  const setCount = session.workout_sets.length;
  const exerciseCount = exercises.length;
  const volume = session.total_volume_kg ?? computeVolume(session.workout_sets);
  const duration = formatDuration(session.started_at, session.ended_at);
  const hasPR = session.workout_sets.some(s => s.is_pr);

  const date = new Date(session.started_at);
  const dateHeader = `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_ABBR[date.getDay()]})`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Date header row */}
      <View style={styles.cardDateRow}>
        <View style={styles.cardDateLeft}>
          <Text style={[styles.cardDate, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {dateHeader}
          </Text>
          {hasPR && (
            <View style={[styles.prTag, { backgroundColor: colors.accentMuted }]}>
              <Text style={[styles.prTagText, { color: colors.accent }]}>🏆 PR</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => onDelete(session.id)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {duration}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
            시간
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {volume > 0 ? `${Math.round(volume).toLocaleString()}kg` : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
            볼륨
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text, fontFamily: typography.fontFamily }]}>
            {setCount}세트
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
            {exerciseCount}종목
          </Text>
        </View>
      </View>

      {/* Exercise table */}
      {exercises.length > 0 && (
        <View style={styles.exerciseTable}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.exNameCol, styles.tableHeaderText, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
              종목
            </Text>
            <Text style={[styles.exSetsCol, styles.tableHeaderText, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
              세트
            </Text>
            <Text style={[styles.exBestCol, styles.tableHeaderText, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
              최고 세트
            </Text>
          </View>
          {exercises.map((ex, i) => (
            <View
              key={ex.name}
              style={[
                styles.exRow,
                { borderTopColor: colors.border },
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text
                style={[styles.exNameCol, { color: colors.text, fontFamily: typography.fontFamily }]}
                numberOfLines={1}
              >
                {ex.name}
              </Text>
              <Text style={[styles.exSetsCol, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                {ex.setCount}
              </Text>
              <Text style={[styles.exBestCol, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                {ex.bestSet
                  ? ex.bestSet.weight_kg > 0
                    ? `${ex.bestSet.weight_kg}kg × ${ex.bestSet.reps}`
                    : `${ex.bestSet.reps}회`
                  : '-'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── WorkoutHistoryScreen ─────────────────────────────────────────────────────

export default function WorkoutHistoryScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetConfig | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateStr(new Date()));

  const flatListRef = useRef<FlatList>(null);

  const workoutDates = useMemo(
    () => new Set(sessions.map(sessionDateStr)),
    [sessions],
  );

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!user?.id) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          started_at,
          ended_at,
          total_volume_kg,
          notes,
          workout_sets(
            id,
            set_number,
            weight_kg,
            reps,
            is_pr,
            exercises(name_ko, category)
          )
        `)
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(200);

      if (!error && data) {
        setSessions((data as HistorySessionRow[]).map(normalizeHistorySession));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setWeekStart(startOfWeek(new Date(dateStr + 'T12:00:00')));
    const idx = sessions.findIndex(s => sessionDateStr(s) === dateStr);
    if (idx !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    }
  }, [sessions]);

  const handleDeleteRequest = useCallback((sessionId: string) => {
    setActiveSheet({
      title: '운동 기록 삭제',
      message: '이 운동 기록을 삭제할까요? 되돌릴 수 없습니다.',
      actions: [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제하기',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('workout_sessions')
              .delete()
              .eq('id', sessionId);
            if (!error) {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
            } else {
              console.error('[delete session] failed:', error.message);
            }
          },
        },
      ],
    });
  }, []);

  const calYear = weekStart.getFullYear();
  const calMonth = weekStart.getMonth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.size.lg,
          fontWeight: typography.weight.bold,
          color: colors.text,
        }}>
          운동 기록
        </Text>
        <TouchableOpacity onPress={() => setShowCalendar(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.accent} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={sessions}
          keyExtractor={s => s.id}
          renderItem={({ item }) => <SessionCard session={item} onDelete={handleDeleteRequest} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchHistory(true)}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={
            <View>
              <WeekStrip
                weekStart={weekStart}
                workoutDates={workoutDates}
                selectedDate={selectedDate}
                onPrevWeek={() => setWeekStart(w => addDays(w, -7))}
                onNextWeek={() => setWeekStart(w => addDays(w, 7))}
                onSelectDate={handleSelectDate}
              />
              {sessions.length > 0 && (
                <Text style={[styles.totalCount, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  총 {sessions.length}회 운동
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="dumbbell" size={52} color={colors.textTertiary} />
              <Text style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.md,
                fontWeight: typography.weight.semibold,
                color: colors.textSecondary,
                marginTop: 16,
              }}>
                운동 기록이 없습니다
              </Text>
              <Text style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                color: colors.textTertiary,
                marginTop: 6,
                textAlign: 'center',
              }}>
                첫 운동을 시작해보세요!
              </Text>
            </View>
          }
        />
      )}

      {showCalendar && (
        <MonthCalendar
          initialYear={calYear}
          initialMonth={calMonth}
          workoutDates={workoutDates}
          onSelectDate={handleSelectDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <BottomSheet config={activeSheet} onDismiss={() => setActiveSheet(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },

  list: { paddingBottom: 40 },

  totalCount: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Session card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardDate: {
    fontSize: 17,
    fontWeight: '700',
  },
  prTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prTagText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stats row (3 columns)
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 10,
  },

  // Exercise table
  exerciseTable: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  exNameCol: { flex: 1, fontSize: 14 },
  exSetsCol: { width: 36, textAlign: 'center', fontSize: 14 },
  exBestCol: { width: 110, textAlign: 'right', fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 80 },
});
