import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import { classifySurveyLevel } from '../../lib/ai-level-classifier';
import {
  type AIExperience,
  type AIGender,
  type AIGoal,
  type GymType,
  type OnboardingData,
  useAIPlanStore,
} from '../../stores/ai-plan-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type GenderOption = AIGender | 'prefer_not_to_say';

interface TestAnswers {
  gender: GenderOption | null;
  goal: AIGoal | null;
  gymType: GymType | null;
  experience: AIExperience | null;
  frequency: number | null;
}

const QUESTIONS = ['gender', 'goal', 'gymType', 'experience', 'frequency'] as const;
type QuestionKey = (typeof QUESTIONS)[number];

const GENDER_OPTIONS: Array<{ label: string; value: GenderOption }> = [
  { label: '남성', value: 'male' },
  { label: '여성', value: 'female' },
  { label: '선택 안 함', value: 'prefer_not_to_say' },
];

const GOAL_OPTIONS: Array<{ label: string; value: AIGoal }> = [
  { label: '체중 감량', value: 'weight_loss' },
  { label: '근비대 (크게)', value: 'muscle_gain' },
  { label: '근력 향상 (강하게)', value: 'strength_gain' },
  { label: '린매스 (선명하게)', value: 'lean_bulk' },
  { label: '건강 유지', value: 'maintenance' },
];

const GYM_OPTIONS: Array<{ label: string; value: GymType }> = [
  { label: '풀 헬스장', value: 'full_gym' },
  { label: '홈짐 / 파워랙', value: 'garage_gym' },
  { label: '덤벨만', value: 'dumbbell_only' },
  { label: '기구 없이 (맨몸)', value: 'bodyweight' },
];

const EXPERIENCE_OPTIONS: Array<{ label: string; value: AIExperience }> = [
  { label: '이제 막 시작', value: 'beginner' },
  { label: '조금 해봤어요', value: 'novice' },
  { label: '어느 정도 돼요', value: 'intermediate' },
  { label: '꽤 됐어요', value: 'upper_intermediate' },
  { label: '오래됐어요', value: 'advanced' },
];

const FREQUENCY_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '주 1~2일', value: 1 },
  { label: '주 3일', value: 3 },
  { label: '주 4~5일', value: 4 },
  { label: '주 6일 이상', value: 6 },
];

const QUESTION_LABELS: Record<QuestionKey, string> = {
  gender: '성별이 어떻게 되세요?',
  goal: '주요 운동 목표는 무엇인가요?',
  gymType: '주로 어떤 환경에서 운동하나요?',
  experience: '운동 경력이 얼마나 되셨나요?',
  frequency: '일주일에 몇 번 운동하고 싶으세요?',
};

export default function FitnessTypeTestScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useAppTheme();
  const setOnboardingData = useAIPlanStore((s) => s.setOnboardingData);
  const setSurveyLevelResult = useAIPlanStore((s) => s.setSurveyLevelResult);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TestAnswers>({
    gender: null,
    goal: null,
    gymType: null,
    experience: null,
    frequency: null,
  });

  const currentQuestion = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentAnswer = answers[currentQuestion];
  const canProceed = currentAnswer !== null;

  const handleSelect = (value: TestAnswers[QuestionKey]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }));
  };

  const handleBack = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep((s) => s - 1);
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isLast) {
      handleComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleComplete = () => {
    const { gender, goal, gymType, experience, frequency } = answers;
    if (!goal || !gymType || !experience || !frequency) return;

    const resolvedGender: AIGender = gender === 'female' ? 'female' : 'male';

    const fullData: OnboardingData = {
      goal,
      gymType,
      experience,
      workoutDaysPerWeek: frequency,
      gender: resolvedGender,
      // Defaults for AI plan fields (refined later via full onboarding)
      age: 25,
      height: 170,
      weight: 70,
      dietaryRestrictions: [],
      recoveryLevel: 'moderate',
      sleepQuality: 'average',
      plateauHistory: undefined,
      strengthProfile: [],
      primaryStrengthFocus: undefined,
    };

    const result = classifySurveyLevel(fullData);
    setOnboardingData(fullData);
    setSurveyLevelResult(result);

    navigation.replace('AILevelResult', { entry: 'direct' });
  };

  const renderOptions = () => {
    switch (currentQuestion) {
      case 'gender':
        return GENDER_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={answers.gender === opt.value}
            onPress={() => handleSelect(opt.value)}
          />
        ));
      case 'goal':
        return GOAL_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={answers.goal === opt.value}
            onPress={() => handleSelect(opt.value)}
          />
        ));
      case 'gymType':
        return GYM_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={answers.gymType === opt.value}
            onPress={() => handleSelect(opt.value)}
          />
        ));
      case 'experience':
        return EXPERIENCE_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={answers.experience === opt.value}
            onPress={() => handleSelect(opt.value)}
          />
        ));
      case 'frequency':
        return FREQUENCY_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={answers.frequency === opt.value}
            onPress={() => handleSelect(opt.value)}
          />
        ));
    }
  };

  return (
    <AIFlowScreen
      header={
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: i <= step ? colors.accent : colors.border,
                    width: i === step ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      }
      contentContainerStyle={styles.content}
      footer={
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: canProceed ? colors.accent : colors.border }]}
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{isLast ? '결과 보기' : '다음'}</Text>
        </TouchableOpacity>
      }
    >
      <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
        {step + 1} / {QUESTIONS.length}
      </Text>
      <Text style={[styles.question, { color: colors.text }]}>
        {QUESTION_LABELS[currentQuestion]}
      </Text>
      <View style={styles.options}>{renderOptions()}</View>
    </AIFlowScreen>
  );
}

function OptionCard({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, typography } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.optionCard,
        {
          backgroundColor: selected ? colors.accentMuted : colors.card,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <Text
        style={[
          styles.optionLabel,
          { color: selected ? colors.accent : colors.text, fontFamily: typography.fontFamily },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stepDot: {
    height: 8,
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 24,
  },
  options: {
    gap: 10,
  },
  optionCard: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  nextBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
