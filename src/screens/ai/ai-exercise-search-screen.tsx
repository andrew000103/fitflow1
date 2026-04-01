import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUILT_IN_EXERCISES } from '../../constants/exercises';
import { normalizeExerciseName } from '../../lib/exercise-utils';
import { updateAIPlanSnapshotInSupabase } from '../../lib/ai-planner';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AIExerciseSearch'>;
  route: RouteProp<RootStackParamList, 'AIExerciseSearch'>;
};

type ExerciseOption = {
  name: string;
  category: string | null;
  restSeconds: number;
  nameEn: string | null;
};

const EXERCISE_OPTIONS: ExerciseOption[] = BUILT_IN_EXERCISES
  .map((exercise) => ({
    name: exercise.name_ko,
    category: exercise.category,
    restSeconds: exercise.default_rest_seconds,
    nameEn: exercise.name_en,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

export default function AIExerciseSearchScreen({ navigation, route }: Props) {
  const { colors, typography } = useAppTheme();
  const { dayLabel, exerciseIndex, exerciseName } = route.params;
  const [query, setQuery] = useState('');
  const [savingName, setSavingName] = useState<string | null>(null);
  const swapExercise = useAIPlanStore((state) => state.swapExercise);

  const normalizedQuery = normalizeExerciseName(query);
  const normalizedCurrentName = normalizeExerciseName(exerciseName);

  const filteredExercises = EXERCISE_OPTIONS.filter((exercise) => {
    if (!normalizedQuery) return true;
    return (
      normalizeExerciseName(exercise.name).includes(normalizedQuery) ||
      normalizeExerciseName(exercise.nameEn ?? '').includes(normalizedQuery) ||
      normalizeExerciseName(exercise.category ?? '').includes(normalizedQuery)
    );
  });

  const handleSelect = async (selectedName: string) => {
    if (savingName) return;
    setSavingName(selectedName);
    swapExercise(dayLabel, exerciseIndex, selectedName);
    const updatedPlan = useAIPlanStore.getState().currentPlan;
    if (updatedPlan) {
      updateAIPlanSnapshotInSupabase(updatedPlan).catch(() => {});
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily }]}>운동 검색</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            {exerciseName} 대신 넣을 종목을 선택하세요
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: typography.fontFamily }]}
          placeholder="운동 이름 또는 부위 검색"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.helperText, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
            추천 목록에 없는 운동도 전체 종목에서 직접 골라 교체할 수 있어요.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: typography.fontFamily }]}>
              검색 결과가 없어요
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              다른 이름이나 부위 키워드로 다시 찾아보세요.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCurrent = normalizeExerciseName(item.name) === normalizedCurrentName;
          const isSaving = savingName === item.name;

          return (
            <TouchableOpacity
              style={[
                styles.item,
                {
                  backgroundColor: colors.card,
                  borderColor: isCurrent ? colors.accent : colors.border,
                },
              ]}
              onPress={() => handleSelect(item.name)}
              disabled={isSaving}
              activeOpacity={0.75}
            >
              <View style={styles.itemBody}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.itemName, { color: colors.text, fontFamily: typography.fontFamily }]}>
                    {item.name}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.accent + '18' }]}>
                      <Text style={[styles.currentBadgeText, { color: colors.accent, fontFamily: typography.fontFamily }]}>
                        현재 종목
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemMeta, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
                  {[item.category, `기본 휴식 ${item.restSeconds}초`].filter(Boolean).join(' · ')}
                </Text>
                {item.nameEn && (
                  <Text style={[styles.itemEn, { color: colors.textTertiary, fontFamily: typography.fontFamily }]}>
                    {item.nameEn}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons
                name={isSaving ? 'progress-clock' : 'arrow-right'}
                size={20}
                color={isCurrent ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  itemBody: {
    flex: 1,
    paddingRight: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 13,
  },
  itemEn: {
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
