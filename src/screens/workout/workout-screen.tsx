import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '../../components/common/AppCard';
import { AppProgressBar } from '../../components/common/AppProgressBar';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';

import { useAuthStore } from '../../stores/auth-store';
import { useProgramStore } from '../../stores/program-store';
import { useWorkoutStore } from '../../stores/workout-store';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAppTheme } from '../../theme';
import { getPlanCycleInfo } from '../../lib/ai-plan-schedule';
import { isNsunsProgram, getTmKey } from '../../lib/nsuns';
import { WorkoutStackParamList } from '../../types/navigation';
import { ActiveUserProgram, ProgramExerciseRow } from '../../types/program';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutList'>;
};

function getNsunsWeightLabel(ex: ProgramExerciseRow, tms: Record<string, number>): { text: string; isTmMissing: boolean } {
  const tmKey = getTmKey(ex.exercises?.name_ko ?? '', ex.exercises?.name_en ?? null);
  if (!tmKey) return { text: `${ex.target_sets}세트 × ${ex.target_reps}회`, isTmMissing: false };
  if (!tms[tmKey]) return { text: 'TM 설정 필요', isTmMissing: true };
  return { text: `${ex.target_sets}세트 (TM: ${tms[tmKey]}kg)`, isTmMissing: false };
}

function WeeklyStrip({ daysPerWeek, currentDay, selectedDay, onDayPress }: { daysPerWeek: number; currentDay: number; selectedDay: number; onDayPress: (day: number) => void }) {
  const { colors, typography } = useAppTheme();
  const days = Array.from({ length: daysPerWeek }, (_, i) => i + 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={wStyles.stripContainer}>
      {days.map((day) => {
        const isDone = day < currentDay;
        const isCurrent = day === currentDay;
        const isSelected = day === selectedDay;

        return (
          <TouchableOpacity
            key={day}
            style={[
              wStyles.dayCard,
              {
                backgroundColor: isCurrent ? colors.accent : isSelected ? colors.accentMuted : isDone ? colors.successMuted : colors.card,
                borderColor: isSelected && !isCurrent ? colors.accent : colors.border,
                borderWidth: isSelected && !isCurrent ? 1.5 : 1,
              },
            ]}
            onPress={() => onDayPress(day)}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '700', color: isCurrent ? '#fff' : isDone ? colors.success : colors.textSecondary }}>
              D{day}
            </Text>
            <MaterialCommunityIcons name={isCurrent ? 'play' : isDone ? 'check-circle' : 'circle-outline'} size={14} color={isCurrent ? '#fff' : isDone ? colors.success : colors.textTertiary} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const wStyles = StyleSheet.create({
  stripContainer: { paddingVertical: 12, gap: 10 },
  dayCard: { width: 50, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2 },
});

export default function WorkoutScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();
  const {
    activeUserPrograms,
    selectedActiveProgramId,
    fetchActiveProgram,
    fetchProgramDayExercises,
    fetchUserTMs,
    setSelectedActiveProgramId,
  } = useProgramStore();
  const workoutStore = useWorkoutStore();

  const [startingProgramId, setStartingProgramId] = useState<string | null>(null);
  const [previewExercisesByProgram, setPreviewExercisesByProgram] = useState<Record<string, ProgramExerciseRow[]>>({});
  const [previewDayByProgram, setPreviewDayByProgram] = useState<Record<string, number>>({});
  const [previewLoadingByProgram, setPreviewLoadingByProgram] = useState<Record<string, boolean>>({});
  const [userTMsByProgram, setUserTMsByProgram] = useState<Record<string, Record<string, number>>>({});

  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const syncRecurringPlanForToday = useAIPlanStore((s) => s.syncRecurringPlanForToday);
  const appliedPlan = currentPlan?.isApplied && (currentPlan.appliedSections ?? ['workout', 'diet', 'goals']).includes('workout')
    ? currentPlan
    : null;
  const todayAIPlan = (() => {
    if (!appliedPlan) return undefined;
    const cycleInfo = getPlanCycleInfo(appliedPlan);
    return cycleInfo.dayLabel
      ? appliedPlan.weeklyWorkout.find((d) => d.dayLabel === cycleInfo.dayLabel)
      : undefined;
  })();

  const selectedProgram = useMemo(() => {
    if (activeUserPrograms.length === 0) return null;
    return (
      activeUserPrograms.find((program) => program.id === selectedActiveProgramId) ??
      activeUserPrograms[0]
    );
  }, [activeUserPrograms, selectedActiveProgramId]);
  const selectedProgramIndex = selectedProgram
    ? activeUserPrograms.findIndex((program) => program.id === selectedProgram.id)
    : -1;

  const selectProgram = useCallback((userProgramId: string) => {
    setSelectedActiveProgramId(userProgramId);
  }, [setSelectedActiveProgramId]);

  const loadPreview = useCallback(async (programId: string, userProgramId: string, dayNum: number, programName: string) => {
    setPreviewLoadingByProgram((prev) => ({ ...prev, [userProgramId]: true }));
    setPreviewDayByProgram((prev) => ({ ...prev, [userProgramId]: dayNum }));
    try {
      const exercises = await fetchProgramDayExercises(programId, dayNum);
      setPreviewExercisesByProgram((prev) => ({ ...prev, [userProgramId]: exercises }));
      if (isNsunsProgram(null, programName)) {
        const userTMs = await fetchUserTMs(userProgramId);
        setUserTMsByProgram((prev) => ({ ...prev, [userProgramId]: userTMs }));
      } else {
        setUserTMsByProgram((prev) => ({ ...prev, [userProgramId]: {} }));
      }
    } finally {
      setPreviewLoadingByProgram((prev) => ({ ...prev, [userProgramId]: false }));
    }
  }, [fetchProgramDayExercises, fetchUserTMs]);

  useFocusEffect(useCallback(() => {
    const init = async () => {
      if (!user) {
        await fetchActiveProgram();
        setPreviewExercisesByProgram({});
        setPreviewDayByProgram({});
        setPreviewLoadingByProgram({});
        setUserTMsByProgram({});
        return;
      }
      await syncRecurringPlanForToday(user.id).catch(() => {});
      await fetchActiveProgram();
      const activePrograms = useProgramStore.getState().activeUserPrograms;
      if (activePrograms.length > 0) {
        const selectedProgramId = useProgramStore.getState().selectedActiveProgramId;
        const initialProgram =
          activePrograms.find((program) => program.id === selectedProgramId) ?? activePrograms[0];
        await loadPreview(
          initialProgram.program_id,
          initialProgram.id,
          initialProgram.current_day,
          initialProgram.program.name,
        );
      } else {
        setPreviewExercisesByProgram({});
        setPreviewDayByProgram({});
        setPreviewLoadingByProgram({});
        setUserTMsByProgram({});
      }
    };
    init();
  }, [user, fetchActiveProgram, loadPreview, syncRecurringPlanForToday]));

  useEffect(() => {
    if (!selectedProgram) return;
    if (previewExercisesByProgram[selectedProgram.id] || previewLoadingByProgram[selectedProgram.id]) {
      return;
    }
    loadPreview(
      selectedProgram.program_id,
      selectedProgram.id,
      previewDayByProgram[selectedProgram.id] ?? selectedProgram.current_day,
      selectedProgram.program.name,
    );
  }, [
    loadPreview,
    previewDayByProgram,
    previewExercisesByProgram,
    previewLoadingByProgram,
    selectedProgram,
  ]);

  const goToAdjacentProgram = useCallback((direction: 'prev' | 'next') => {
    if (activeUserPrograms.length <= 1 || selectedProgramIndex < 0) return;
    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (selectedProgramIndex + delta + activeUserPrograms.length) % activeUserPrograms.length;
    const nextProgram = activeUserPrograms[nextIndex];
    if (nextProgram) {
      selectProgram(nextProgram.id);
    }
  }, [activeUserPrograms, selectProgram, selectedProgramIndex]);

  const handleStartProgramWorkout = async (programEntry: ActiveUserProgram) => {
    if (!user) return;
    setStartingProgramId(programEntry.id);
    try {
      const program = programEntry.program;
      if (isNsunsProgram(program.creator_name, program.name)) {
        const tms = await fetchUserTMs(programEntry.id);
        if (Object.keys(tms).length === 0) {
          navigation.navigate('TrainingMaxSetup', {
            userProgramId: programEntry.id,
            programName: program.name,
            autoStartWorkout: true,
            programId: programEntry.program_id,
            currentDay: programEntry.current_day,
            daysPerWeek: program.days_per_week,
          });
          return;
        }
      }
      const exercises = await fetchProgramDayExercises(programEntry.program_id, programEntry.current_day);
      const isNsuns = isNsunsProgram(program.creator_name, program.name);
      await workoutStore.startFromProgram(
        exercises,
        programEntry.id,
        program.days_per_week,
        programEntry.current_day,
        isNsuns ? await fetchUserTMs(programEntry.id) : undefined,
      );
      navigation.navigate('WorkoutSession');
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setStartingProgramId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="운동" rightAction={{ icon: <MaterialCommunityIcons name="history" size={24} color={colors.accent} />, onPress: () => navigation.navigate('WorkoutHistory') }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppButton variant="primary" label="빈 운동 시작" icon={<MaterialCommunityIcons name="plus" size={22} color="#fff" />} onPress={() => { workoutStore.startSession(); navigation.navigate('WorkoutSession'); }} style={styles.quickStartBtn} />

        {selectedProgram && (
          <>
            <View style={styles.programSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily, marginBottom: 0 }]}>
                진행 중인 프로그램
              </Text>
              {activeUserPrograms.length > 1 && (
                <View style={styles.programSwitchControls}>
                  <TouchableOpacity
                    style={[styles.programSwitchBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => goToAdjacentProgram('prev')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.programCount, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
                    {selectedProgramIndex + 1} / {activeUserPrograms.length}
                  </Text>
                  <TouchableOpacity
                    style={[styles.programSwitchBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => goToAdjacentProgram('next')}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {(() => {
              const programEntry = selectedProgram;
              const isNsuns = isNsunsProgram(
                programEntry.program.creator_name,
                programEntry.program.name,
              );
              const previewExercises = previewExercisesByProgram[programEntry.id] ?? [];
              const previewDay = previewDayByProgram[programEntry.id] ?? programEntry.current_day;
              const previewLoading = previewLoadingByProgram[programEntry.id] ?? false;
              const userTMs = userTMsByProgram[programEntry.id] ?? {};

              return (
                <AppCard
                  variant="elevated"
                  style={[
                    styles.programCard,
                    { borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <View style={styles.programHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.programName, { color: colors.text, fontFamily: typography.fontFamily }]} numberOfLines={1}>
                        {programEntry.program.name}
                      </Text>
                      <Text style={[styles.programSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                        Day {programEntry.current_day} / {programEntry.program.days_per_week} · {programEntry.completed_sessions}회 완료
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProgramDetail', { programId: programEntry.program_id })}
                    >
                      <MaterialCommunityIcons name="information-outline" size={22} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <AppProgressBar
                    progress={programEntry.current_day / programEntry.program.days_per_week}
                    color={colors.accent}
                    height={4}
                    style={{ marginVertical: 12 }}
                  />

                  <WeeklyStrip
                    daysPerWeek={programEntry.program.days_per_week}
                    currentDay={programEntry.current_day}
                    selectedDay={previewDay}
                    onDayPress={(day) => {
                      loadPreview(
                        programEntry.program_id,
                        programEntry.id,
                        day,
                        programEntry.program.name,
                      );
                    }}
                  />

                  <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {previewLoading ? (
                      <ActivityIndicator size="small" color={colors.accent} style={{ padding: 20 }} />
                    ) : previewExercises.length > 0 ? (
                      previewExercises.map((ex, idx) => (
                        <View
                          key={ex.id}
                          style={[styles.exRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                        >
                          <Text style={[styles.exName, { color: colors.text }]} numberOfLines={1}>
                            {ex.exercises?.name_ko}
                          </Text>
                          <Text style={[styles.exDetail, { color: colors.textSecondary }]}>
                            {isNsuns
                              ? getNsunsWeightLabel(ex, userTMs).text
                              : `${ex.target_sets}세트 × ${ex.target_reps}회`}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.emptyPreviewText, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
                        미리볼 운동이 없습니다
                      </Text>
                    )}
                  </View>

                  <AppButton
                    variant="primary"
                    label={`Day ${programEntry.current_day} 시작`}
                    icon={<MaterialCommunityIcons name="play" size={18} color="#fff" />}
                    onPress={() => handleStartProgramWorkout(programEntry)}
                    loading={startingProgramId === programEntry.id}
                    style={{ marginTop: 16 }}
                  />
                </AppCard>
              );
            })()}

            {activeUserPrograms.length > 1 && (
              <View style={styles.programPager}>
                {activeUserPrograms.map((programEntry, index) => {
                  const active = selectedProgram?.id === programEntry.id;
                  return (
                    <TouchableOpacity
                      key={programEntry.id}
                      style={[
                        styles.programPagerDot,
                        {
                          backgroundColor: active ? colors.accent : colors.border,
                          width: 10,
                          height: 10,
                          opacity: active ? 1 : 0.9,
                        },
                      ]}
                      onPress={() => selectProgram(programEntry.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${index + 1}번째 진행 중 프로그램 보기`}
                      activeOpacity={0.8}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}

        {appliedPlan && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily, marginTop: 4 }]}>오늘의 AI 플랜</Text>
            <AppCard variant="elevated" style={styles.programCard}>
              <View style={[styles.appliedMetaRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.appliedMetaTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
                  현재 적용 중인 AI 운동 계획
                </Text>
                <Text style={[styles.appliedMetaSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {(() => {
                    const cycleInfo = getPlanCycleInfo(appliedPlan);
                    if (!cycleInfo.started) return '시작 전';
                    return `${cycleInfo.cycle + 1}주차 · Day ${(cycleInfo.dayIndex ?? 0) + 1}`;
                  })()}
                </Text>
              </View>
              {todayAIPlan?.isRestDay ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🛌</Text>
                  <Text style={[styles.programName, { color: colors.text, fontFamily: typography.fontFamily }]}>오늘은 휴식일입니다</Text>
                  <Text style={[styles.programSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>충분한 휴식으로 회복하세요</Text>
                </View>
              ) : todayAIPlan ? (
                <>
                  <View style={styles.programHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.programName, { color: colors.text, fontFamily: typography.fontFamily }]}>
                        {todayAIPlan.focus ?? 'AI 추천 운동'}
                      </Text>
                      <Text style={[styles.programSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                        {todayAIPlan.exercises.length}개 종목
                      </Text>
                    </View>
                    <View style={{ backgroundColor: colors.accentMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>AI 플랜</Text>
                    </View>
                  </View>
                  <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 12 }]}>
                    {todayAIPlan.exercises.map((ex, idx) => (
                      <View key={idx} style={[styles.exRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                        <Text style={[styles.exName, { color: colors.text }]} numberOfLines={1}>{ex.name}</Text>
                        <Text style={[styles.exDetail, { color: colors.textSecondary }]}>
                          {ex.sets}세트 × {ex.repsRange}
                          {ex.weight_kg != null ? ` · ${ex.weight_kg}kg` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <AppButton
                    variant="primary"
                    label="AI 플랜 운동 시작"
                    icon={<MaterialCommunityIcons name="play" size={18} color="#fff" />}
                    onPress={async () => {
                      await workoutStore.startFromAIPlan(todayAIPlan.exercises);
                      navigation.navigate('WorkoutSession');
                    }}
                    style={{ marginTop: 16 }}
                  />
                </>
              ) : (
                <Text style={[styles.programSub, { color: colors.textSecondary, fontFamily: typography.fontFamily, textAlign: 'center', paddingVertical: 12 }]}>
                  오늘 요일의 AI 플랜을 찾을 수 없습니다
                </Text>
              )}
            </AppCard>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily, marginTop: 12 }]}>라이브러리</Text>
        <TouchableOpacity style={[styles.browseBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('ProgramList')} activeOpacity={0.7}>
          <View style={[styles.browseIcon, { backgroundColor: colors.accentMuted }]}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.browseTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>프로그램 탐색 · 만들기</Text>
            <Text style={[styles.browseSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>공개된 프로그램을 사용하거나 직접 만들어보세요</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  quickStartBtn: { paddingVertical: 18, marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  programSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  programSwitchControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programSwitchBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programCount: { fontSize: 12, fontWeight: '600' },
  programPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: -6, marginBottom: 16 },
  programPagerDot: { borderRadius: 999 },
  programCard: { padding: 16, marginBottom: 20 },
  appliedMetaRow: { paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  appliedMetaTitle: { fontSize: 15, fontWeight: '700' },
  appliedMetaSub: { fontSize: 12, marginTop: 3 },
  programHeader: { flexDirection: 'row', alignItems: 'center' },
  programName: { fontSize: 18, fontWeight: '700' },
  programSub: { fontSize: 13, marginTop: 2 },
  previewBox: { borderRadius: 12, borderWidth: 1, marginTop: 8, paddingHorizontal: 12 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  exName: { fontSize: 14, fontWeight: '600', flex: 1 },
  exDetail: { fontSize: 13 },
  emptyPreviewText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  browseIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  browseTitle: { fontSize: 16, fontWeight: '700' },
  browseSub: { fontSize: 13, marginTop: 2 },
});
