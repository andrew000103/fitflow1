import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth-store';
import { useProgramStore } from '../../stores/program-store';
import { useWorkoutStore } from '../../stores/workout-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { roundToPlate, TM_KEY_LABELS, TmKey } from '../../lib/nsuns';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'TrainingMaxSetup'>;
  route: RouteProp<WorkoutStackParamList, 'TrainingMaxSetup'>;
};

const TM_KEYS: TmKey[] = ['bench', 'squat', 'deadlift', 'ohp'];

function sanitizeDecimalInput(value: string, maxIntegerDigits = 4, maxDecimalDigits = 1) {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!normalized) return '';

  const startsWithDot = normalized.startsWith('.');
  const [integerRaw, ...decimalParts] = normalized.split('.');
  const integerPart = (startsWithDot ? '0' : integerRaw).slice(0, maxIntegerDigits);
  const hasDecimal = normalized.includes('.');
  const decimalPart = decimalParts.join('').slice(0, maxDecimalDigits);

  return hasDecimal ? `${integerPart}.${decimalPart}` : integerPart;
}

/** Epley formula: 1RM ≈ weight × (1 + reps / 30) */
function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export default function TrainingMaxScreen({ navigation, route }: Props) {
  const { userProgramId, programName, autoStartWorkout, programId, currentDay, daysPerWeek } = route.params;
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();
  const { saveUserTMs, fetchProgramDayExercises } = useProgramStore();
  const workoutStore = useWorkoutStore();

  const [oneRMs, setOneRMs] = useState<Record<TmKey, string>>({
    bench: '',
    squat: '',
    deadlift: '',
    ohp: '',
  });

  // Calculator mode state: which lift has the calculator open
  const [calcOpen, setCalcOpen] = useState<Record<TmKey, boolean>>({
    bench: false,
    squat: false,
    deadlift: false,
    ohp: false,
  });
  const [calcWeight, setCalcWeight] = useState<Record<TmKey, string>>({
    bench: '',
    squat: '',
    deadlift: '',
    ohp: '',
  });
  const [calcReps, setCalcReps] = useState<Record<TmKey, string>>({
    bench: '',
    squat: '',
    deadlift: '',
    ohp: '',
  });

  const [saving, setSaving] = useState(false);

  const calcTm = (key: TmKey): number | null => {
    const v = parseFloat(oneRMs[key]);
    if (!v || v <= 0) return null;
    return roundToPlate(v * 0.9);
  };

  const estimated1RM = (key: TmKey): number | null => {
    const w = parseFloat(calcWeight[key]);
    const r = parseInt(calcReps[key], 10);
    if (!w || w <= 0 || !r || r <= 0) return null;
    return Math.round(epley1RM(w, r));
  };

  const applyEstimate = (key: TmKey) => {
    const est = estimated1RM(key);
    if (!est) return;
    setOneRMs((prev) => ({ ...prev, [key]: String(est) }));
    setCalcOpen((prev) => ({ ...prev, [key]: false }));
  };

  const toggleCalc = (key: TmKey) => {
    setCalcOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    const tms: Partial<Record<TmKey, number>> = {};
    for (const key of TM_KEYS) {
      const tm = calcTm(key);
      if (tm) tms[key] = tm;
    }

    if (Object.keys(tms).length === 0) {
      Alert.alert('입력 필요', '최소 1개 이상의 1RM을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await saveUserTMs(userProgramId, user.id, tms as Record<string, number>);

      if (autoStartWorkout && programId && currentDay !== undefined && daysPerWeek !== undefined) {
        const exercises = await fetchProgramDayExercises(programId, currentDay);
        await workoutStore.startFromProgram(
          exercises,
          userProgramId,
          daysPerWeek,
          currentDay,
          tms as Record<string, number>,
        );
        navigation.replace('WorkoutSession');
      } else {
        Alert.alert('저장 완료', 'Training Max가 저장되었습니다.\n이제 운동을 시작하세요!', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('저장 실패', e.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const ff = typography.fontFamily;
  const sz = typography.size;
  const fw = typography.weight;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: ff, fontSize: sz.lg, fontWeight: fw.bold, color: colors.text, flex: 1, marginLeft: 12 }}>
          Training Max 설정
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.textTertiary : colors.accent }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontFamily: ff, fontSize: sz.sm, fontWeight: fw.semibold, color: '#fff' }}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.programBadge, { backgroundColor: colors.accent + '18' }]}>
            <MaterialCommunityIcons name="dumbbell" size={14} color={colors.accent} />
            <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.accent, marginLeft: 6 }}>{programName}</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
            <Text style={{ fontFamily: ff, fontSize: sz.sm, color: colors.textSecondary, lineHeight: 20 }}>
              각 리프트의 <Text style={{ fontWeight: '600', color: colors.text }}>1RM</Text>을 입력하면 Training Max(TM)가 자동 계산됩니다.{'\n\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>TM = 1RM × 90%</Text>{'\n'}
              1RM을 모르면 <Text style={{ fontWeight: '600', color: colors.text }}>계산기</Text> 버튼으로 추정할 수 있습니다.
            </Text>
          </View>

          {TM_KEYS.map((key) => {
            const tm = calcTm(key);
            const est = estimated1RM(key);
            const isOpen = calcOpen[key];

            return (
              <View key={key} style={[styles.liftCard, { backgroundColor: colors.card }]}>
                {/* Header row */}
                <View style={styles.liftHeader}>
                  <Text style={{ fontFamily: ff, fontSize: sz.md, fontWeight: fw.semibold, color: colors.text }}>
                    {TM_KEY_LABELS[key]}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {tm !== null && (
                      <View style={[styles.tmBadge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={{ fontFamily: ff, fontSize: sz.xs, fontWeight: fw.semibold, color: colors.accent }}>
                          TM: {tm}kg
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.calcToggle, { backgroundColor: isOpen ? colors.accent + '20' : colors.border + '60' }]}
                      onPress={() => toggleCalc(key)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="calculator-variant-outline"
                        size={14}
                        color={isOpen ? colors.accent : colors.textSecondary}
                      />
                      <Text style={{ fontFamily: ff, fontSize: sz.xs, color: isOpen ? colors.accent : colors.textSecondary, marginLeft: 4 }}>
                        계산기
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 1RM direct input */}
                <View style={[styles.inputRow, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: ff, fontSize: sz.xl, fontWeight: fw.bold }]}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    inputMode="decimal"
                    value={oneRMs[key]}
                    onChangeText={(t) => setOneRMs((prev) => ({ ...prev, [key]: sanitizeDecimalInput(t) }))}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="next"
                    maxLength={6}
                  />
                  <Text style={{ fontFamily: ff, fontSize: sz.md, color: colors.textSecondary }}>kg (1RM)</Text>
                </View>

                {/* 1RM Calculator (collapsible) */}
                {isOpen && (
                  <View style={[styles.calcBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary, marginBottom: 10 }}>
                      실제 수행한 무게와 횟수를 입력하면 1RM을 추정합니다 (Epley 공식)
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {/* Weight input */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary, marginBottom: 4 }}>무게 (kg)</Text>
                        <View style={[styles.calcInputRow, { borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.calcInput, { color: colors.text, fontFamily: ff, fontSize: sz.lg, fontWeight: fw.semibold }]}
                            keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                            inputMode="decimal"
                            value={calcWeight[key]}
                            onChangeText={(t) => setCalcWeight((prev) => ({ ...prev, [key]: sanitizeDecimalInput(t) }))}
                            placeholder="0"
                            placeholderTextColor={colors.textTertiary}
                            maxLength={6}
                          />
                          <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary }}>kg</Text>
                        </View>
                      </View>

                      {/* Reps input */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary, marginBottom: 4 }}>횟수 (회)</Text>
                        <View style={[styles.calcInputRow, { borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.calcInput, { color: colors.text, fontFamily: ff, fontSize: sz.lg, fontWeight: fw.semibold }]}
                            keyboardType="number-pad"
                            value={calcReps[key]}
                            onChangeText={(t) => setCalcReps((prev) => ({ ...prev, [key]: t }))}
                            placeholder="0"
                            placeholderTextColor={colors.textTertiary}
                          />
                          <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary }}>회</Text>
                        </View>
                      </View>
                    </View>

                    {/* Result + Apply */}
                    {est !== null && (
                      <View style={[styles.calcResult, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '30' }]}>
                        <View>
                          <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary }}>추정 1RM</Text>
                          <Text style={{ fontFamily: ff, fontSize: sz.xl, fontWeight: fw.bold, color: colors.accent }}>
                            {est}kg
                          </Text>
                          <Text style={{ fontFamily: ff, fontSize: sz.xs, color: colors.textSecondary }}>
                            TM → {roundToPlate(est * 0.9)}kg
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.applyBtn, { backgroundColor: colors.accent }]}
                          onPress={() => applyEstimate(key)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontFamily: ff, fontSize: sz.sm, fontWeight: fw.semibold, color: '#fff' }}>적용</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  scroll: { padding: 16, gap: 12 },
  programBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  infoBox: { borderRadius: 14, padding: 14 },
  liftCard: { borderRadius: 14, padding: 14 },
  liftHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  tmBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  calcToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  input: { flex: 1 },
  calcBox: { marginTop: 12, borderWidth: 1, borderRadius: 10, padding: 12, gap: 0 },
  calcInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  calcInput: { flex: 1 },
  calcResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderWidth: 1, borderRadius: 10, padding: 12 },
  applyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
