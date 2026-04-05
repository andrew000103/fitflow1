import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ExerciseVisualGuide from '../../components/workout/ExerciseVisualGuide';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUILT_IN_EXERCISES } from '../../constants/exercises';
import {
  dedupeExercisesByName,
  EXERCISE_CATEGORY_OPTIONS,
  ExerciseCategoryOption,
  normalizeExerciseCategory,
  normalizeExerciseName,
} from '../../lib/exercise-utils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useWorkoutStore } from '../../stores/workout-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { Exercise } from '../../types/workout';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseSearch'>;
  route: RouteProp<WorkoutStackParamList, 'ExerciseSearch'>;
};


export default function ExerciseSearchScreen({ navigation, route }: Props) {
  const { colors, typography } = useAppTheme();
  const { addExercise, updateExerciseName } = useWorkoutStore();
  const { user } = useAuthStore();
  const userId = user?.id;
  const mode = route.params?.mode ?? 'add';
  const replaceExerciseIndex = route.params?.exerciseIndex;

  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategoryOption>('전체');

  const normalizedQuery = normalizeExerciseName(query);
  const hasSearchQuery = query.trim().length > 0;

  const matchesCategory = useCallback(
    (exercise: Pick<Exercise, 'category'>) =>
      selectedCategory === '전체' || normalizeExerciseCategory(exercise.category) === selectedCategory,
    [selectedCategory],
  );

  const matchesQuery = useCallback(
    (exercise: Pick<Exercise, 'name_ko' | 'name_en'>) =>
      exercise.name_ko.includes(query) || (exercise.name_en?.toLowerCase().includes(query.toLowerCase()) ?? false),
    [query],
  );

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

  const dedupedDbExercises = dedupeExercisesByName(dbExercises);
  const filteredDb = dedupedDbExercises.filter((exercise) => matchesCategory(exercise) && matchesQuery(exercise));
  const dbNames = new Set(dedupedDbExercises.map((e) => normalizeExerciseName(e.name_ko)));
  const filteredBuiltInNew = dedupeExercisesByName(
    BUILT_IN_EXERCISES.filter(
      (exercise) => matchesCategory(exercise) && matchesQuery(exercise) && !dbNames.has(normalizeExerciseName(exercise.name_ko)),
    ),
  );
  const visibleExercises = [...filteredDb, ...filteredBuiltInNew];
  const hasExactMatchInSelectedCategory = visibleExercises.some(
    (exercise) => normalizeExerciseName(exercise.name_ko) === normalizedQuery,
  );
  const hasExactMatchAnywhere = [...dedupedDbExercises, ...BUILT_IN_EXERCISES].some(
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

      if (mode === 'replace' && typeof replaceExerciseIndex === 'number') {
        updateExerciseName(replaceExerciseIndex, resolved.name_ko);
      } else {
        addExercise(resolved);
      }
      navigation.goBack();
      setAdding(false);
    },
    [adding, addExercise, mode, navigation, replaceExerciseIndex, updateExerciseName],
  );

  const handleAddCustom = () => {
    if (!query.trim()) return;
    if (hasExactMatchAnywhere) {
      Alert.alert('이미 있는 종목', '같은 이름의 종목이 이미 있습니다. 기존 종목을 선택해주세요.');
      return;
    }

    Alert.alert(mode === 'replace' ? '커스텀 종목으로 교체' : '커스텀 종목 추가', `"${query.trim()}"${mode === 'replace' ? '로 종목을 교체할까요?' : '를 종목으로 추가할까요?'}`, [
      { text: '취소', style: 'cancel' },
      {
        text: mode === 'replace' ? '교체' : '추가',
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

  const renderItem = ({ item }: { item: Exercise | Omit<Exercise, 'id'> }) => {
    const fallback = BUILT_IN_EXERCISES.find(
      (exercise) => normalizeExerciseName(exercise.name_ko) === normalizeExerciseName(item.name_ko),
    );
    const category = normalizeExerciseCategory(item.category ?? fallback?.category ?? null);
    const restSeconds = item.default_rest_seconds ?? fallback?.default_rest_seconds ?? null;

    return (
      <View
        style={[styles.item, { borderBottomColor: colors.border }]}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemNameRow}>
            <Text
              style={{
                flexShrink: 1,
                fontFamily: typography.fontFamily,
                fontSize: typography.size.md,
                fontWeight: typography.weight.medium,
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {item.name_ko}
            </Text>
            <View style={{ marginLeft: 4, alignSelf: 'center' }}>
              <ExerciseVisualGuide
                exerciseId={'id' in item ? item.id : undefined}
                visualGuideUrl={'visual_guide_url' in item ? item.visual_guide_url : undefined}
                description={'description_ko' in item ? item.description_ko ?? item.description_en : undefined}
                exerciseName={item.name_ko}
                overview={'overview_ko' in item ? item.overview_ko ?? item.overview_en : undefined}
                why={'why_ko' in item ? item.why_ko ?? item.why_en : undefined}
                how={'how_ko' in item ? item.how_ko ?? item.how_en : undefined}
                triggerVariant="icon"
                iconColor={colors.textSecondary}
                iconBackgroundColor={colors.background}
                iconBorderColor={colors.border}
              />
            </View>
          </View>
          {restSeconds != null && (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 }}>
              {category} · 휴식 {restSeconds}초
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
          style={styles.addButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>
    );
  };

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
          {mode === 'replace' ? '종목 교체' : '종목 추가'}
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

      <View style={styles.categorySection}>
        <Text
          style={{
            paddingHorizontal: 16,
            marginBottom: 10,
            fontFamily: typography.fontFamily,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.medium,
            color: colors.textSecondary,
          }}
        >
          운동 분류
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {EXERCISE_CATEGORY_OPTIONS.map((category) => {
            const isSelected = category === selectedCategory;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.card,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: isSelected ? colors.background : colors.text,
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
                {selectedCategory === '전체'
                  ? hasSearchQuery
                    ? `"${query.trim()}" 검색 결과 없음`
                    : '운동 종목이 없습니다'
                  : hasSearchQuery
                    ? `${selectedCategory}에서 "${query.trim()}" 검색 결과 없음`
                    : `${selectedCategory} 운동이 없습니다`}
              </Text>
            </View>
          }
          ListFooterComponent={
            query.trim().length > 0 ? (
              hasExactMatchInSelectedCategory ? null : hasExactMatchAnywhere ? (
                <View style={[styles.helperBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary }}>
                    같은 이름의 종목이 다른 분류에 이미 있습니다. 분류를 바꾸거나 기존 종목을 선택해주세요.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.customBtn, { borderColor: colors.accent }]}
                  onPress={handleAddCustom}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.accent, fontWeight: typography.weight.medium }}>
                    "{query.trim()}" 직접 추가
                  </Text>
                </TouchableOpacity>
              )
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
  categorySection: {
    marginBottom: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
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
  itemContent: { flex: 1, minWidth: 0, paddingRight: 8 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0, alignSelf: 'flex-start' },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingVertical: 4,
  },
  searchThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
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
  helperBox: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
