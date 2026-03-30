import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUILT_IN_EXERCISES } from '../../constants/exercises';
import { dedupeExercisesByName, normalizeExerciseName } from '../../lib/exercise-utils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useProgramStore } from '../../stores/program-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { DraftDay, DraftExercise } from '../../types/program';
import { Exercise } from '../../types/workout';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ProgramCreate'>;
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

interface ExercisePickerProps {
  visible: boolean;
  onSelect: (ex: Exercise | Omit<Exercise, 'id'>) => void;
  onDismiss: () => void;
}

function ExercisePicker({ visible, onSelect, onDismiss }: ExercisePickerProps) {
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!visible || !user?.id) return;
    supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name_ko')
      .then(({ data }) => setDbExercises((data ?? []) as Exercise[]));
  }, [visible, user?.id]);

  if (!visible) return null;

  const dedupedDbExercises = dedupeExercisesByName(dbExercises);
  const dbNames = new Set(dedupedDbExercises.map((e) => normalizeExerciseName(e.name_ko)));
  const filteredBuiltIn = dedupeExercisesByName(BUILT_IN_EXERCISES).filter(
    (e) =>
      !dbNames.has(normalizeExerciseName(e.name_ko)) &&
      (e.name_ko.includes(query) || e.name_en?.toLowerCase().includes(query.toLowerCase())),
  );
  const filteredDb = dedupedDbExercises.filter(
    (e) => e.name_ko.includes(query) || e.name_en?.toLowerCase().includes(query.toLowerCase()),
  );

  type Item = Exercise | Omit<Exercise, 'id'>;
  const items: Item[] = [...filteredDb, ...filteredBuiltIn];

  return (
    <View style={pickerStyles.overlay}>
      <TouchableOpacity style={pickerStyles.backdrop} onPress={onDismiss} activeOpacity={1} />
      <View style={[pickerStyles.sheet, { backgroundColor: colors.card }]}>
        <View style={[pickerStyles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
          <TextInput
            style={[pickerStyles.searchInput, { color: colors.text, fontFamily: typography.fontFamily }]}
            placeholder="종목 검색..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        <FlatList
          data={items}
          keyExtractor={(item, i) => ('id' in item ? item.id : item.name_ko + i)}
          style={{ maxHeight: 360 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[pickerStyles.item, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(item); setQuery(''); }}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.text }}>
                {item.name_ko}
              </Text>
              {item.category ? (
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 1 }}>
                  {item.category}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ fontFamily: typography.fontFamily, color: colors.textTertiary, textAlign: 'center', padding: 20 }}>
              종목 없음
            </Text>
          }
        />
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 15 },
  item: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { colors, typography } = useAppTheme();
  return (
    <View style={stepStyles.row}>
      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, width: 80 }}>
        {label}
      </Text>
      <TouchableOpacity
        style={[stepStyles.btn, { borderColor: colors.border }]}
        onPress={() => onChange(Math.max(min, value - 1))}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text, width: 36, textAlign: 'center' }}>
        {value}
      </Text>
      <TouchableOpacity
        style={[stepStyles.btn, { borderColor: colors.border }]}
        onPress={() => onChange(Math.min(max, value + 1))}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  btn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── ProgramCreateScreen ──────────────────────────────────────────────────────

export default function ProgramCreateScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { createProgram } = useProgramStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [days, setDays] = useState<DraftDay[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({
      day_number: i + 1,
      name: `Day ${i + 1}`,
      exercises: [],
    })),
  );
  const [saving, setSaving] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null);

  // Sync days array when daysPerWeek changes
  useEffect(() => {
    setDays((prev) =>
      Array.from({ length: daysPerWeek }, (_, i) => ({
        day_number: i + 1,
        name: prev[i]?.name ?? `Day ${i + 1}`,
        exercises: prev[i]?.exercises ?? [],
      })),
    );
  }, [daysPerWeek]);

  const handleAddExercise = useCallback(
    (dayIdx: number, item: Exercise | Omit<Exercise, 'id'>) => {
      const dbId = 'id' in item && !item.id.startsWith('local::') ? item.id : null;
      const draft: DraftExercise = {
        tempId: genId(),
        name_ko: item.name_ko,
        name_en: item.name_en ?? null,
        category: item.category ?? null,
        default_rest_seconds: item.default_rest_seconds,
        is_custom: item.is_custom,
        exercise_db_id: dbId,
        target_sets: 3,
        target_reps: 10,
        target_weight_kg: 0,
      };
      setDays((prev) => {
        const next = [...prev];
        next[dayIdx] = { ...next[dayIdx], exercises: [...next[dayIdx].exercises, draft] };
        return next;
      });
      setPickerDayIdx(null);
    },
    [],
  );

  const handleRemoveExercise = (dayIdx: number, tempId: string) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIdx] = { ...next[dayIdx], exercises: next[dayIdx].exercises.filter((e) => e.tempId !== tempId) };
      return next;
    });
  };

  const moveExercise = useCallback((dayIdx: number, exIdx: number, dir: 'up' | 'down') => {
    setDays((prev) => {
      const updated = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const exs = updated[dayIdx].exercises;
      const targetIdx = dir === 'up' ? exIdx - 1 : exIdx + 1;
      if (targetIdx < 0 || targetIdx >= exs.length) return prev;
      [exs[exIdx], exs[targetIdx]] = [exs[targetIdx], exs[exIdx]];
      return updated;
    });
  }, []);

  const handleUpdateExerciseField = (
    dayIdx: number,
    tempId: string,
    field: 'target_sets' | 'target_reps' | 'target_weight_kg',
    value: number,
  ) => {
    setDays((prev) => {
      const next = [...prev];
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: next[dayIdx].exercises.map((e) =>
          e.tempId === tempId ? { ...e, [field]: value } : e,
        ),
      };
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('이름 필요', '프로그램 이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      await createProgram({ name, description, is_public: isPublic, duration_weeks: durationWeeks, days_per_week: daysPerWeek, days });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('저장 실패', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: colors.text,
            flex: 1,
            marginLeft: 12,
          }}
        >
          프로그램 만들기
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: '#fff' }}>
              저장
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Basic Info */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.nameInput, { color: colors.text, fontFamily: typography.fontFamily, borderBottomColor: colors.border }]}
              placeholder="프로그램 이름"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
            <TextInput
              style={[styles.descInput, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}
              placeholder="설명 (선택)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />

            <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.text }}>
                공개 프로그램
              </Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Config */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Stepper label="기간 (주)" value={durationWeeks} min={1} max={52} onChange={setDurationWeeks} />
            <Stepper label="주 훈련일" value={daysPerWeek} min={1} max={7} onChange={setDaysPerWeek} />
          </View>

          {/* Days */}
          {days.map((day, dayIdx) => (
            <View key={day.day_number} style={[styles.dayCard, { backgroundColor: colors.card }]}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: colors.accent }]}>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#fff' }}>
                    D{day.day_number}
                  </Text>
                </View>
                <TextInput
                  style={[styles.dayNameInput, { color: colors.text, fontFamily: typography.fontFamily }]}
                  value={day.name}
                  onChangeText={(t) =>
                    setDays((prev) => {
                      const next = [...prev];
                      next[dayIdx] = { ...next[dayIdx], name: t };
                      return next;
                    })
                  }
                  placeholder={`Day ${day.day_number}`}
                  placeholderTextColor={colors.textTertiary}
                  maxLength={40}
                />
              </View>

              {/* Exercise list */}
              {day.exercises.map((ex, exIdx) => (
                <View key={ex.tempId} style={[styles.exRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text }}>
                      {ex.name_ko}
                    </Text>
                    <View style={styles.exControls}>
                      <View style={styles.exField}>
                        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary }}>세트</Text>
                        <TextInput
                          style={[styles.exInput, { color: colors.text, fontFamily: typography.fontFamily, borderBottomColor: colors.border }]}
                          keyboardType="number-pad"
                          value={ex.target_sets.toString()}
                          onChangeText={(t) => handleUpdateExerciseField(dayIdx, ex.tempId, 'target_sets', parseInt(t, 10) || 1)}
                        />
                      </View>
                      <Text style={{ color: colors.textTertiary, fontSize: 14, marginHorizontal: 4, marginTop: 14 }}>×</Text>
                      <View style={styles.exField}>
                        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary }}>회</Text>
                        <TextInput
                          style={[styles.exInput, { color: colors.text, fontFamily: typography.fontFamily, borderBottomColor: colors.border }]}
                          keyboardType="number-pad"
                          value={ex.target_reps.toString()}
                          onChangeText={(t) => handleUpdateExerciseField(dayIdx, ex.tempId, 'target_reps', parseInt(t, 10) || 1)}
                        />
                      </View>
                      <Text style={{ color: colors.textTertiary, fontSize: 14, marginHorizontal: 4, marginTop: 14 }}>@</Text>
                      <View style={styles.exField}>
                        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary }}>kg</Text>
                        <TextInput
                          style={[styles.exInput, { color: colors.text, fontFamily: typography.fontFamily, borderBottomColor: colors.border }]}
                          keyboardType="decimal-pad"
                          value={ex.target_weight_kg > 0 ? ex.target_weight_kg.toString() : ''}
                          placeholder="0"
                          placeholderTextColor={colors.textTertiary}
                          onChangeText={(t) => handleUpdateExerciseField(dayIdx, ex.tempId, 'target_weight_kg', parseFloat(t) || 0)}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.exActions}>
                    <TouchableOpacity
                      onPress={() => moveExercise(dayIdx, exIdx, 'up')}
                      disabled={exIdx === 0}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      activeOpacity={0.7}
                      style={{ opacity: exIdx === 0 ? 0.25 : 1 }}
                    >
                      <MaterialCommunityIcons name="chevron-up" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveExercise(dayIdx, exIdx, 'down')}
                      disabled={exIdx === day.exercises.length - 1}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      activeOpacity={0.7}
                      style={{ opacity: exIdx === day.exercises.length - 1 ? 0.25 : 1 }}
                    >
                      <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(dayIdx, ex.tempId)}
                      activeOpacity={0.7}
                      style={{ marginTop: 2 }}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addExBtn, { borderColor: colors.border }]}
                onPress={() => setPickerDayIdx(dayIdx)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={16} color={colors.accent} />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.accent, marginLeft: 4 }}>
                  종목 추가
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker */}
      <ExercisePicker
        visible={pickerDayIdx !== null}
        onSelect={(item) => pickerDayIdx !== null && handleAddExercise(pickerDayIdx, item)}
        onDismiss={() => setPickerDayIdx(null)}
      />
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
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 56,
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  section: {
    borderRadius: 14,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  descInput: {
    fontSize: 14,
    minHeight: 44,
  },
  dayCard: {
    borderRadius: 14,
    padding: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNameInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exControls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  exField: {
    alignItems: 'center',
    width: 42,
  },
  exInput: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 1,
    width: 40,
    paddingBottom: 2,
  },
  removeBtn: {
    padding: 6,
    marginTop: 2,
  },
  exActions: {
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
