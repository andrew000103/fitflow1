import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchFoods } from '../../lib/food-search';
import {
  FoodRow,
  SaveUserFoodParams,
  foodRowToFoodItem,
  saveUserFood,
} from '../../lib/diet-search';
import { useAuthStore } from '../../stores/auth-store';
import { useDietStore } from '../../stores/diet-store';
import { useAppTheme } from '../../theme';
import { FoodItem, MEAL_TYPE_LABEL } from '../../types/food';
import { DietStackParamList } from '../../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<DietStackParamList, 'FoodSearch'>;
  route: RouteProp<DietStackParamList, 'FoodSearch'>;
};

const toFoodItem = foodRowToFoodItem;

// ─── AmountModal ──────────────────────────────────────────────────────────────

function AmountModal({
  food,
  onConfirm,
  onClose,
  adding,
}: {
  food: FoodItem;
  onConfirm: (amountG: number) => void;
  onClose: () => void;
  adding: boolean;
}) {
  const { colors, typography } = useAppTheme();
  const [amountStr, setAmountStr] = useState('100');
  const amount = parseFloat(amountStr) || 0;
  const ratio = amount / 100;

  const r1 = (n: number) => Math.round(n * ratio * 10) / 10;

  return (
    <View style={modalStyles.backdrop}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[modalStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* 음식 정보 */}
          <Text
            style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text }}
            numberOfLines={2}
          >
            {food.name}
          </Text>
          {food.brand ? (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 }}>
              {food.brand}
            </Text>
          ) : null}

          {/* 섭취량 입력 */}
          <View style={{ marginTop: 20, marginBottom: 14 }}>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textSecondary, marginBottom: 8 }}>
              섭취량
            </Text>
            <View style={[modalStyles.amountRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[modalStyles.amountInput, { fontFamily: typography.fontFamily, color: colors.text }]}
                value={amountStr}
                onChangeText={(v) => setAmountStr(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                selectTextOnFocus
                autoFocus
              />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.textSecondary }}>
                g
              </Text>
            </View>
          </View>

          {/* 계산된 영양소 미리보기 */}
          {amount > 0 ? (
            <View style={[modalStyles.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {[
                { label: 'kcal', value: String(Math.round(food.nutrients.calories * ratio)), color: colors.accent },
                { label: '탄수화물', value: `${r1(food.nutrients.carbs_g)}g`, color: colors.carbs },
                { label: '단백질', value: `${r1(food.nutrients.protein_g)}g`, color: colors.protein },
                { label: '지방', value: `${r1(food.nutrients.fat_g)}g`, color: colors.fat },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <View style={modalStyles.previewItem}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.bold, color: item.color }}>
                      {item.value}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                      {item.label}
                    </Text>
                  </View>
                  {i < arr.length - 1 ? (
                    <View style={[modalStyles.previewDivider, { backgroundColor: colors.border }]} />
                  ) : null}
                </React.Fragment>
              ))}
            </View>
          ) : null}

          {/* 버튼 */}
          <View style={modalStyles.btnRow}>
            <TouchableOpacity
              style={[modalStyles.btn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={onClose}
              disabled={adding}
            >
              <Text style={{ fontFamily: typography.fontFamily, fontWeight: typography.weight.medium, color: colors.text }}>
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                modalStyles.btn,
                modalStyles.btnPrimary,
                { backgroundColor: amount > 0 && !adding ? colors.accent : colors.trackBg },
              ]}
              onPress={() => amount > 0 && onConfirm(amount)}
              disabled={amount <= 0 || adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontFamily: typography.fontFamily, fontWeight: typography.weight.semibold, color: '#fff' }}>
                  식단에 추가
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    paddingBottom: 36,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    minHeight: 52,
  },
  preview: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 4,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: {
    borderWidth: 0,
  },
});

// ─── 출처 뱃지 설정 ───────────────────────────────────────────────────────────

const SOURCE_BADGE_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  custom:        { label: '내 음식', bgColor: '#e8f5e9', textColor: '#2e7d32' },
  mfds:          { label: '식약처',  bgColor: '#e8f5e9', textColor: '#1b5e20' },
  openfoodfacts: { label: 'OFFs',   bgColor: '#e3f2fd', textColor: '#1565c0' },
  usda:          { label: 'USDA',   bgColor: '#fff3e0', textColor: '#e65100' },
};

// ─── FoodResultCard ───────────────────────────────────────────────────────────

function FoodResultCard({ food, onSelect }: { food: FoodItem; onSelect: () => void }) {
  const { colors, typography } = useAppTheme();
  const badge = SOURCE_BADGE_CONFIG[food.source];

  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      <View style={cardStyles.top}>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text }}
            numberOfLines={2}
          >
            {food.name}
          </Text>
          {food.brand ? (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 }}>
              {food.brand}
            </Text>
          ) : null}
          {badge ? (
            <View style={[cardStyles.sourceBadge, { backgroundColor: badge.bgColor }]}>
              <Text style={{ fontSize: 10, color: badge.textColor, fontWeight: '600' }}>
                {badge.label}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[cardStyles.calBadge, { backgroundColor: colors.accentMuted }]}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.accent }}>
            {food.nutrients.calories} kcal
          </Text>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: colors.textTertiary }}>
            / 100g
          </Text>
        </View>
      </View>
      <View style={cardStyles.macros}>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.carbs }}>
          탄 {food.nutrients.carbs_g}g
        </Text>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.protein }}>
          단 {food.nutrients.protein_g}g
        </Text>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.fat }}>
          지 {food.nutrients.fat_g}g
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  calBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'flex-end',
    minWidth: 72,
  },
  macros: {
    flexDirection: 'row',
    gap: 16,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
});

// ─── DirectInputForm ──────────────────────────────────────────────────────────

interface DirectForm {
  name_ko: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  brand: string;
  sodium: string;
  sugar: string;
  notes: string;
}

const EMPTY_FORM: DirectForm = {
  name_ko: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  brand: '',
  sodium: '',
  sugar: '',
  notes: '',
};

const FORM_FIELDS: Array<{
  key: keyof DirectForm;
  label: string;
  placeholder: string;
  numeric: boolean;
  required?: boolean;
}> = [
  { key: 'name_ko', label: '음식명', placeholder: '닭가슴살 볶음', numeric: false, required: true },
  { key: 'calories', label: '칼로리 (kcal / 100g)', placeholder: '165', numeric: true, required: true },
  { key: 'protein', label: '단백질 (g / 100g)', placeholder: '31', numeric: true, required: true },
  { key: 'carbs', label: '탄수화물 (g / 100g)', placeholder: '0', numeric: true, required: true },
  { key: 'fat', label: '지방 (g / 100g)', placeholder: '3.6', numeric: true, required: true },
  { key: 'brand', label: '브랜드', placeholder: '하림', numeric: false },
  { key: 'sodium', label: '나트륨 (mg / 100g)', placeholder: '74', numeric: true },
  { key: 'sugar', label: '당류 (g / 100g)', placeholder: '0', numeric: true },
  { key: 'notes', label: '메모', placeholder: '추가 정보', numeric: false },
];

function DirectInputForm({
  initialName,
  onSave,
  onCancel,
  saving,
}: {
  initialName: string;
  onSave: (form: DirectForm) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { colors, typography } = useAppTheme();
  const [form, setForm] = useState<DirectForm>({ ...EMPTY_FORM, name_ko: initialName });

  const update = (key: keyof DirectForm) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isValid =
    form.name_ko.trim().length > 0 &&
    parseFloat(form.calories) > 0 &&
    form.protein !== '' &&
    form.carbs !== '' &&
    form.fat !== '';

  return (
    <ScrollView
      contentContainerStyle={formStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text, marginBottom: 4 }}>
        직접 입력
      </Text>
      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: 20 }}>
        * 표시 항목은 필수입니다
      </Text>

      {FORM_FIELDS.map(({ key, label, placeholder, numeric, required }) => (
        <View key={key} style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text, marginBottom: 6 }}>
            {label}{required ? ' *' : ''}
          </Text>
          <TextInput
            style={[
              formStyles.input,
              { borderColor: colors.border, backgroundColor: colors.card, color: colors.text, fontFamily: typography.fontFamily },
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={form[key]}
            onChangeText={update(key)}
            keyboardType={numeric ? 'decimal-pad' : 'default'}
          />
        </View>
      ))}

      <View style={formStyles.btnRow}>
        <TouchableOpacity
          style={[formStyles.cancelBtn, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={{ fontFamily: typography.fontFamily, fontWeight: typography.weight.medium, color: colors.text }}>
            취소
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.saveBtn, { backgroundColor: isValid && !saving ? colors.accent : colors.trackBg }]}
          onPress={() => isValid && onSave(form)}
          disabled={!isValid || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontFamily: typography.fontFamily, fontWeight: typography.weight.semibold, color: '#fff' }}>
              저장
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const formStyles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveBtn: {
    flex: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
});

// ─── FoodSearchScreen ─────────────────────────────────────────────────────────

export default function FoodSearchScreen({ navigation, route }: Props) {
  const { colors, typography } = useAppTheme();
  const { mealType, date } = route.params;
  const { user } = useAuthStore();
  const addEntry = useDietStore((s) => s.addEntry);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [adding, setAdding] = useState(false);

  const [mode, setMode] = useState<'search' | 'direct'>('search');
  const [savingDirect, setSavingDirect] = useState(false);

  // ── 페이지네이션 상태 ────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── 검색 (디바운스 500ms) ────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string, pg = 1) => {
    const normalized = q.trim();
    if (!normalized) {
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }
    if (pg === 1) {
      setLoading(true);
      setHasSearched(false);
      setSearchError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const items = await searchFoods(normalized, pg, user?.id ?? undefined);
      if (pg === 1) setResults(items);
      else setResults(prev => [...prev, ...items]);
      setPage(pg);
    } catch (err) {
      if (pg === 1) setResults([]);
      if (pg === 1) {
        setSearchError(
          err instanceof Error
            ? err.message
            : '음식 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    } finally {
      if (pg === 1) {
        setLoading(false);
        setHasSearched(true);
      } else {
        setLoadingMore(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, 1), 500);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  // ── 더 보기 ──────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!query.trim() || loadingMore) return;
    await doSearch(query, page + 1);
  }, [query, page, loadingMore, doSearch]);

  // ── 항목 선택 → 섭취량 입력 → 저장 ─────────────────────────────────────
  const handleConfirmAmount = async (amountG: number) => {
    if (!selectedFood) return;
    if (!user?.id || user.isAnonymous) {
      Alert.alert('로그인 필요', '음식을 식단에 추가하려면 일반 로그인이 필요합니다.');
      return;
    }

    setAdding(true);
    try {
      addEntry(selectedFood, amountG, 'g', mealType, date);
      setSelectedFood(null);
      navigation.goBack();
    } finally {
      setAdding(false);
    }
  };

  // ── 직접 입력 저장 ───────────────────────────────────────────────────────
  const handleSaveDirect = async (form: DirectForm) => {
    if (!user?.id || user.isAnonymous) {
      setDirectError('직접 입력으로 음식을 저장하려면 일반 로그인이 필요합니다.');
      return;
    }

    setDirectError(null);
    setSavingDirect(true);
    try {
      const params: SaveUserFoodParams = {
        name_ko: form.name_ko.trim(),
        calories_per_100g: parseFloat(form.calories),
        protein_per_100g: parseFloat(form.protein) || 0,
        carbs_per_100g: parseFloat(form.carbs) || 0,
        fat_per_100g: parseFloat(form.fat) || 0,
        userId: user.id,
      };
      if (form.brand.trim()) params.brand = form.brand.trim();
      if (form.sodium.trim()) params.sodium_per_100g = parseFloat(form.sodium);
      if (form.sugar.trim()) params.sugar_per_100g = parseFloat(form.sugar);
      if (form.notes.trim()) params.notes = form.notes.trim();

      const saved = await saveUserFood(params);
      setMode('search');
      setSelectedFood(toFoodItem(saved));
    } catch (err) {
      setDirectError(
        err instanceof Error
          ? err.message
          : '직접 입력 음식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setSavingDirect(false);
    }
  };

  const mealLabel = MEAL_TYPE_LABEL[mealType];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.text }}>
          {mealLabel} 음식 추가
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {mode === 'direct' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <>
            {directError ? (
              <View style={[styles.inlineBanner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                <Text style={{ color: colors.error, fontFamily: typography.fontFamily, fontSize: typography.size.sm }}>
                  {directError}
                </Text>
              </View>
            ) : null}
            <DirectInputForm
              initialName={query.trim()}
              onSave={handleSaveDirect}
              onCancel={() => {
                setDirectError(null);
                setMode('search');
              }}
              saving={savingDirect}
            />
          </>
        </KeyboardAvoidingView>
      ) : (
        <>
          {/* 검색창 */}
          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.text }]}
              placeholder={`${mealLabel} 음식 검색...`}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setMode('search');
                setSearchError(null);
              }}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); setSearchError(null); }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* 상태별 콘텐츠 */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 56 }} color={colors.accent} />
          ) : searchError ? (
            <View style={styles.centerState}>
              <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.error} />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.error, textAlign: 'center', marginTop: 12 }}>
                {searchError}
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                onPress={() => doSearch(query, 1)}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: '#fff' }}>
                  다시 시도
                </Text>
              </TouchableOpacity>
            </View>
          ) : hasSearched && results.length === 0 ? (
            // 결과 없음
            <View style={styles.centerState}>
              <MaterialCommunityIcons name="food-off-outline" size={52} color={colors.textTertiary} />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
                "{query.trim()}"에 대한 검색 결과가 없습니다
              </Text>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setDirectError(null);
                  setMode('direct');
                }}
              >
                <MaterialCommunityIcons name="pencil-plus-outline" size={18} color="#fff" />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: '#fff' }}>
                  직접 입력하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : !hasSearched ? (
            // 초기 상태
            <View style={styles.centerState}>
              <MaterialCommunityIcons name="magnify" size={52} color={colors.textTertiary} />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
                음식명을 입력하면 자동으로 검색합니다
              </Text>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.accent }]}
                onPress={() => {
                  setDirectError(null);
                  setMode('direct');
                }}
              >
                <MaterialCommunityIcons name="pencil-plus-outline" size={18} color={colors.accent} />
                <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.accent }}>
                  직접 입력하기
                </Text>
              </TouchableOpacity>
            </View>
            ) : (
            // 결과 목록
            <>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <FoodResultCard food={item} onSelect={() => setSelectedFood(item)} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  <View style={{ gap: 10, paddingTop: 4 }}>
                    {/* 더 보기 */}
                    <TouchableOpacity
                      style={[styles.outlineBtn, { borderColor: colors.border }]}
                      onPress={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.textSecondary }}>
                          더 보기
                        </Text>
                      )}
                    </TouchableOpacity>
                    {/* 직접 입력 */}
                    <TouchableOpacity
                      style={[styles.outlineBtn, { borderColor: colors.accent }]}
                      onPress={() => {
                        setDirectError(null);
                        setMode('direct');
                      }}
                    >
                      <MaterialCommunityIcons name="pencil-plus-outline" size={18} color={colors.accent} />
                      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.accent }}>
                        직접 입력하기
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </>
          )}
        </>
      )}

      {/* 섭취량 입력 모달 */}
      {selectedFood ? (
        <AmountModal
          food={selectedFood}
          onConfirm={handleConfirmAmount}
          onClose={() => setSelectedFood(null)}
          adding={adding}
        />
      ) : null}
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
  headerBtn: {
    width: 32,
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  inlineBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
});
