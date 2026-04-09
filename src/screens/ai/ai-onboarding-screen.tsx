import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  saveOnboardingDataToSupabase,
  validateSafety,
} from '../../lib/ai-planner';
import { classifySurveyLevel } from '../../lib/ai-level-classifier';
import {
  AI_EXPERIENCE_LABEL,
  AIGoal,
  GymType,
  OnboardingData,
  StrengthEntry,
  normalizeExperience,
  useAIPlanStore,
} from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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

// ─── 1RM 계산기 모달 ────────────────────────────────────────────────────────────

function OneRMCalcModal({
  targetId,
  exerciseLabel,
  visible,
  onClose,
  onApply,
  colors,
}: {
  targetId: string | null;
  exerciseLabel: string;
  visible: boolean;
  onClose: () => void;
  onApply: (targetId: string, value: number) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 760;
  const [rmWeight, setRmWeight] = React.useState('');
  const [rmReps, setRmReps] = React.useState('');

  useEffect(() => {
    if (!visible) return;
    setRmWeight('');
    setRmReps('');
  }, [visible, targetId]);

  const w = parseFloat(rmWeight);
  const r = parseInt(rmReps, 10);
  const repsOver30 = !isNaN(r) && r > 30;
  const valid = w > 0 && r > 0 && r <= 30;
  const estimated = valid ? Math.round(w * (1 + r / 30)) : null;

  const handleClose = () => {
    setRmWeight('');
    setRmReps('');
    onClose();
  };

  const handleApply = () => {
    if (estimated === null || !targetId) return;
    onApply(targetId, estimated);
    setRmWeight('');
    setRmReps('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingHorizontal: isCompact ? 16 : 24,
                paddingTop: 24,
                paddingBottom: 44,
              }}
            >
              {/* 핸들바 */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {exerciseLabel} 1RM 계산기
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                Epley 공식: 무게 × (1 + 횟수 / 30)
              </Text>

              {/* 입력 행 */}
              <View
                style={{
                  flexDirection: isCompact ? 'column' : 'row',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TextInput
                    style={{
                      fontSize: isCompact ? 24 : 28,
                      fontWeight: '700',
                      color: colors.text,
                      borderBottomWidth: 2,
                      borderBottomColor: colors.border,
                      textAlign: 'center',
                      width: '100%',
                      paddingVertical: 6,
                    }}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    inputMode="decimal"
                    placeholder="무게"
                    placeholderTextColor={colors.textSecondary}
                    value={rmWeight}
                    onChangeText={t => setRmWeight(sanitizeDecimalInput(t))}
                    maxLength={6}
                  />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>kg</Text>
                </View>
                {!isCompact && <Text style={{ fontSize: 28, color: colors.textSecondary, paddingTop: 8 }}>×</Text>}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TextInput
                    style={{
                      fontSize: isCompact ? 24 : 28,
                      fontWeight: '700',
                      color: colors.text,
                      borderBottomWidth: 2,
                      borderBottomColor: colors.border,
                      textAlign: 'center',
                      width: '100%',
                      paddingVertical: 6,
                    }}
                    keyboardType="numeric"
                    placeholder="횟수"
                    placeholderTextColor={colors.textSecondary}
                    value={rmReps}
                    onChangeText={t => setRmReps(t.replace(/[^0-9]/g, ''))}
                    maxLength={2}
                  />
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>회</Text>
                </View>
              </View>

              {/* 경고 */}
              {repsOver30 && (
                <Text style={{ fontSize: 13, color: '#ff4444', textAlign: 'center', marginBottom: 12 }}>
                  횟수는 1~30 사이로 입력해주세요
                </Text>
              )}

              {/* 추정 1RM */}
              <Text
                style={{
                  fontSize: isCompact ? 20 : 22,
                  fontWeight: '700',
                  color: estimated !== null ? colors.accent : colors.textSecondary,
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                {estimated !== null ? `추정 1RM: ${estimated} kg` : '무게와 횟수를 입력하세요'}
              </Text>

              {/* 버튼 */}
              <TouchableOpacity
                style={{ backgroundColor: estimated !== null ? colors.accent : colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
                onPress={handleApply}
                disabled={estimated === null}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>이 값으로 입력</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }} onPress={handleClose}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── 질문 정의 ─────────────────────────────────────────────────────────────────

type QuestionOption = { label: string; value: string };
type AnswerKey = keyof OnboardingData | 'optionalStrengthConsent';
type Question = {
  key: keyof OnboardingData;
  question: string;
  options?: QuestionOption[];
  type: 'single' | 'multi' | 'number';
  unit?: string;
  placeholder?: string;
  showWhen?: (answers: Partial<Record<AnswerKey, string | string[]>>) => boolean;
};

const QUESTIONS: Question[] = [
  {
    key: 'goal',
    question: '주요 목표가 무엇인가요?',
    type: 'single',
    options: [
      { label: '다이어트', value: 'weight_loss' },
      { label: '벌크업', value: 'muscle_gain' },
      { label: '린매스업', value: 'lean_bulk' },
      { label: '스트렝스 강화', value: 'strength_gain' },
      { label: '체중 유지', value: 'maintenance' },
    ],
  },
  {
    key: 'primaryStrengthFocus',
    question: '어떤 리프트의 근력 향상이 가장 중요하신가요?',
    type: 'single',
    showWhen: (answers) => answers.goal === 'strength_gain',
    options: [
      { label: '바벨 스쿼트', value: 'squat' },
      { label: '벤치프레스', value: 'bench' },
      { label: '컨벤셔널 데드리프트', value: 'deadlift' },
      { label: '전신 균형', value: 'balanced' },
    ],
  },
  {
    key: 'experience',
    question: '운동 경험이 어느 정도인가요?',
    type: 'single',
    options: [
      { label: AI_EXPERIENCE_LABEL.beginner, value: 'beginner' },
      { label: AI_EXPERIENCE_LABEL.novice, value: 'novice' },
      { label: AI_EXPERIENCE_LABEL.intermediate, value: 'intermediate' },
      { label: AI_EXPERIENCE_LABEL.upper_intermediate, value: 'upper_intermediate' },
      { label: AI_EXPERIENCE_LABEL.advanced, value: 'advanced' },
    ],
  },
  {
    key: 'workoutDaysPerWeek',
    question: '주당 운동할 수 있는 날은 며칠인가요?',
    type: 'single',
    options: [
      { label: '주 2일', value: '2' },
      { label: '주 3일', value: '3' },
      { label: '주 4일', value: '4' },
      { label: '주 5일', value: '5' },
      { label: '주 6일', value: '6' },
    ],
  },
  {
    key: 'gymType',
    question: '주로 어떤 환경에서 운동하시나요?',
    type: 'single',
    options: [
      { label: '헬스장 (Full Gym)', value: 'full_gym' },
      { label: '홈짐 / 파워랙', value: 'garage_gym' },
      { label: '덤벨·케틀벨만', value: 'dumbbell_only' },
      { label: '맨몸 운동', value: 'bodyweight' },
    ],
  },
  {
    key: 'dietaryRestrictions',
    question: '식이 제한이 있나요? (여러 개 선택 가능)',
    type: 'multi',
    options: [
      { label: '없음', value: 'none' },
      { label: '채식 (고기 제외)', value: '채식' },
      { label: '유제품 제외', value: '유제품 제외' },
      { label: '글루텐 제외', value: '글루텐 제외' },
    ],
  },
  {
    key: 'recoveryLevel',
    question: '운동 다음 날 몸 상태는 어떤가요?',
    type: 'single',
    options: [
      { label: '거뜬해요', value: 'easy' },
      { label: '약간 뻐근해요', value: 'moderate' },
      { label: '많이 힘들어요', value: 'hard' },
    ],
  },
  {
    key: 'overeatingHabit',
    question: '배가 고프지 않아도 습관적으로 먹는 편인가요?',
    type: 'single',
    options: [
      { label: '거의 없어요', value: 'rarely' },
      { label: '가끔 있어요', value: 'sometimes' },
      { label: '자주 있어요', value: 'often' },
    ],
  },
  {
    key: 'sleepQuality',
    question: '일어났을 때 피로가 회복된 느낌인가요?',
    type: 'single',
    options: [
      { label: '대부분 회복돼요', value: 'good' },
      { label: '가끔 피곤해요', value: 'average' },
      { label: '거의 회복 안 돼요', value: 'poor' },
    ],
  },
  {
    key: 'plateauHistory',
    question: '운동이나 식단을 꾸준히 하다가\n막힌 적이 있나요?',
    type: 'single',
    options: [
      { label: '없어요', value: '없음' },
      { label: '식단 관리가 힘들었어요', value: '식단 유지 실패' },
      { label: '루틴이 지겨워졌어요', value: '운동 루틴 정체' },
      { label: '의욕이 떨어졌어요', value: '동기 부족' },
    ],
  },
];

function getVisibleQuestions(
  answers: Partial<Record<AnswerKey, string | string[]>>
): Question[] {
  return QUESTIONS.filter((question) => (question.showWhen ? question.showWhen(answers) : true));
}

const MAIN_EXERCISES = [
  { id: 'squat', label: '바벨 스쿼트' },
  { id: 'bench', label: '벤치프레스' },
  { id: 'deadlift', label: '컨벤셔널 데드리프트' },
  { id: 'ohp', label: '오버헤드프레스' },
  { id: 'row', label: '바벨로우' },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function AIOnboardingScreen() {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AIOnboarding'>>();
  const user = useAuthStore((s) => s.user);
  const { setOnboardingData, setSurveyLevelResult } =
    useAIPlanStore();
  const isCompact = width < 380 || height < 760;
  const horizontalPadding = isCompact ? 16 : 24;
  const scrollRef = useRef<ScrollView>(null);
  const strengthCardOffsets = useRef<Record<string, number>>({});

  const onboardingEntry = route.params?.entry ?? 'direct';
  const isSharedEntry = onboardingEntry === 'shared';
  const onboardingMode = route.params?.mode ?? 'default';
  const [step, setStep] = useState(0);
  const [strengthInputs, setStrengthInputs] = useState<Record<string, string>>({});
  const [rmCalcTarget, setRmCalcTarget] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<AnswerKey, string | string[]>>>({});
  const [showEquipmentSheet, setShowEquipmentSheet] = useState(false);
  const [equipmentStep, setEquipmentStep] = useState<'confirm' | 'select'>('confirm');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [showGoalInfo, setShowGoalInfo] = useState(false);

  const resetSurveyState = React.useCallback(() => {
    setStep(0);
    setStrengthInputs({});
    setRmCalcTarget(null);
    setAnswers({});
    setShowEquipmentSheet(false);
    setEquipmentStep('confirm');
    setSelectedEquipment([]);
    setShowGoalInfo(false);
    strengthCardOffsets.current = {};
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, []);

  useEffect(() => {
    const params = route.params;
    if (!params?.resetAt) return;
    resetSurveyState();
  }, [resetSurveyState, route.params]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('age, height_cm, weight_kg')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setAnswers((prev) => ({
            ...prev,
            ...(data.age       ? { age:    String(data.age) }       : {}),
            ...(data.height_cm ? { height: String(data.height_cm) } : {}),
            ...(data.weight_kg ? { weight: String(data.weight_kg) } : {}),
          }));
        }
      } catch {}
    })();
  }, [user?.id]);

  const visibleQuestions = getVisibleQuestions(answers);
  const isBodyProfileStep = step === 0;
  const questionStepCount = visibleQuestions.length;
  const isQuestionStep = step > 0 && step <= questionStepCount;
  const strengthConsentStepIndex = questionStepCount + 1;
  const wantsStrengthInput = answers.optionalStrengthConsent === 'yes';
  const isStrengthConsentStep = step === strengthConsentStepIndex;
  const isStrengthStep = step === strengthConsentStepIndex + 1 && wantsStrengthInput;
  const currentQuestion = isQuestionStep ? visibleQuestions[step - 1] : null;
  const totalSteps = 1 + questionStepCount + 1 + (wantsStrengthInput ? 1 : 0);
  const selectedGoal = answers.goal as AIGoal | undefined;
  const bodyProfileComplete =
    (answers.gender === 'male' || answers.gender === 'female') &&
    !!answers.age &&
    Number(answers.age) > 0 &&
    !!answers.height &&
    Number(answers.height) > 0 &&
    !!answers.weight &&
    Number(answers.weight) > 0;

  // ─── 단일 선택 ──────────────────────────────────────────────────────────────
  const handleSingleSelect = (value: string) => {
    if (isStrengthConsentStep) {
      setAnswers((prev) => ({ ...prev, optionalStrengthConsent: value }));
      return;
    }
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
  };

  // ─── 다중 선택 ──────────────────────────────────────────────────────────────
  const handleMultiSelect = (value: string) => {
    if (!currentQuestion) return;
    const key = currentQuestion.key;
    const current = (answers[key] as string[] | undefined) ?? [];

    if (value === 'none') {
      setAnswers((prev) => ({ ...prev, [key]: ['none'] }));
      return;
    }
    const withoutNone = current.filter((v) => v !== 'none');
    const next = withoutNone.includes(value)
      ? withoutNone.filter((v) => v !== value)
      : [...withoutNone, value];
    setAnswers((prev) => ({ ...prev, [key]: next.length > 0 ? next : ['none'] }));
  };

  // ─── 다음 스텝 ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (isBodyProfileStep) {
      setStep(1);
      return;
    }
    if (isStrengthConsentStep) {
      if (answers.optionalStrengthConsent === 'yes') {
        setStep((s) => s + 1);
      } else {
        handleFinish();
      }
      return;
    }
    if (isStrengthStep || step === totalSteps - 1) {
      handleFinish();
      return;
    }
    // gymType 답변 직후: 장비 세부 선택 시트 표시
    if (currentQuestion?.key === 'gymType') {
      setEquipmentStep('confirm');
      setShowEquipmentSheet(true);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleEquipmentClose = (list: string[]) => {
    if (list.length > 0) {
      setSelectedEquipment(list);
    }
    setShowEquipmentSheet(false);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (isStrengthStep) {
      setStep(strengthConsentStepIndex);
      return;
    }
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    if (isSharedEntry) {
      navigation.popToTop();
      return;
    }
    navigation.goBack();
  };

  const buildOnboardingPayload = (): OnboardingData => {
    const raw = answers;
    const goal = raw.goal as OnboardingData['goal'] | undefined;
    const gender = raw.gender as OnboardingData['gender'] | undefined;

    if (!goal || !gender) {
      throw new Error('Required onboarding answers are missing');
    }

    const restrictions =
      (raw.dietaryRestrictions as string[] | undefined)?.filter((v) => v !== 'none') ?? [];
    const shouldIncludeStrengthProfile = raw.optionalStrengthConsent === 'yes';
    const strengthProfile: StrengthEntry[] = !shouldIncludeStrengthProfile
      ? []
      : MAIN_EXERCISES
          .filter(ex => strengthInputs[ex.id] && Number(strengthInputs[ex.id]) > 0)
          .map(ex => ({ exercise: ex.label, weightKg: Number(strengthInputs[ex.id]) }));

    return {
      goal,
      ...(goal === 'strength_gain' && raw.primaryStrengthFocus
        ? { primaryStrengthFocus: raw.primaryStrengthFocus as OnboardingData['primaryStrengthFocus'] }
        : {}),
      gender,
      age: parseInt(String(raw.age ?? '0'), 10),
      height: parseFloat(String(raw.height ?? '0')),
      weight: parseFloat(String(raw.weight ?? '0')),
      experience: normalizeExperience(raw.experience),
      workoutDaysPerWeek: parseInt(String(raw.workoutDaysPerWeek ?? '3'), 10),
      gymType: (raw.gymType as GymType) ?? 'full_gym',
      ...(selectedEquipment.length > 0 ? { equipmentList: selectedEquipment } : {}),
      dietaryRestrictions: restrictions,
      ...(shouldIncludeStrengthProfile ? { strengthProfile } : {}),
      recoveryLevel: raw.recoveryLevel as OnboardingData['recoveryLevel'],
      overeatingHabit: raw.overeatingHabit as OnboardingData['overeatingHabit'],
      sleepQuality: raw.sleepQuality as OnboardingData['sleepQuality'],
      plateauHistory: raw.plateauHistory as string | undefined,
    };
  };

  // ─── 완료 및 유형 결과 ───────────────────────────────────────────────────────
  const handleFinish = async () => {
    let data: OnboardingData;
    try {
      data = buildOnboardingPayload();
    } catch {
      Alert.alert('입력 정보를 다시 확인해주세요', '필수 질문에 답변한 뒤 다시 진행해주세요.');
      return;
    }

    // 안전 검증
    const safety = validateSafety(data);
    if (safety.blocked) {
      Alert.alert(
        'AI 플랜을 생성할 수 없습니다',
        safety.message ?? '목표를 조정해주세요.',
        [{ text: '목표 수정하기', onPress: () => setStep(0) }]
      );
      return;
    }

    setOnboardingData(data);

    // 온보딩 데이터 Supabase 저장 (비동기, 결과 무시)
    if (user?.id && !user.isAnonymous) {
      saveOnboardingDataToSupabase(user.id, data).catch(() => {});
    }

    const levelResult = classifySurveyLevel(data);
    setSurveyLevelResult(levelResult);
    navigation.replace('AILevelResult', { entry: onboardingEntry, mode: onboardingMode });
  };

  const s = styles(colors, {
    horizontalPadding,
    isCompact,
  });

  const scrollToFocusedInput = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y, 0), animated: true });
    });
  };

  // ─── 신체 정보 입력 화면 ─────────────────────────────────────────────────────
  if (isBodyProfileStep) {
    return (
      <AIFlowScreen
        header={
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <View style={s.progressBar}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]} />
              ))}
            </View>
            <Text style={s.stepLabel}>
              {step + 1}/{totalSteps}
            </Text>
          </View>
        }
        scrollRef={scrollRef}
        keyboardVerticalOffset={16}
        contentContainerStyle={s.content}
        footer={
          <TouchableOpacity
            style={[s.primaryBtn, !bodyProfileComplete && s.btnDisabled]}
            onPress={handleNext}
            disabled={!bodyProfileComplete}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>다음</Text>
          </TouchableOpacity>
        }
      >
        <Text style={s.questionText}>
          {isSharedEntry ? '친구가 공유한 헬스 유형 테스트예요' : '기본 정보를 알려주세요'}
        </Text>
        <Text style={s.helperText}>
          {isSharedEntry
            ? '간단한 테스트로 내 운동 유형을 확인해볼 수 있어요. 답변은 몇 분 안에 끝나요.'
            : '테스트 결과와 추천 정확도를 높이기 위해 먼저 필요한 정보예요.'}
        </Text>
        <View style={s.genderRow}>
          {[
            { label: '남성', value: 'male' },
            { label: '여성', value: 'female' },
          ].map((option) => {
            const selected = answers.gender === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[s.genderBtn, selected && s.optionBtnSelected]}
                onPress={() => setAnswers((prev) => ({ ...prev, gender: option.value }))}
                activeOpacity={0.8}
              >
                <Text style={[s.optionText, selected && s.optionTextSelected]}>{option.label}</Text>
                {selected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={s.profileGrid}>
          {[
            { key: 'age', label: '나이', unit: '세', placeholder: '28' },
            { key: 'height', label: '키', unit: 'cm', placeholder: '170' },
            { key: 'weight', label: '몸무게', unit: 'kg', placeholder: '65' },
          ].map((field) => (
            <View key={field.key} style={s.profileField}>
              <Text style={s.profileLabel}>{field.label}</Text>
              <View style={s.profileInputRow}>
                <TextInput
                  style={[s.profileInput, { color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  value={String(answers[field.key as keyof typeof answers] ?? '')}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setAnswers((prev) => ({ ...prev, [field.key]: numeric }));
                  }}
                  onFocus={() => scrollToFocusedInput(160)}
                  maxLength={3}
                />
                <Text style={s.profileUnit}>{field.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </AIFlowScreen>
    );
  }

  // ─── 강도 프로필 입력 여부 선택 ──────────────────────────────────────────────
  if (isStrengthConsentStep) {
    const currentAnswer = answers.optionalStrengthConsent;
    const canProceed = currentAnswer === 'yes' || currentAnswer === 'no';

    return (
      <AIFlowScreen
        header={
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <View style={s.progressBar}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]} />
              ))}
            </View>
            <Text style={s.stepLabel}>
              {step + 1}/{totalSteps}
            </Text>
          </View>
        }
        contentContainerStyle={s.content}
        footer={
          <TouchableOpacity
            style={[s.primaryBtn, !canProceed && s.btnDisabled]}
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>
              {currentAnswer === 'yes' ? '중량 입력으로 이동' : '레벨 결과 보기'}
            </Text>
          </TouchableOpacity>
        }
      >
        <View style={s.phaseBadge}>
          <Text style={s.phaseBadgeText}>선택 입력</Text>
        </View>
        <Text style={s.questionText}>선택 입력이에요.{'\n'}현재 사용 중량도 알려주실래요?</Text>
        <Text style={s.strengthIntroText}>
          모르거나 아직 입력하고 싶지 않다면 건너뛰셔도 괜찮아요.
        </Text>
        <View style={s.optionsWrap}>
          {[
            { label: '네, 입력할게요', value: 'yes' },
            { label: '아니요, 건너뛸게요', value: 'no' },
          ].map((option) => {
            const selected = currentAnswer === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[s.optionBtn, selected && s.optionBtnSelected]}
                onPress={() => handleSingleSelect(option.value)}
                activeOpacity={0.8}
              >
                <Text style={[s.optionText, selected && s.optionTextSelected]}>{option.label}</Text>
                {selected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </AIFlowScreen>
    );
  }

  // ─── 강도 프로필 입력 화면 ────────────────────────────────────────────────────
  if (isStrengthStep) {
    return (
      <AIFlowScreen
        header={
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <View style={s.progressBar}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]} />
              ))}
            </View>
            <Text style={s.stepLabel}>
              {step + 1}/{totalSteps}
            </Text>
          </View>
        }
        scrollRef={scrollRef}
        keyboardVerticalOffset={16}
        contentContainerStyle={[s.content, s.strengthContent]}
        footerStyle={s.strengthFooter}
        footer={
          <TouchableOpacity style={s.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>레벨 결과 보기</Text>
          </TouchableOpacity>
        }
      >
        <View style={s.phaseBadge}>
          <Text style={s.phaseBadgeText}>선택 입력</Text>
        </View>
        <Text style={s.questionText}>선택 입력이에요.{'\n'}아는 만큼만 현재 사용 중량을 적어주세요</Text>
        <Text style={s.strengthIntroText}>
          정확하지 않아도 괜찮아요. 모르겠다면 비워두고 넘어가도 돼요.{'\n'}
          1RM을 모르면 오른쪽 계산기로 간단히 입력할 수 있어요.
        </Text>
        <OneRMCalcModal
          targetId={rmCalcTarget}
          exerciseLabel={MAIN_EXERCISES.find(ex => ex.id === rmCalcTarget)?.label ?? ''}
          visible={rmCalcTarget !== null}
          onClose={() => setRmCalcTarget(null)}
          onApply={(targetId, value) => {
            setStrengthInputs(prev => ({ ...prev, [targetId]: String(value) }));
            setRmCalcTarget(null);
          }}
          colors={colors}
        />
        <View style={s.strengthList}>
          {MAIN_EXERCISES.map(ex => (
            <View
              key={ex.id}
              style={s.strengthRow}
              onLayout={(event) => {
                strengthCardOffsets.current[ex.id] = event.nativeEvent.layout.y;
              }}
            >
              <Text style={s.strengthName}>{ex.label}</Text>
              <View style={s.strengthValueGroup}>
                <TextInput
                  style={[s.strengthInputCompact, { color: colors.text, borderColor: colors.border }]}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  inputMode="decimal"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={strengthInputs[ex.id] ?? ''}
                  onChangeText={text => {
                    setStrengthInputs(prev => ({ ...prev, [ex.id]: sanitizeDecimalInput(text) }));
                  }}
                  onFocus={() => scrollToFocusedInput((strengthCardOffsets.current[ex.id] ?? 0) - 24)}
                  maxLength={6}
                />
                <Text style={s.strengthUnitCompact}>kg</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRmCalcTarget(ex.id)}
                style={s.strengthCalcButtonCompact}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.strengthCalcButtonTextCompact}>1RM 계산</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </AIFlowScreen>
    );
  }

  if (!currentQuestion) return null;

  const currentAnswer = answers[currentQuestion.key];
  const isLastStep = step === totalSteps - 1;
  const hasAnswer =
    currentQuestion.type === 'single'
      ? !!currentAnswer
      : currentQuestion.type === 'multi'
      ? Array.isArray(currentAnswer) && currentAnswer.length > 0
      : !!currentAnswer && !isNaN(Number(currentAnswer)) && Number(currentAnswer) > 0;
  const canProceed = hasAnswer;

  // ─── 질문 화면 ──────────────────────────────────────────────────────────────
  return (
    <AIFlowScreen
      header={
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={s.progressBar}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[s.progressDot, i <= step && s.progressDotActive]}
              />
            ))}
          </View>
          <Text style={s.stepLabel}>
            {step + 1}/{totalSteps}
          </Text>
        </View>
      }
      scrollRef={scrollRef}
      keyboardVerticalOffset={16}
      contentContainerStyle={s.content}
      footer={
        <TouchableOpacity
          style={[s.primaryBtn, !canProceed && s.btnDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>
            {isLastStep ? '다음' : '다음'}
          </Text>
        </TouchableOpacity>
      }
    >

      <View style={currentQuestion.key === 'goal' ? s.questionHeader : undefined}>
        <Text style={[s.questionText, currentQuestion.key === 'goal' && s.questionTextCompact]}>
          {currentQuestion.question}
        </Text>
        {currentQuestion.key === 'goal' && (
          <TouchableOpacity
            style={s.infoButton}
            onPress={() => setShowGoalInfo(true)}
            activeOpacity={0.8}
          >
            <Text style={s.infoButtonText}>i</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentQuestion.key === 'primaryStrengthFocus' && selectedGoal === 'strength_gain' && (
        <Text style={[s.helperText, { color: colors.textSecondary }]}>
          우선순위 리프트를 알면 근력 강화 루틴을 더 정확하게 맞출 수 있어요.
        </Text>
      )}

      {currentQuestion.type === 'number' ? (
        <View style={s.numberInputWrap}>
          <TextInput
            style={[s.numberInput, { color: colors.text, borderColor: colors.border }]}
            keyboardType="numeric"
            placeholder={currentQuestion.placeholder}
            placeholderTextColor={colors.textSecondary}
            value={String(currentAnswer ?? '')}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              setAnswers((prev) => ({ ...prev, [currentQuestion.key]: numeric }));
            }}
            onFocus={() => scrollToFocusedInput(180)}
            maxLength={3}
            autoFocus
          />
          {currentQuestion.unit && (
            <Text style={[s.numberUnit, { color: colors.textSecondary }]}>
              {currentQuestion.unit}
            </Text>
          )}
        </View>
      ) : (
        <View style={s.optionsWrap}>
          {currentQuestion.options?.map((opt) => {
            const selected =
              currentQuestion.type === 'single'
                ? currentAnswer === opt.value
                : Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);

            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.optionBtn, selected && s.optionBtnSelected]}
                onPress={() =>
                  currentQuestion.type === 'single'
                    ? handleSingleSelect(opt.value)
                    : handleMultiSelect(opt.value)
                }
                activeOpacity={0.8}
              >
                <Text style={[s.optionText, selected && s.optionTextSelected]}>
                  {opt.label}
                </Text>
                {selected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal
        visible={showGoalInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowGoalInfo(false)}>
          <View style={s.infoModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={s.infoModalCard}>
                <Text style={s.infoModalTitle}>목표 설명</Text>
                <View style={s.infoList}>
                  <Text style={s.infoListItem}>다이어트: 체지방 감량을 우선하는 목표예요.</Text>
                  <Text style={s.infoListItem}>벌크업: 근육 증가를 위해 체중 증가를 어느 정도 허용해요.</Text>
                  <Text style={s.infoListItem}>린매스업: 체지방 증가를 최소화하며 근육을 늘려요.</Text>
                  <Text style={s.infoListItem}>스트렝스 강화: 중량과 수행 능력 향상에 집중해요.</Text>
                  <Text style={s.infoListItem}>체중 유지: 현재 체형과 컨디션을 안정적으로 유지해요.</Text>
                </View>
                <TouchableOpacity style={s.sheetPrimaryButton} onPress={() => setShowGoalInfo(false)}>
                  <Text style={s.sheetPrimaryButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── EquipmentDetailSheet ────────────────────────────────────────── */}
      <Modal
        visible={showEquipmentSheet}
        transparent
        animationType="slide"
        onRequestClose={() => handleEquipmentClose([])}
      >
        <TouchableWithoutFeedback onPress={() => handleEquipmentClose([])}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={s.sheetContainer}>
                {/* 핸들바 */}
                <View style={s.sheetHandle} />

                {equipmentStep === 'confirm' ? (
                  <>
                    <Text style={s.sheetTitle}>
                      세부 장비를 지정할까요?
                    </Text>
                    <Text style={s.sheetSubtitle}>
                      보유 장비를 직접 선택하면 해당 장비로 가능한 종목만 추천됩니다.
                    </Text>
                    <TouchableOpacity
                      style={s.sheetPrimaryButton}
                      onPress={() => setEquipmentStep('select')}
                    >
                      <Text style={s.sheetPrimaryButtonText}>네, 직접 선택할게요</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.sheetSecondaryAction}
                      onPress={() => handleEquipmentClose([])}
                    >
                      <Text style={s.sheetSecondaryActionText}>아니요, 기본으로 진행</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={s.sheetTitle}>
                      보유 장비 선택
                    </Text>
                    <Text style={s.sheetCaption}>
                      사용 가능한 장비를 모두 선택하세요
                    </Text>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={s.sheetScroll}
                      contentContainerStyle={s.sheetScrollContent}
                    >
                      {[
                        { category: '프리웨이트', items: ['덤벨', '케틀벨', '바벨', 'EZ바', '트랩바'] },
                        { category: '랙·벤치', items: ['스쿼트랙', '플랫벤치', '인클라인벤치', '풀업바'] },
                        { category: '케이블·머신', items: ['케이블 크로스오버', '랫풀다운', '로우케이블', '렉프레스', '레그익스텐션', '레그컬'] },
                      ].map(({ category, items }) => (
                        <View key={category} style={s.sheetCategory}>
                          <Text style={s.sheetCategoryTitle}>
                            {category}
                          </Text>
                          <View style={s.sheetChipWrap}>
                            {items.map((item) => {
                              const selected = selectedEquipment.includes(item);
                              return (
                                <TouchableOpacity
                                  key={item}
                                  onPress={() =>
                                    setSelectedEquipment((prev) =>
                                      prev.includes(item)
                                        ? prev.filter((e) => e !== item)
                                        : [...prev, item]
                                    )
                                  }
                                  style={[
                                    s.sheetChip,
                                    {
                                      borderColor: selected ? colors.accent : colors.border,
                                      backgroundColor: selected ? colors.accentMuted : 'transparent',
                                    },
                                  ]}
                                >
                                  <Text style={[s.sheetChipText, { color: selected ? colors.accent : colors.text }]}>
                                    {item}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    <View style={s.sheetFooter}>
                      <TouchableOpacity
                        style={s.sheetPrimaryButton}
                        onPress={() => handleEquipmentClose(selectedEquipment)}
                      >
                        <Text style={s.sheetPrimaryButtonText}>
                          완료 {selectedEquipment.length > 0 ? `(${selectedEquipment.length}개 선택)` : ''}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </AIFlowScreen>
  );
}

const styles = (
  colors: ReturnType<typeof useAppTheme>['colors'],
  layout: { horizontalPadding: number; isCompact: boolean }
) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 12,
    },
    backBtn: {
      padding: 8,
    },
    backText: {
      fontSize: 20,
      color: colors.text,
    },
    progressBar: {
      flex: 1,
      flexDirection: 'row',
      gap: 4,
    },
    progressDot: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    progressDotActive: {
      backgroundColor: colors.accent,
    },
    stepLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      minWidth: 36,
      textAlign: 'right',
    },
    content: {
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: layout.isCompact ? 16 : 20,
      paddingBottom: 24,
    },
    strengthContent: {
      paddingBottom: layout.isCompact ? 96 : 112,
    },
    phaseBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentMuted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 16,
    },
    phaseBadgeText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    questionText: {
      fontSize: layout.isCompact ? 20 : 22,
      fontWeight: '700',
      color: colors.text,
      lineHeight: layout.isCompact ? 28 : 30,
      marginBottom: layout.isCompact ? 24 : 28,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    questionTextCompact: {
      flex: 1,
      marginBottom: layout.isCompact ? 20 : 24,
    },
    infoButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    infoButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    helperText: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: -10,
      marginBottom: 20,
    },
    strengthIntroText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 22,
    },
    optionsWrap: {
      gap: 12,
    },
    genderRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 18,
    },
    genderBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: layout.isCompact ? 16 : 20,
      paddingVertical: layout.isCompact ? 16 : 18,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    profileGrid: {
      gap: 14,
    },
    profileField: {
      gap: 8,
    },
    profileLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    profileInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: '700',
      borderBottomWidth: 2,
      paddingVertical: 8,
    },
    profileUnit: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 36,
    },
    numberInputWrap: {
      flexDirection: layout.isCompact ? 'column' : 'row',
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      gap: layout.isCompact ? 8 : 12,
      marginTop: 8,
    },
    numberInput: {
      flex: layout.isCompact ? 0 : 1,
      width: layout.isCompact ? '100%' : undefined,
      fontSize: layout.isCompact ? 28 : 32,
      fontWeight: '700',
      borderBottomWidth: 2,
      paddingVertical: 8,
      textAlign: layout.isCompact ? 'left' : 'center',
    },
    numberUnit: {
      fontSize: layout.isCompact ? 16 : 20,
      fontWeight: '600',
      minWidth: layout.isCompact ? 0 : 40,
    },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: layout.isCompact ? 16 : 20,
      paddingVertical: layout.isCompact ? 16 : 18,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    optionBtnSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      lineHeight: 22,
      marginRight: 12,
    },
    optionTextSelected: {
      color: colors.accent,
      fontWeight: '600',
    },
    checkmark: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '700',
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
    },
    btnDisabled: {
      opacity: 0.4,
    },
    primaryBtnText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#fff',
    },
    // Phase 2 separator
    separatorContent: {
      flex: 1,
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: layout.isCompact ? 32 : 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separatorIcon: {
      fontSize: 52,
      marginBottom: 20,
    },
    separatorTitle: {
      fontSize: layout.isCompact ? 22 : 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    separatorDesc: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    skipBtn: {
      marginTop: 16,
      paddingVertical: 8,
    },
    centeredSkipBtn: {
      alignItems: 'center',
    },
    skipText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    centeredSkipText: {
      textAlign: 'center',
      lineHeight: 20,
    },
    strengthFooter: {
      paddingTop: 14,
    },
    strengthList: {
      gap: 12,
    },
    strengthRow: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: layout.isCompact ? 12 : 14,
      paddingVertical: layout.isCompact ? 12 : 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    strengthName: {
      color: colors.text,
      fontSize: layout.isCompact ? 14 : 15,
      fontWeight: '600',
      flex: 1,
    },
    strengthValueGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    strengthInputCompact: {
      width: layout.isCompact ? 68 : 76,
      fontSize: 18,
      fontWeight: '700',
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      textAlign: 'right',
      backgroundColor: colors.background,
    },
    strengthUnitCompact: {
      color: colors.textSecondary,
      fontSize: 13,
      minWidth: 24,
    },
    strengthCalcButtonCompact: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    strengthCalcButtonTextCompact: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    sheetContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: layout.horizontalPadding,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 20,
      maxHeight: '85%',
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    sheetSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 28,
      lineHeight: 20,
    },
    sheetCaption: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    sheetScroll: {
      flexGrow: 0,
      marginBottom: 12,
    },
    sheetScrollContent: {
      paddingBottom: 8,
    },
    sheetCategory: {
      marginBottom: 16,
    },
    sheetCategoryTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    sheetChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    sheetChipText: {
      fontSize: 14,
    },
    sheetFooter: {
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sheetPrimaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    sheetPrimaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    sheetSecondaryAction: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    sheetSecondaryActionText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    infoModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      paddingHorizontal: layout.horizontalPadding,
    },
    infoModalCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: 24,
      gap: 18,
    },
    infoModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    infoList: {
      gap: 10,
    },
    infoListItem: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
  });
