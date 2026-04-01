import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AILoadingScreen } from '../../components/ai/AILoadingScreen';
import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import {
  buildWorkoutHistorySection,
  fetchUserHistorySummary,
  generateAIPlan,
  saveAIPlanToSupabase,
} from '../../lib/ai-planner';
import type { SurveyLevelId } from '../../lib/ai-level-classifier';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const LEVEL_IMAGE_MAP: Record<SurveyLevelId, any> = {
  beginner: require('../../../assets/hamster_1200x1200/beginner.png'),
  novice: require('../../../assets/hamster_1200x1200/novice.png'),
  intermediate: require('../../../assets/hamster_1200x1200/intermediate.png'),
  upper_intermediate: require('../../../assets/hamster_1200x1200/upper-intermediate.png'),
  advanced: require('../../../assets/hamster_1200x1200/advanced.png'),
  veteran: require('../../../assets/hamster_1200x1200/veteran.png'),
};

export default function AILevelResultScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const setCurrentPlan = useAIPlanStore((s) => s.setCurrentPlan);
  const setGenerating = useAIPlanStore((s) => s.setGenerating);
  const setError = useAIPlanStore((s) => s.setError);

  const [generating, setLocalGenerating] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!onboardingData || !surveyLevelResult) {
      navigation.goBack();
    }
  }, [navigation, onboardingData, surveyLevelResult]);

  const imageSource = useMemo(() => {
    if (!surveyLevelResult) return null;
    return LEVEL_IMAGE_MAP[surveyLevelResult.levelId];
  }, [surveyLevelResult]);

  const handleNavigate = () => {
    navigation.replace('AIPlanResult', {});
  };

  const handleCreatePlan = async () => {
    if (!onboardingData) return;

    setInlineError(null);
    setLocalGenerating(true);
    setGenerating(true);

    try {
      const history = user?.id ? await fetchUserHistorySummary(user.id) : null;

      let workoutHistorySection = '';
      if (user?.id) {
        const existingPlan = useAIPlanStore.getState().currentPlan;
        if (existingPlan) {
          workoutHistorySection = await buildWorkoutHistorySection(user.id, existingPlan);
        }
      }

      const plan = await generateAIPlan(onboardingData, history, workoutHistorySection);
      setCurrentPlan(plan);

      if (user?.id) {
        saveAIPlanToSupabase(user.id, plan, onboardingData).catch(() => {});
      }

      setPlanReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI 플랜 생성에 실패했습니다.';
      setError(msg);
      setLocalGenerating(false);
      setGenerating(false);
      setInlineError(msg);
      Alert.alert('AI 플랜 생성 실패', msg, [{ text: '확인' }]);
    }
  };

  if (generating) {
    return (
      <AIFlowScreen scroll={false}>
        <AILoadingScreen isComplete={planReady} onComplete={handleNavigate} />
      </AIFlowScreen>
    );
  }

  if (!onboardingData || !surveyLevelResult) return null;

  return (
    <AIFlowScreen
      header={
        <View style={styles(colors).header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).iconButton}>
            <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      }
      contentContainerStyle={styles(colors).content}
      footer={
        <>
          <TouchableOpacity style={styles(colors).primaryBtn} onPress={handleCreatePlan} activeOpacity={0.85}>
            <Text style={styles(colors).primaryBtnText}>이 정보로 AI 플랜 만들기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).secondaryBtn} onPress={() => navigation.popToTop()} activeOpacity={0.8}>
            <Text style={styles(colors).secondaryBtnText}>일단 여기까지 볼게요</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles(colors).retryTestBtn}
            onPress={() => navigation.replace('AIOnboarding', { resetAt: Date.now() })}
            activeOpacity={0.8}
          >
            <Text style={styles(colors).retryTestBtnText}>테스트 다시 하기</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles(colors).badge}>
        <Text style={styles(colors).badgeText}>헬스 레벨 판정</Text>
      </View>

      {imageSource ? (
        <View style={styles(colors).imageWrap}>
          <Image source={imageSource} style={styles(colors).image} resizeMode="contain" />
        </View>
      ) : null}

      <Text style={styles(colors).title}>{surveyLevelResult.title}</Text>
      <Text style={styles(colors).subtitle}>{surveyLevelResult.shortDescription}</Text>
      <Text style={styles(colors).body}>{surveyLevelResult.detail}</Text>

      <View style={styles(colors).tagWrap}>
        {surveyLevelResult.rationaleTags.map((tag) => (
          <View key={tag} style={styles(colors).tag}>
            <Text style={styles(colors).tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles(colors).infoCard}>
        <Text style={styles(colors).infoTitle}>왜 이렇게 판정됐나요?</Text>
        {surveyLevelResult.reasons.map((reason) => (
          <Text key={reason} style={styles(colors).infoText}>
            • {reason}
          </Text>
        ))}
      </View>

      {inlineError ? (
        <View style={styles(colors).errorCard}>
          <Text style={styles(colors).errorTitle}>AI 플랜을 아직 만들지 못했어요</Text>
          <Text style={styles(colors).errorText}>
            {inlineError}
          </Text>
          <Text style={styles(colors).errorHint}>
            잠시 후 다시 시도하거나, 지금은 결과만 확인하고 나가셔도 괜찮아요.
          </Text>
        </View>
      ) : null}

      <View style={styles(colors).ctaCard}>
        <Text style={styles(colors).ctaTitle}>원하시면 여기서 끝내도 괜찮아요.</Text>
        <Text style={styles(colors).ctaBody}>
          입력하신 내용을 바탕으로 운동과 식단까지 엮은 맞춤 AI 플랜을 이어서 만들어드릴 수 있어요.
        </Text>
      </View>
    </AIFlowScreen>
  );
}

const styles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    iconButton: {
      padding: 8,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 24,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginBottom: 16,
    },
    badgeText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    imageWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    image: {
      width: 220,
      height: 220,
    },
    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
      marginBottom: 8,
    },
    subtitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      marginBottom: 10,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 18,
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 18,
    },
    tag: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    tagText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
    },
    infoTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 6,
    },
    errorCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.error,
    },
    errorTitle: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    errorText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 8,
    },
    errorHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    ctaCard: {
      backgroundColor: colors.accentMuted,
      borderRadius: 18,
      padding: 16,
    },
    ctaTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 8,
    },
    ctaBody: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
    },
    primaryBtnText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#fff',
    },
    secondaryBtn: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    secondaryBtnText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    retryTestBtn: {
      alignItems: 'center',
      paddingTop: 2,
      paddingBottom: 8,
    },
    retryTestBtnText: {
      color: colors.textTertiary,
      fontSize: 13,
      fontWeight: '500',
    },
  });
