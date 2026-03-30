import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
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
import { useWorkoutStore } from '../../stores/workout-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { Exercise } from '../../types/workout';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseSearch'>;
};


export default function ExerciseSearchScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { addExercise } = useWorkoutStore();
  const { user } = useAuthStore();
  const userId = user?.id;

  const [query, setQuery] = useState('');
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const normalizedQuery = normalizeExerciseName(query);

  // Load user's exercises from Supabase
  useEffect(() => {
    let active = true;

    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadExercises() {
      try {
        const { data } = await supabase
          .from('exercises')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('name_ko');

        if (active) {
          setDbExercises((data as Exercise[]) ?? []);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadExercises();

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredBuiltIn = BUILT_IN_EXERCISES.filter(
    (e) =>
      e.name_ko.includes(query) ||
      (e.name_en?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  const dedupedDbExercises = dedupeExercisesByName(dbExercises);
  const dbNames = new Set(dedupedDbExercises.map((e) => normalizeExerciseName(e.name_ko)));
  const filteredBuiltInNew = dedupeExercisesByName(
    filteredBuiltIn.filter((e) => !dbNames.has(normalizeExerciseName(e.name_ko))),
  );

  const filteredDb = dedupedDbExercises.filter(
    (e) => e.name_ko.includes(query) || (e.name_en?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );
  const hasExactMatch = [...dedupedDbExercises, ...BUILT_IN_EXERCISES].some(
    (e) => normalizeExerciseName(e.name_ko) === normalizedQuery,
  );

  const handleSelect = useCallback(
    (exercise: Exercise | Omit<Exercise, 'id'>) => {
      if (adding) return;
      setAdding(true);

      const resolved: Exercise =
        'id' in exercise
          ? exercise
          : { ...exercise, id: `local::${exercise.name_ko}` };

      addExercise(resolved);
      navigation.goBack();
      setAdding(false);
    },
    [adding, addExercise, navigation],
  );

  const handleAddCustom = () => {
    if (!query.trim()) return;
    if (hasExactMatch) {
      Alert.alert('이미 있는 종목', '같은 이름의 종목이 이미 있습니다. 기존 종목을 선택해주세요.');
      return;
    }

    Alert.alert('커스텀 종목 추가', `"${query.trim()}"를 종목으로 추가할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '추가',
        onPress: () =>
          handleSelect({
            name_ko: query.trim(),
            name_en: null,
            category: '기타',
            default_rest_seconds: 90,
            is_custom: true,
          }),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Exercise | Omit<Exercise, 'id'> }) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.text }}>
          {item.name_ko}
        </Text>
        {item.category && (
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 }}>
            {item.category} · 휴식 {item.default_rest_seconds}초
          </Text>
        )}
      </View>
      <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.accent} />
    </TouchableOpacity>
  );

  const sections = [
    ...(filteredDb.length > 0 ? [{ type: 'header', label: '내 종목' }, ...filteredDb.map((e) => ({ type: 'item', data: e }))] : []),
    ...(filteredBuiltInNew.length > 0 ? [{ type: 'header', label: '추천 종목' }, ...filteredBuiltInNew.map((e) => ({ type: 'item', data: e }))] : []),
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text }}>
          종목 추가
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.text }]}
          placeholder="종목 검색..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={sections as any[]}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={[styles.sectionLabel, { fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary }]}>
                  {item.label}
                </Text>
              );
            }
            return renderItem({ item: item.data });
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>
                검색 결과 없음
              </Text>
            </View>
          }
          ListFooterComponent={
            query.trim().length > 0 && !hasExactMatch ? (
              <TouchableOpacity
                style={[styles.customBtn, { borderColor: colors.accent }]}
                onPress={handleAddCustom}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.accent, fontWeight: typography.weight.medium }}>
                  "{query.trim()}" 직접 추가
                </Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {adding && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

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
  closeBtn: { width: 36, alignItems: 'flex-start' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1 },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemContent: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 48 },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
