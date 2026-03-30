import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
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
import { isNsunsProgram, getTmKey } from '../../lib/nsuns';
import { WorkoutStackParamList } from '../../types/navigation';
import { ProgramExerciseRow } from '../../types/program';

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
  const { colors, typography, spacing, radius } = useAppTheme();
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
  const { colors, typography, spacing, radius } = useAppTheme();
  const { user } = useAuthStore();
  const { activeUserProgram, fetchActiveProgram, fetchProgramDayExercises, fetchUserTMs } = useProgramStore();
  const workoutStore = useWorkoutStore();

  const [startingProgram, setStartingProgram] = useState(false);
  const [previewExercises, setPreviewExercises] = useState<ProgramExerciseRow[]>([]);
  const [previewDay, setPreviewDay] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userTMs, setUserTMs] = useState<Record<string, number>>({});

  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const todayAIPlan = (() => {
    if (!currentPlan) return undefined;
    const startMs = new Date(currentPlan.weekStart + 'T00:00:00').getTime();
    const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
    const diffDays = Math.round((todayMs - startMs) / 86400000);
    const label = (diffDays >= 0 && diffDays <= 6) ? `day${diffDays + 1}` : null;
    return label ? currentPlan.weeklyWorkout.find((d) => d.dayLabel === label) : undefined;
  })();

  const isNsuns = activeUserProgram ? isNsunsProgram(activeUserProgram.program.creator_name, activeUserProgram.program.name) : false;

  const loadPreview = useCallback(async (programId: string, userProgramId: string, dayNum: number, programName: string) => {
    setPreviewLoading(true);
    setPreviewDay(dayNum);
    try {
      const exercises = await fetchProgramDayExercises(programId, dayNum);
      setPreviewExercises(exercises);
      if (isNsunsProgram(null, programName)) {
        setUserTMs(await fetchUserTMs(userProgramId));
      } else {
        setUserTMs({});
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [fetchProgramDayExercises, fetchUserTMs]);

  useFocusEffect(useCallback(() => {
    const init = async () => {
      if (!user) return;
      await fetchActiveProgram();
      const active = useProgramStore.getState().activeUserProgram;
      if (active) await loadPreview(active.program_id, active.id, active.current_day, active.program.name);
    };
    init();
  }, [user, fetchActiveProgram, loadPreview]));

  const handleStartProgramWorkout = async () => {
    if (!activeUserProgram || !user) return;
    setStartingProgram(true);
    try {
      const program = activeUserProgram.program;
      if (isNsunsProgram(program.creator_name, program.name)) {
        const tms = await fetchUserTMs(activeUserProgram.id);
        if (Object.keys(tms).length === 0) {
          navigation.navigate('TrainingMaxSetup', { userProgramId: activeUserProgram.id, programName: program.name, autoStartWorkout: true, programId: activeUserProgram.program_id, currentDay: activeUserProgram.current_day, daysPerWeek: program.days_per_week });
          return;
        }
      }
      const exercises = await fetchProgramDayExercises(activeUserProgram.program_id, activeUserProgram.current_day);
      await workoutStore.startFromProgram(exercises, activeUserProgram.id, activeUserProgram.program.days_per_week, activeUserProgram.current_day, isNsuns ? await fetchUserTMs(activeUserProgram.id) : undefined);
      navigation.navigate('WorkoutSession');
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setStartingProgram(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader title="운동" rightAction={{ icon: <MaterialCommunityIcons name="history" size={24} color={colors.accent} />, onPress: () => navigation.navigate('WorkoutHistory') }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppButton variant="primary" label="빈 운동 시작" icon={<MaterialCommunityIcons name="plus" size={22} color="#fff" />} onPress={() => { workoutStore.startSession(); navigation.navigate('WorkoutSession'); }} style={styles.quickStartBtn} />

        {activeUserProgram && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>진행 중인 프로그램</Text>
            <AppCard variant="elevated" style={styles.programCard}>
              <View style={styles.programHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.programName, { color: colors.text, fontFamily: typography.fontFamily }]} numberOfLines={1}>{activeUserProgram.program.name}</Text>
                  <Text style={[styles.programSub, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>Day {activeUserProgram.current_day} / {activeUserProgram.program.days_per_week} · {activeUserProgram.completed_sessions}회 완료</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ProgramDetail', { programId: activeUserProgram.program_id })}>
                  <MaterialCommunityIcons name="information-outline" size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <AppProgressBar progress={activeUserProgram.current_day / activeUserProgram.program.days_per_week} color={colors.accent} height={4} style={{ marginVertical: 12 }} />

              <WeeklyStrip daysPerWeek={activeUserProgram.program.days_per_week} currentDay={activeUserProgram.current_day} selectedDay={previewDay} onDayPress={d => loadPreview(activeUserProgram.program_id, activeUserProgram.id, d, activeUserProgram.program.name)} />

              <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {previewLoading ? <ActivityIndicator size="small" color={colors.accent} style={{ padding: 20 }} /> : (
                  previewExercises.map((ex, idx) => (
                    <View key={ex.id} style={[styles.exRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                      <Text style={[styles.exName, { color: colors.text }]} numberOfLines={1}>{ex.exercises?.name_ko}</Text>
                      <Text style={[styles.exDetail, { color: colors.textSecondary }]}>{isNsuns ? getNsunsWeightLabel(ex, userTMs).text : `${ex.target_sets}세트 × ${ex.target_reps}회`}</Text>
                    </View>
                  ))
                )}
              </View>

              <AppButton variant="primary" label={`Day ${activeUserProgram.current_day} 시작`} icon={<MaterialCommunityIcons name="play" size={18} color="#fff" />} onPress={handleStartProgramWorkout} loading={startingProgram} style={{ marginTop: 16 }} />
            </AppCard>
          </>
        )}

        {currentPlan && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily, marginTop: 4 }]}>오늘의 AI 플랜</Text>
            <AppCard variant="elevated" style={styles.programCard}>
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
  programCard: { padding: 16, marginBottom: 20 },
  programHeader: { flexDirection: 'row', alignItems: 'center' },
  programName: { fontSize: 18, fontWeight: '700' },
  programSub: { fontSize: 13, marginTop: 2 },
  previewBox: { borderRadius: 12, borderWidth: 1, marginTop: 8, paddingHorizontal: 12 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  exName: { fontSize: 14, fontWeight: '600', flex: 1 },
  exDetail: { fontSize: 13 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  browseIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  browseTitle: { fontSize: 16, fontWeight: '700' },
  browseSub: { fontSize: 13, marginTop: 2 },
});
