import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { WorkoutStackParamList } from '../../types/navigation';
import { UserProfile } from '../../types/program';

type Props = {
  navigation: NativeStackNavigationProp<WorkoutStackParamList, 'ProgramReview'>;
  route: RouteProp<WorkoutStackParamList, 'ProgramReview'>;
};

// ─── StarSelector ─────────────────────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
  label,
  hint,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  hint?: string;
}) {
  const { colors, typography } = useAppTheme();
  return (
    <View style={starStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text }}>
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 1 }}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={starStyles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <MaterialCommunityIcons
              name={n <= value ? 'star' : 'star-outline'}
              size={28}
              color={n <= value ? '#FBBF24' : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  stars: { flexDirection: 'row', gap: 2 },
});

// ─── GenderPicker ─────────────────────────────────────────────────────────────

function GenderPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const { colors, typography } = useAppTheme();
  const options = ['남성', '여성', '기타'];
  return (
    <View style={gStyles.row}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              gStyles.btn,
              {
                backgroundColor: active ? colors.accent : 'transparent',
                borderColor: active ? colors.accent : colors.border,
              },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.75}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                fontWeight: active ? typography.weight.semibold : typography.weight.regular,
                color: active ? '#fff' : colors.textSecondary,
              }}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const gStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
});

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { colors, typography } = useAppTheme();
  return (
    <View style={sStyles.row}>
      <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.text, flex: 1 }}>
        {label}
      </Text>
      <View style={sStyles.controls}>
        <TouchableOpacity style={[sStyles.btn, { borderColor: colors.border }]} onPress={() => onChange(Math.max(min, value - 1))} activeOpacity={0.7}>
          <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.text, width: 48, textAlign: 'center' }}>
          {value}{unit}
        </Text>
        <TouchableOpacity style={[sStyles.btn, { borderColor: colors.border }]} onPress={() => onChange(Math.min(max, value + 1))} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  btn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── ProgramReviewScreen ──────────────────────────────────────────────────────

export default function ProgramReviewScreen({ navigation, route }: Props) {
  const { programId, programName } = route.params;
  const { colors, typography } = useAppTheme();
  const { user } = useAuthStore();

  // Profile fields
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Review fields
  const [weeksCompleted, setWeeksCompleted] = useState(4);
  const [strengthGain, setStrengthGain] = useState(3);
  const [muscleGain, setMuscleGain] = useState(3);
  const [overallRating, setOverallRating] = useState(3);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing profile
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('gender, age')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setGender(data.gender ?? null);
          setAge(data.age ? data.age.toString() : '');
        }
        setProfileLoaded(true);
      });
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('로그인 필요');
      return;
    }
    if (strengthGain === 0 || muscleGain === 0 || overallRating === 0) {
      Alert.alert('평가 필요', '모든 별점을 선택해주세요.');
      return;
    }

    const ageNum = parseInt(age, 10) || null;
    if (ageNum !== null && (ageNum < 10 || ageNum > 100)) {
      Alert.alert('나이 오류', '나이는 10~100 사이로 입력해주세요.');
      return;
    }

    setSaving(true);
    try {

      // Upsert profile
      if (gender || ageNum) {
        await supabase.from('user_profiles').upsert(
          { id: user.id, gender: gender ?? null, age: ageNum },
          { onConflict: 'id' },
        );
      }

      // Insert review
      const { error } = await supabase.from('program_reviews').upsert(
        {
          program_id: programId,
          user_id: user.id,
          weeks_completed: weeksCompleted,
          strength_gain: strengthGain,
          muscle_gain: muscleGain,
          overall_rating: overallRating,
          review_text: reviewText.trim() || null,
          reviewer_age: ageNum,
          reviewer_gender: gender ?? null,
          reviewer_display_name: user.email?.split('@')[0] ?? null,
        },
        { onConflict: 'program_id,user_id' },
      );

      if (error?.code === 'PGRST205') {
        throw new Error('리뷰 기능은 아직 준비 중입니다.');
      }
      if (error) throw new Error(error.message);
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
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text }}>
            리뷰 작성
          </Text>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
            {programName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: '#fff' }}>
              등록
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* 작성자 정보 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              작성자 정보
            </Text>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginBottom: 12 }}>
              리뷰의 신뢰도를 위해 기본 정보를 입력해주세요 (선택)
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily }]}>
              성별
            </Text>
            <GenderPicker value={gender} onChange={setGender} />

            <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: typography.fontFamily, marginTop: 14 }]}>
              나이
            </Text>
            <View style={[styles.yearInputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.yearInput, { color: colors.text, fontFamily: typography.fontFamily }]}
                placeholder="예: 28"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={age}
                onChangeText={(t) => setAge(t.slice(0, 3))}
                maxLength={3}
              />
            </View>
          </View>

          {/* 진행 기간 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              진행 기간
            </Text>
            <Stepper
              label="이 프로그램을 진행한 기간"
              value={weeksCompleted}
              unit="주"
              min={1}
              max={52}
              onChange={setWeeksCompleted}
            />
          </View>

          {/* 평가 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              프로그램 평가
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StarSelector
              label="Strength Gain"
              hint="근력이 얼마나 늘었나요?"
              value={strengthGain}
              onChange={setStrengthGain}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StarSelector
              label="Muscle Gain"
              hint="근육량이 얼마나 늘었나요?"
              value={muscleGain}
              onChange={setMuscleGain}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StarSelector
              label="전체 만족도"
              value={overallRating}
              onChange={setOverallRating}
            />
          </View>

          {/* 후기 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily }]}>
              후기 (선택)
            </Text>
            <TextInput
              style={[
                styles.reviewInput,
                {
                  color: colors.text,
                  fontFamily: typography.fontFamily,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="이 프로그램을 진행하면서 느낀 점을 자유롭게 적어주세요..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.size.xs, color: colors.textTertiary, marginTop: 4, textAlign: 'right' }}>
              {reviewText.length}/500
            </Text>
          </View>

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
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 58,
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  yearInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  yearInput: {
    flex: 1,
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
    lineHeight: 20,
  },
});
