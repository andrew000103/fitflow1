import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import { AppButton } from '../../components/common/AppButton';
import { AppHeader } from '../../components/common/AppHeader';
import { useAuthStore } from '../../stores/auth-store';
import {
  type QuickCharacterDietConsistency,
  type QuickCharacterTrainingStyle,
  type QuickCharacterWorkoutFrequency,
  usePersonaStore,
} from '../../stores/persona-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type Option<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

const GENDER_OPTIONS: Option<'male' | 'female' | 'undisclosed'>[] = [
  { label: '남성', value: 'male' },
  { label: '여성', value: 'female' },
  { label: '선택 안 함', value: 'undisclosed' },
];

const EXPERIENCE_OPTIONS = [
  { label: '입문 (0~3개월)', value: 'beginner', description: '운동 루틴을 막 만들기 시작했어요.' },
  { label: '초급 (3개월~1년)', value: 'novice', description: '기초 동작과 헬스장 환경이 조금 익숙해졌어요.' },
  { label: '중급 (1~2년)', value: 'intermediate', description: '루틴이 자리잡고 운동이 생활에 들어왔어요.' },
  { label: '중상급 (2~4년)', value: 'upper_intermediate', description: '운동 방식과 몸 반응을 꽤 잘 이해하고 있어요.' },
  { label: '상급 (4년+)', value: 'advanced', description: '굳이 플랜이 없어도 스스로 조절할 수 있는 편이에요.' },
] as const;

const WORKOUT_FREQUENCY_OPTIONS: Option<QuickCharacterWorkoutFrequency>[] = [
  { label: '주 1~2회', value: '1_2', description: '가볍게 루틴을 유지하는 편이에요.' },
  { label: '주 3~4회', value: '3_4', description: '꾸준히 운동하는 일반적인 리듬이에요.' },
  { label: '주 5회 이상', value: '5_plus', description: '운동이 생활의 큰 축이에요.' },
];

const TRAINING_STYLE_OPTIONS: Option<QuickCharacterTrainingStyle>[] = [
  { label: '건강관리 중심', value: 'health', description: '부담 없이 오래 가는 루틴이 중요해요.' },
  { label: '몸만들기 중심', value: 'physique', description: '체형 변화와 외형 개선이 더 중요해요.' },
  { label: '기록·퍼포먼스 중심', value: 'performance', description: '중량, 기록, 수행능력 향상에 더 끌려요.' },
];

const DIET_OPTIONS: Option<QuickCharacterDietConsistency>[] = [
  { label: '거의 안 해요', value: 'low' },
  { label: '가끔 챙겨요', value: 'medium' },
  { label: '꽤 꾸준히 해요', value: 'high' },
];

function OptionGroup<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: readonly Option<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  const { colors, spacing, radius, typography } = useAppTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.text, fontFamily: typography.fontFamily, fontSize: 18, fontWeight: '700' }}>
        {title}
      </Text>
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.85}
            onPress={() => onSelect(option.value)}
            style={[
              styles.optionCard,
              {
                backgroundColor: active ? colors.accentMuted : colors.card,
                borderColor: active ? colors.accent : colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.optionTopRow}>
              <Text style={{ color: active ? colors.accent : colors.text, fontFamily: typography.fontFamily, fontSize: 15, fontWeight: '700', flex: 1 }}>
                {option.label}
              </Text>
              <MaterialCommunityIcons
                name={active ? 'check-circle' : 'circle-outline'}
                size={18}
                color={active ? colors.accent : colors.textTertiary}
              />
            </View>
            {option.description ? (
              <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: 13, lineHeight: 18, marginTop: 6 }}>
                {option.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CharacterSetupScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors, spacing } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const quickProfile = usePersonaStore((s) => s.quickCharacterProfile);
  const setQuickCharacterProfile = usePersonaStore((s) => s.setQuickCharacterProfile);
  const calculatePersona = usePersonaStore((s) => s.calculatePersona);

  const [experience, setExperience] = useState<typeof EXPERIENCE_OPTIONS[number]['value'] | null>(
    quickProfile?.experience ?? null,
  );
  const [workoutFrequency, setWorkoutFrequency] = useState<QuickCharacterWorkoutFrequency | null>(
    quickProfile?.workoutFrequency ?? null,
  );
  const [trainingStyle, setTrainingStyle] = useState<QuickCharacterTrainingStyle | null>(
    quickProfile?.trainingStyle ?? null,
  );
  const [dietConsistency, setDietConsistency] = useState<QuickCharacterDietConsistency | null>(
    quickProfile?.dietConsistency ?? null,
  );
  const [gender, setGender] = useState<'male' | 'female' | 'undisclosed'>(
    quickProfile?.gender ?? 'undisclosed',
  );
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(experience && workoutFrequency && trainingStyle),
    [experience, trainingStyle, workoutFrequency],
  );

  const handleSubmit = async () => {
    if (!experience || !workoutFrequency || !trainingStyle || saving) return;

    setSaving(true);
    try {
      setQuickCharacterProfile({
        userId: user?.id ?? 'guest',
        experience,
        workoutFrequency,
        trainingStyle,
        dietConsistency,
        gender,
      });

      if (user?.id) {
        await calculatePersona(user.id);
      }

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AIFlowScreen
      header={
        <AppHeader
          title="빠른 레벨 설정"
          subtitle="현재 수준 정리"
          rightAction={{
            icon: <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />,
            onPress: () => navigation.goBack(),
          }}
        />
      }
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl }}
      footer={
        <AppButton
          label={quickProfile ? '레벨 다시 정리하기' : '현재 수준 정리하기'}
          loading={saving}
          onPress={handleSubmit}
          disabled={!canSubmit}
          size="lg"
        />
      }
    >
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border, padding: spacing.lg }]}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
          몇 가지만 답하면{'\n'}현재 운동 수준을 빠르게 정리해드릴게요
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 10 }}>
          AI 플랜을 꼭 만들지 않아도 괜찮아요. 지금 운동 경력과 루틴을 바탕으로 홈에서 볼 현재 레벨 안내를 먼저 정리해드려요.
        </Text>
      </View>

      <OptionGroup title="성별 (선택)" options={GENDER_OPTIONS} selected={gender} onSelect={setGender} />
      <OptionGroup title="운동 경력" options={EXPERIENCE_OPTIONS} selected={experience} onSelect={setExperience} />
      <OptionGroup title="주당 운동 빈도" options={WORKOUT_FREQUENCY_OPTIONS} selected={workoutFrequency} onSelect={setWorkoutFrequency} />
      <OptionGroup title="운동 성향" options={TRAINING_STYLE_OPTIONS} selected={trainingStyle} onSelect={setTrainingStyle} />
      <OptionGroup title="식단 관리 수준 (선택)" options={DIET_OPTIONS} selected={dietConsistency} onSelect={setDietConsistency} />
    </AIFlowScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  optionCard: {
    borderWidth: 1,
  },
  optionTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
