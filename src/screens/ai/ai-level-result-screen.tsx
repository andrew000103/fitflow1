import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AILoadingScreen } from '../../components/ai/AILoadingScreen';
import { AIFlowScreen } from '../../components/ai/AIFlowScreen';
import {
  buildWorkoutHistorySection,
  fetchUserHistorySummary,
  generateAIPlan,
  saveAIPlanToSupabase,
} from '../../lib/ai-planner';
import { getSharedLevelTestUrl } from '../../lib/shared-entry';
import type { SurveyLevelId } from '../../lib/ai-level-classifier';
import {
  DEFAULT_PIXEL_VARIANT,
  PIXEL_IMAGE_MAP,
  PIXEL_VARIANT_META,
} from '../../lib/pixel-character-config';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;


export default function AILevelResultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AILevelResult'>>();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const isSharedEntry = route.params?.entry === 'shared';
  const isAnonymousUser = Boolean(user?.isAnonymous);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const setPendingPostSignupIntent = useAIPlanStore((s) => s.setPendingPostSignupIntent);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const setCurrentPlan = useAIPlanStore((s) => s.setCurrentPlan);
  const setGenerating = useAIPlanStore((s) => s.setGenerating);
  const setError = useAIPlanStore((s) => s.setError);

  const [generating, setLocalGenerating] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const autoCreateHandledRef = useRef(false);

  useEffect(() => {
    if (!onboardingData || !surveyLevelResult) {
      navigation.goBack();
    }
  }, [navigation, onboardingData, surveyLevelResult]);

  const imageSource = useMemo(() => {
    if (!surveyLevelResult) return null;
    const variant = surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT;
    return PIXEL_IMAGE_MAP[variant][surveyLevelResult.levelId];
  }, [surveyLevelResult]);

  const variantMeta = useMemo(() => {
    if (!surveyLevelResult) return null;
    const variant = surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT;
    return PIXEL_VARIANT_META[variant];
  }, [surveyLevelResult]);

  const shareDescription = useMemo(() => {
    if (!surveyLevelResult) return '';

    const condensed = surveyLevelResult.description
      .replace(/\s+/g, ' ')
      .trim()
      .split('. ')[0]
      .trim();

    if (condensed.length <= 80) {
      return condensed.endsWith('.') ? condensed : `${condensed}.`;
    }

    return `${condensed.slice(0, 77).trimEnd()}...`;
  }, [surveyLevelResult]);

  const handleNavigate = () => {
    navigation.replace('AIPlanResult', {});
  };

  const handleShare = async () => {
    try {
      const shareUrl = getSharedLevelTestUrl();
      if (!shareUrl) {
        Alert.alert(
          '공유 링크 설정 필요',
          '운영 웹 주소를 먼저 설정해야 친구에게 열리는 링크를 공유할 수 있어요. EXPO_PUBLIC_WEB_URL을 설정한 뒤 다시 시도해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
      const shareMessage = [
        `나의 헬스 레벨은 ${surveyLevelResult?.nickname ?? '알 수 없음'}.`,
        surveyLevelResult?.vibe ?? '',
        '',
        shareDescription,
        '',
        '헬스 레벨을 바로 테스트해보러 가기.',
        shareUrl,
      ]
        .filter(Boolean)
        .join('\n');

      await Share.share({
        title: '헬스 레벨 테스트 공유',
        message: shareMessage,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '공유를 열지 못했습니다.';
      Alert.alert('공유 실패', msg, [{ text: '확인' }]);
    }
  };

  const handleSignupPrompt = (intent: 'plan' | 'signup_only') => {
    setPendingPostSignupIntent(intent);
    navigation.navigate('Signup', {
      source: 'ai-level-result',
      intent,
    });
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

  useEffect(() => {
    if (autoCreateHandledRef.current) return;
    if (!route.params?.autoCreatePlan || isAnonymousUser || !onboardingData) return;

    autoCreateHandledRef.current = true;
    handleCreatePlan();
  }, [isAnonymousUser, onboardingData, route.params?.autoCreatePlan]);

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
          {isAnonymousUser ? (
            <>
              <TouchableOpacity
                style={styles(colors).primaryBtn}
                onPress={() => handleSignupPrompt('plan')}
                activeOpacity={0.85}
              >
                <Text style={styles(colors).primaryBtnText}>회원가입하고 AI 플랜 받기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(colors).secondaryBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).secondaryBtnText}>친구에게 공유하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(colors).tertiaryBtn}
                onPress={() => handleSignupPrompt('signup_only')}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).tertiaryBtnText}>그냥 회원가입만 하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles(colors).primaryBtn} onPress={handleCreatePlan} activeOpacity={0.85}>
                <Text style={styles(colors).primaryBtnText}>이 정보로 AI 플랜 만들기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles(colors).secondaryBtn} onPress={handleShare} activeOpacity={0.8}>
                <Text style={styles(colors).secondaryBtnText}>친구에게 공유하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles(colors).tertiaryBtn} onPress={() => navigation.popToTop()} activeOpacity={0.8}>
                <Text style={styles(colors).tertiaryBtnText}>일단 여기까지 볼게요</Text>
              </TouchableOpacity>
            </>
          )}
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
        <Text style={styles(colors).badgeText}>
          {isSharedEntry ? '공유로 시작한 헬스 레벨 판정' : '헬스 레벨 판정'}
        </Text>
      </View>

      {imageSource ? (
        <View style={styles(colors).imageWrap}>
          <Image source={imageSource} style={styles(colors).image} resizeMode="contain" />
        </View>
      ) : null}

      <Text style={styles(colors).title}>{surveyLevelResult.nickname}</Text>
      <Text style={styles(colors).subtitle}>{surveyLevelResult.vibe}</Text>
      <Text style={styles(colors).body}>{surveyLevelResult.description}</Text>

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

      {variantMeta ? (
        <View style={styles(colors).variantCard}>
          <View style={styles(colors).variantHeader}>
            <MaterialCommunityIcons name="palette-outline" size={18} color={colors.accent} />
            <Text style={styles(colors).variantTitle}>배정된 캐릭터 성향: {variantMeta.label}</Text>
          </View>
          <Text style={styles(colors).variantBody}>{variantMeta.shortReason}</Text>
          <Text style={styles(colors).variantHint}>
            {variantMeta.detailReason}
          </Text>
        </View>
      ) : null}

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

      {isAnonymousUser ? (
        <View style={styles(colors).signupBenefitCard}>
          <View style={styles(colors).signupBenefitHeader}>
            <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.accent} />
            <Text style={styles(colors).signupBenefitTitle}>회원가입하면 바로 이어서 할 수 있어요</Text>
          </View>
          <Text style={styles(colors).signupBenefitText}>
            • 방금 입력한 설문 결과를 기준으로 맞춤 AI 플랜 받기
          </Text>
          <Text style={styles(colors).signupBenefitText}>
            • 나중에 다시 돌아와 결과와 플랜 이어서 보기
          </Text>
          <Text style={styles(colors).signupBenefitHint}>
            설문은 이미 끝났어요. 계정만 만들면 다음 단계로 바로 이어집니다.
          </Text>
        </View>
      ) : null}

      <View style={styles(colors).ctaCard}>
        <Text style={styles(colors).ctaTitle}>
          {isAnonymousUser ? '계정을 만들면 여기서 바로 다음 단계로 갈 수 있어요.' : '원하시면 여기서 끝내도 괜찮아요.'}
        </Text>
        <Text style={styles(colors).ctaBody}>
          {isAnonymousUser
            ? '회원가입 후 로그인하면 지금 확인한 레벨 결과를 바탕으로 운동과 식단까지 엮은 맞춤 AI 플랜을 이어서 받을 수 있어요.'
            : '입력하신 내용을 바탕으로 운동과 식단까지 엮은 맞춤 AI 플랜을 이어서 만들어드릴 수 있어요.'}
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
    variantCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    variantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    variantTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    variantBody: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 8,
    },
    variantHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
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
    signupBenefitCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.accentMuted,
    },
    signupBenefitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    signupBenefitTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    signupBenefitText: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 6,
    },
    signupBenefitHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
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
    tertiaryBtn: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    tertiaryBtnText: {
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
