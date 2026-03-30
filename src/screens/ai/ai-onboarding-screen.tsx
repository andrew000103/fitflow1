import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { AILoadingScreen } from '../../components/ai/AILoadingScreen';
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
  buildWorkoutHistorySection,
  fetchUserHistorySummary,
  generateAIPlan,
  saveAIPlanToSupabase,
  saveOnboardingDataToSupabase,
  validateSafety,
} from '../../lib/ai-planner';
import { GymType, OnboardingData, StrengthEntry, useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── 1RM 계산기 모달 ────────────────────────────────────────────────────────────

function OneRMCalcModal({
  exerciseLabel,
  visible,
  onClose,
  onApply,
  colors,
}: {
  exerciseLabel: string;
  visible: boolean;
  onClose: () => void;
  onApply: (value: number) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 380 || height < 760;
  const [rmWeight, setRmWeight] = React.useState('');
  const [rmReps, setRmReps] = React.useState('');

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
    if (estimated === null) return;
    onApply(estimated);
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
                    keyboardType="numeric"
                    placeholder="무게"
                    placeholderTextColor={colors.textSecondary}
                    value={rmWeight}
                    onChangeText={t => setRmWeight(t.replace(/[^0-9.]/g, ''))}
                    maxLength={5}
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
type Question = {
  key: keyof OnboardingData;
  question: string;
  options?: QuestionOption[];
  type: 'single' | 'multi' | 'number';
  phase: 1 | 2;
  unit?: string;
  placeholder?: string;
};

const QUESTIONS: Question[] = [
  // Phase 1
  {
    key: 'goal',
    question: '주요 목표가 무엇인가요?',
    type: 'single',
    phase: 1,
    options: [
      { label: '체중 감량', value: 'weight_loss' },
      { label: '근육 증가 (벌크업)', value: 'muscle_gain' },
      { label: '체형 유지', value: 'maintenance' },
      { label: '건강 개선', value: 'health' },
    ],
  },
  {
    key: 'gender',
    question: '성별을 선택해주세요',
    type: 'single',
    phase: 1,
    options: [
      { label: '남성', value: 'male' },
      { label: '여성', value: 'female' },
      { label: '밝히지 않음', value: 'undisclosed' },
    ],
  },
  {
    key: 'age',
    question: '나이를 입력해주세요',
    type: 'number',
    phase: 1,
    unit: '세',
    placeholder: '예: 28',
  },
  {
    key: 'height',
    question: '키를 입력해주세요',
    type: 'number',
    phase: 1,
    unit: 'cm',
    placeholder: '예: 170',
  },
  {
    key: 'weight',
    question: '현재 체중을 입력해주세요',
    type: 'number',
    phase: 1,
    unit: 'kg',
    placeholder: '예: 65',
  },
  {
    key: 'experience',
    question: '운동 경험이 어느 정도인가요?',
    type: 'single',
    phase: 1,
    options: [
      { label: '입문 (0~6개월)', value: 'beginner' },
      { label: '초급~중급 (6개월~2년)', value: 'intermediate' },
      { label: '중급 이상 (2년+)', value: 'advanced' },
    ],
  },
  {
    key: 'workoutDaysPerWeek',
    question: '주당 운동할 수 있는 날은 며칠인가요?',
    type: 'single',
    phase: 1,
    options: [
      { label: '1~2일', value: '2' },
      { label: '3일', value: '3' },
      { label: '4일', value: '4' },
      { label: '5일 이상', value: '5' },
    ],
  },
  {
    key: 'gymType',
    question: '주로 어떤 환경에서 운동하시나요?',
    type: 'single',
    phase: 1,
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
    phase: 1,
    options: [
      { label: '없음', value: 'none' },
      { label: '채식 (고기 제외)', value: '채식' },
      { label: '유제품 제외', value: '유제품 제외' },
      { label: '글루텐 제외', value: '글루텐 제외' },
    ],
  },
  // Phase 2
  {
    key: 'recoveryLevel',
    question: '운동 다음 날 몸 상태는 어떤가요?',
    type: 'single',
    phase: 2,
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
    phase: 2,
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
    phase: 2,
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
    phase: 2,
    options: [
      { label: '없어요', value: '없음' },
      { label: '식단 관리가 힘들었어요', value: '식단 유지 실패' },
      { label: '루틴이 지겨워졌어요', value: '운동 루틴 정체' },
      { label: '의욕이 떨어졌어요', value: '동기 부족' },
    ],
  },
];

const PHASE1_COUNT = QUESTIONS.filter((q) => q.phase === 1).length;

const MAIN_EXERCISES = [
  { id: 'squat', label: '스쿼트' },
  { id: 'bench', label: '벤치프레스' },
  { id: 'deadlift', label: '데드리프트' },
  { id: 'ohp', label: '오버헤드프레스' },
  { id: 'row', label: '바벨로우' },
];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function AIOnboardingScreen() {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const { setOnboardingData, setCurrentPlan, setGenerating, setError } =
    useAIPlanStore();
  const isCompact = width < 380 || height < 760;
  const horizontalPadding = isCompact ? 16 : 24;
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [skippedPhase2, setSkippedPhase2] = useState(false);
  const [passedSeparator, setPassedSeparator] = useState(false);
  const [passedStrengthStep, setPassedStrengthStep] = useState(false);
  const [strengthSkipped, setStrengthSkipped] = useState(false);
  const [strengthInputs, setStrengthInputs] = useState<Record<string, string>>({});
  const [rmCalcTarget, setRmCalcTarget] = useState<string | null>(null);
  const [generating, setLocalGenerating] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [answers, setAnswers] = useState<Partial<Record<keyof OnboardingData, string | string[]>>>({});
  const [showEquipmentSheet, setShowEquipmentSheet] = useState(false);
  const [equipmentStep, setEquipmentStep] = useState<'confirm' | 'select'>('confirm');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

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

  const handleNavigate = () => {
    navigation.replace('AIPlanResult', {});
  };

  const isPhase2Separator = step === PHASE1_COUNT && !skippedPhase2 && !passedSeparator;
  const isStrengthStep = passedSeparator && !passedStrengthStep && !skippedPhase2;
  const visibleQuestions = skippedPhase2
    ? QUESTIONS.filter((q) => q.phase === 1)
    : QUESTIONS;
  const currentQuestion = (isPhase2Separator || isStrengthStep) ? null : visibleQuestions[step];
  const totalSteps = visibleQuestions.length;

  // ─── 단일 선택 ──────────────────────────────────────────────────────────────
  const handleSingleSelect = (value: string) => {
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
    // 마지막 질문이면 항상 플랜 생성 (gymType 인터셉트보다 우선)
    if (step === totalSteps - 1) {
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
      setAnswers((prev) => ({ ...prev, equipmentList: list }));
    }
    setShowEquipmentSheet(false);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const handleSkipPhase2 = () => {
    setSkippedPhase2(true);
    handleFinish(true);
  };

  // ─── 완료 및 플랜 생성 ───────────────────────────────────────────────────────
  const handleFinish = async (skipPhase2 = false) => {
    // 답변 조립
    const raw = answers;
    const restrictions =
      (raw.dietaryRestrictions as string[] | undefined)?.filter((v) => v !== 'none') ?? [];

    // strengthSkipped=true면 명시적 빈 배열(보수적 프롬프트 트리거)
    const strengthProfile: StrengthEntry[] = strengthSkipped
      ? []
      : MAIN_EXERCISES
          .filter(ex => strengthInputs[ex.id] && Number(strengthInputs[ex.id]) > 0)
          .map(ex => ({ exercise: ex.label, weightKg: Number(strengthInputs[ex.id]) }));

    const data: OnboardingData = {
      goal: (raw.goal as OnboardingData['goal']) ?? 'health',
      gender: (raw.gender as OnboardingData['gender']) ?? 'undisclosed',
      age: parseInt(String(raw.age ?? '0'), 10),
      height: parseFloat(String(raw.height ?? '0')),
      weight: parseFloat(String(raw.weight ?? '0')),
      experience: (raw.experience as OnboardingData['experience']) ?? 'beginner',
      workoutDaysPerWeek: parseInt(String(raw.workoutDaysPerWeek ?? '3'), 10),
      gymType: (raw.gymType as GymType) ?? 'full_gym',
      ...(selectedEquipment.length > 0 ? { equipmentList: selectedEquipment } : {}),
      dietaryRestrictions: restrictions,
      // Phase 2를 통과한 경우 항상 strengthProfile 포함 ([] = 보수적 지시)
      ...(skipPhase2 ? {} : { strengthProfile }),
      ...(skipPhase2
        ? {}
        : {
            recoveryLevel: raw.recoveryLevel as OnboardingData['recoveryLevel'],
            overeatingHabit: raw.overeatingHabit as OnboardingData['overeatingHabit'],
            sleepQuality: raw.sleepQuality as OnboardingData['sleepQuality'],
            plateauHistory: raw.plateauHistory as string | undefined,
          }),
    };

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
    setLocalGenerating(true);
    setGenerating(true);

    // 온보딩 데이터 Supabase 저장 (비동기, 결과 무시)
    if (user?.id) {
      saveOnboardingDataToSupabase(user.id, data).catch(() => {});
    }

    try {
      const history = user?.id ? await fetchUserHistorySummary(user.id) : null;

      // 신규: AI 재생성 시 최근 운동 히스토리 주입 (FR-5)
      let workoutHistorySection = '';
      if (user?.id) {
        const existingPlan = useAIPlanStore.getState().currentPlan;
        if (existingPlan) {
          workoutHistorySection = await buildWorkoutHistorySection(user.id, existingPlan);
        }
      }

      const plan = await generateAIPlan(data, history, workoutHistorySection);
      setCurrentPlan(plan);

      // Supabase 저장 (비동기, 결과 무시)
      if (user?.id) {
        saveAIPlanToSupabase(user.id, plan, data).catch(() => {});
      }

      setPlanReady(true); // AILoadingScreen이 onComplete()를 호출해 결과 화면으로 이동
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 플랜 생성에 실패했습니다.';
      setError(msg);
      setLocalGenerating(false);
      setGenerating(false);
      // skippedPhase2=true 상태에서 실패하면 step=9가 blank screen이 되므로 separator로 복원
      if (skipPhase2) {
        setSkippedPhase2(false);
        setStep(PHASE1_COUNT);
      }
      Alert.alert('오류', msg, [
        { text: '다시 시도', onPress: () => handleFinish(skipPhase2) },
        { text: '취소', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const s = styles(colors, {
    horizontalPadding,
    isCompact,
  });

  const scrollToFocusedInput = (y: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  // ─── 로딩 화면 ──────────────────────────────────────────────────────────────
  if (generating) {
    return (
      <AIFlowScreen scroll={false}>
        <AILoadingScreen isComplete={planReady} onComplete={handleNavigate} />
      </AIFlowScreen>
    );
  }

  // ─── Phase 2 구분선 ──────────────────────────────────────────────────────────
  if (isPhase2Separator) {
    return (
      <AIFlowScreen
        scroll={false}
        header={
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
          </View>
        }
        bodyStyle={s.separatorContent}
        footer={
          <>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => setPassedSeparator(true)}
            >
              <Text style={s.primaryBtnText}>계속 입력하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.skipBtn} onPress={handleSkipPhase2}>
              <Text style={s.skipText}>건너뛰고 플랜 받기</Text>
            </TouchableOpacity>
          </>
        }
      >
          <Text style={s.separatorIcon}>💡</Text>
          <Text style={s.separatorTitle}>선택 사항</Text>
          <Text style={s.separatorDesc}>
            다음 질문을 추가로 답해주시면{'\n'}AI 플랜의 정확도가 더 높아집니다.
          </Text>
      </AIFlowScreen>
    );
  }

  // ─── 강도 프로필 입력 화면 ────────────────────────────────────────────────────
  if (isStrengthStep) {
    return (
      <AIFlowScreen
        header={
          <View style={s.header}>
            <TouchableOpacity onPress={() => setPassedSeparator(false)} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
          </View>
        }
        scrollRef={scrollRef}
        keyboardVerticalOffset={16}
        contentContainerStyle={s.content}
        footer={
          <>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setPassedStrengthStep(true)} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>다음</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => { setStrengthSkipped(true); setPassedStrengthStep(true); }}
              activeOpacity={0.85}
            >
              <Text style={s.skipText}>모르면 건너뛰기 (맨몸 기준으로 설정)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.skipBtn, { marginTop: 2 }]} onPress={handleSkipPhase2}>
              <Text style={[s.skipText, { fontSize: 13 }]}>건너뛰고 플랜 받기</Text>
            </TouchableOpacity>
          </>
        }
      >
          <View style={s.phaseBadge}>
            <Text style={s.phaseBadgeText}>선택 질문</Text>
          </View>
          <Text style={s.questionText}>주요 운동의 현재{'\n'}사용 중량을 알려주세요</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
            입력하신 중량을 바탕으로 AI가 더 정확한 운동 중량을 설정합니다.{'\n'}모르는 항목은 비워두세요.
          </Text>
          <OneRMCalcModal
            exerciseLabel={MAIN_EXERCISES.find(ex => ex.id === rmCalcTarget)?.label ?? ''}
            visible={rmCalcTarget !== null}
            onClose={() => setRmCalcTarget(null)}
            onApply={value => {
              if (rmCalcTarget) {
                setStrengthInputs(prev => ({ ...prev, [rmCalcTarget]: String(value) }));
              }
              setRmCalcTarget(null);
            }}
            colors={colors}
          />
          <View style={s.strengthList}>
            {MAIN_EXERCISES.map(ex => (
              <View key={ex.id} style={s.strengthCard}>
                <Text style={s.strengthLabel}>{ex.label}</Text>
                <View style={s.strengthInputRow}>
                  <View style={s.strengthInputWrap}>
                    <Text style={s.strengthInputHint}>현재 사용 중량</Text>
                    <View style={s.strengthInputInner}>
                      <TextInput
                        style={[s.numberInput, s.strengthInput, { color: colors.text, borderColor: colors.border }]}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        value={strengthInputs[ex.id] ?? ''}
                        onChangeText={text => {
                          const numeric = text.replace(/[^0-9]/g, '');
                          setStrengthInputs(prev => ({ ...prev, [ex.id]: numeric }));
                        }}
                        onFocus={() => scrollToFocusedInput(260)}
                        maxLength={4}
                      />
                      <Text style={s.strengthUnit}>kg</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setRmCalcTarget(ex.id)}
                  style={s.rmButton}
                  activeOpacity={0.7}
                >
                  <Text style={s.rmButtonText}>1RM 계산기로 입력하기</Text>
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
  // 마지막 스텝(Phase 2 선택 질문)은 답변 없어도 진행 가능
  const canProceed = isLastStep || hasAnswer;

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
            {step === totalSteps - 1 ? 'AI 플랜 생성하기' : '다음'}
          </Text>
        </TouchableOpacity>
      }
    >
        {currentQuestion.phase === 2 && (
          <View style={s.phaseBadge}>
            <Text style={s.phaseBadgeText}>선택 질문</Text>
          </View>
        )}

        <Text style={s.questionText}>{currentQuestion.question}</Text>

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
    optionsWrap: {
      gap: 12,
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
    skipText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    strengthList: {
      gap: 16,
    },
    strengthCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: layout.isCompact ? 14 : 16,
      gap: 12,
    },
    strengthLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    strengthInputRow: {
      minHeight: 0,
    },
    strengthInputWrap: {
      width: '100%',
    },
    strengthInputHint: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 6,
    },
    strengthInputInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    strengthInput: {
      fontSize: 22,
      width: undefined,
      textAlign: 'left',
      flex: 1,
    },
    strengthUnit: {
      color: colors.textSecondary,
      fontSize: 15,
      minWidth: 24,
    },
    rmButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentMuted,
    },
    rmButtonText: {
      fontSize: 13,
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
  });
