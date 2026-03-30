import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FoodRow,
  SaveUserFoodParams,
  UpdateUserFoodParams,
  foodRowToFoodItem,
  getFoodById,
  saveUserFood,
  updateUserFood,
} from '../../lib/diet-search';
import { useAuthStore } from '../../stores/auth-store';
import { useDietStore } from '../../stores/diet-store';
import { useAppTheme } from '../../theme';
import { MEAL_TYPE_LABEL } from '../../types/food';
import { DietStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<DietStackParamList, 'CustomFoodForm'>;
  route: RouteProp<DietStackParamList, 'CustomFoodForm'>;
};

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function CustomFoodFormScreen({ navigation, route }: Props) {
  const { colors, typography } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const addEntry = useDietStore((state) => state.addEntry);
  const userId = user?.id ?? 'anonymous';
  const { mealType, date, foodId, initialQuery } = route.params;

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(!foodId);
  const [productName, setProductName] = useState(initialQuery ?? '');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveStatusTone, setSaveStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [showReturnButton, setShowReturnButton] = useState(false);

  const populateForm = useCallback((food: FoodRow) => {
    setProductName(food.name_ko ?? food.product_name);
    setBrand(food.brand ?? '');
    setCalories(String(food.calories_per_100g));
    setProtein(String(food.protein_per_100g));
    setCarbs(String(food.carbs_per_100g));
    setFat(String(food.fat_per_100g));
    setSugar(food.sugar_per_100g != null ? String(food.sugar_per_100g) : '');
    setSodium(food.sodium_per_100g != null ? String(food.sodium_per_100g) : '');
    setInitialized(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!foodId) return () => {};

      setLoading(true);
      getFoodById(foodId)
        .then((food) => {
          if (!active) return;
          if (!food) {
            setSaveStatus('수정할 음식 정보를 찾을 수 없습니다. 다시 검색해서 열어주세요.');
            setSaveStatusTone('error');
            setShowReturnButton(true);
            setInitialized(true);
            return;
          }
          populateForm(food);
        })
        .catch((err) => {
          if (!active) return;
          setSaveStatus(
            err instanceof Error ? err.message : '음식 정보를 불러오는 중 오류가 발생했습니다.',
          );
          setSaveStatusTone('error');
          setShowReturnButton(true);
          setInitialized(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [foodId, populateForm]),
  );

  const title = useMemo(
    () => (foodId ? '음식 정보 수정' : `${MEAL_TYPE_LABEL[mealType]} 음식 직접 추가`),
    [foodId, mealType],
  );

  const buildSaveParams = (): SaveUserFoodParams | null => {
    if (!productName.trim()) {
      Alert.alert('입력 필요', '제품명을 입력하세요.');
      return null;
    }
    if (parseNumber(calories) <= 0) {
      Alert.alert('입력 필요', '칼로리를 입력하세요.');
      return null;
    }
    return {
      name_ko: productName.trim(),
      brand: brand.trim() || undefined,
      calories_per_100g: parseNumber(calories),
      protein_per_100g: parseNumber(protein),
      carbs_per_100g: parseNumber(carbs),
      fat_per_100g: parseNumber(fat),
      sodium_per_100g: sodium ? parseNumber(sodium) : undefined,
      sugar_per_100g: sugar ? parseNumber(sugar) : undefined,
      notes: notes.trim() || undefined,
      userId,
    };
  };

  const buildUpdateParams = (): UpdateUserFoodParams | null => {
    if (!productName.trim()) {
      Alert.alert('입력 필요', '제품명을 입력하세요.');
      return null;
    }
    if (parseNumber(calories) <= 0) {
      Alert.alert('입력 필요', '칼로리를 입력하세요.');
      return null;
    }
    return {
      name_ko: productName.trim(),
      brand: brand.trim() || null,
      calories_per_100g: parseNumber(calories),
      protein_per_100g: parseNumber(protein),
      carbs_per_100g: parseNumber(carbs),
      fat_per_100g: parseNumber(fat),
      sodium_per_100g: sodium ? parseNumber(sodium) : null,
      sugar_per_100g: sugar ? parseNumber(sugar) : null,
      notes: notes.trim() || null,
    };
  };

  const handleSave = async () => {
    setSaveStatus(null);
    setShowReturnButton(false);
    setLoading(true);
    try {
      if (foodId) {
        const params = buildUpdateParams();
        if (!params) return;
        setSaveStatus('수정 저장 중...');
        setSaveStatusTone('neutral');
        await updateUserFood(foodId, params);
        setSaveStatus('수정 완료. 이전 화면으로 이동합니다.');
        setSaveStatusTone('success');
        setTimeout(() => navigation.goBack(), 250);
      } else {
        const params = buildSaveParams();
        if (!params) return;
        setSaveStatus('새 음식 저장 중...');
        setSaveStatusTone('neutral');
        const row = await saveUserFood(params);
        addEntry(foodRowToFoodItem(row), 100, 'g', mealType, date);
        setSaveStatus('저장 완료. 식단 화면으로 이동합니다.');
        setSaveStatusTone('success');
        setTimeout(() => navigation.pop(2), 250);
      }
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : '음식 저장 중 오류가 발생했습니다.');
      setSaveStatusTone('error');
    } finally {
      setLoading(false);
    }
  };

  const renderNumericField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    unitLabel: string,
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>
        {label}
      </Text>
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text, fontFamily: typography.fontFamily }]}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />
        <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>{unitLabel}</Text>
      </View>
    </View>
  );

  if (!initialized && foodId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centerState}>
          <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.size.lg,
            fontWeight: typography.weight.semibold,
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {saveStatus ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor:
                  saveStatusTone === 'success'
                    ? colors.successMuted
                    : saveStatusTone === 'error'
                      ? colors.errorMuted
                      : colors.accentMuted,
                borderColor:
                  saveStatusTone === 'success'
                    ? colors.success
                    : saveStatusTone === 'error'
                      ? colors.error
                      : colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color:
                  saveStatusTone === 'success'
                    ? colors.success
                    : saveStatusTone === 'error'
                      ? colors.error
                      : colors.accent,
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
              }}
            >
              {saveStatus}
            </Text>
          </View>
        ) : null}

        {showReturnButton ? (
          <TouchableOpacity
            style={[styles.returnButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => (foodId ? navigation.goBack() : navigation.pop(2))}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: typography.fontFamily,
                fontWeight: typography.weight.medium,
              }}
            >
              식단으로 돌아가기
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>제품명</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text, fontFamily: typography.fontFamily }]}
              value={productName}
              onChangeText={setProductName}
              placeholder="예: 그릭요거트 볼"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>브랜드</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text, fontFamily: typography.fontFamily }]}
              value={brand}
              onChangeText={setBrand}
              placeholder="예: 스타벅스, 홈메이드"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.row}>
          {renderNumericField('칼로리', calories, setCalories, 'kcal')}
          {renderNumericField('단백질', protein, setProtein, 'g')}
        </View>
        <View style={styles.row}>
          {renderNumericField('탄수화물', carbs, setCarbs, 'g')}
          {renderNumericField('지방', fat, setFat, 'g')}
        </View>
        <View style={styles.row}>
          {renderNumericField('당류', sugar, setSugar, 'g')}
          {renderNumericField('나트륨', sodium, setSodium, 'mg')}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>메모</Text>
          <View style={[styles.textAreaWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.textArea, { color: colors.text, fontFamily: typography.fontFamily }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="레시피, 원재료, 참고사항 등을 기록하세요."
              placeholderTextColor={colors.textSecondary}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontFamily: typography.fontFamily, fontWeight: typography.weight.semibold }}>
            {loading ? '저장 중...' : foodId ? '수정 저장' : '새 음식 저장'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerButton: {
    width: 32,
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 48,
  },
  textAreaWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 96,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  returnButton: {
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
});
