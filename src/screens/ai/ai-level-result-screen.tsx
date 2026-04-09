import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import ViewShot from 'react-native-view-shot';

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
  getFitnessTypeContent,
  getFitnessTypeImage,
} from '../../lib/pixel-character-config';
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { useAuthStore } from '../../stores/auth-store';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
function buildShareMessage(params: {
  levelName?: string | null;
  typeName?: string | null;
  summary: string;
  shareUrl: string;
}) {
  const typeHeadline = [params.levelName, params.typeName].filter(Boolean).join(' ').trim() || '알 수 없음';

  return [
    `나의 헬스 유형은 ${typeHeadline}`,
    params.summary,
    '',
    '지금 바로 헬스 유형 테스트하러 가기',
    params.shareUrl,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function AILevelResultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AILevelResult'>>();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const isSharedEntry = route.params?.entry === 'shared';
  const isRetestMode = route.params?.mode === 'retest';
  const isAnonymousUser = Boolean(user?.isAnonymous);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const currentPlan = useAIPlanStore((s) => s.currentPlan);
  const setPendingPostSignupIntent = useAIPlanStore((s) => s.setPendingPostSignupIntent);
  const stashPendingResumeContext = useAIPlanStore((s) => s.stashPendingResumeContext);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const setCurrentPlan = useAIPlanStore((s) => s.setCurrentPlan);
  const setGenerating = useAIPlanStore((s) => s.setGenerating);
  const setError = useAIPlanStore((s) => s.setError);

  const [generating, setLocalGenerating] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const autoCreateHandledRef = useRef(false);
  const missingStateRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<ViewShot | null>(null);

  useEffect(() => {
    if (onboardingData && surveyLevelResult) {
      if (missingStateRedirectTimerRef.current) {
        clearTimeout(missingStateRedirectTimerRef.current);
        missingStateRedirectTimerRef.current = null;
      }
      return;
    }

    console.log('[ai-level-result-debug] missing_state_on_mount', {
      hasOnboardingData: Boolean(onboardingData),
      hasSurveyLevelResult: Boolean(surveyLevelResult),
      entry: route.params?.entry ?? null,
      autoCreatePlan: route.params?.autoCreatePlan ?? null,
    });

    missingStateRedirectTimerRef.current = setTimeout(() => {
      const latestState = useAIPlanStore.getState();
      const hasRecoveredState = Boolean(latestState.onboardingData && latestState.surveyLevelResult);

      console.log('[ai-level-result-debug] missing_state_recheck', {
        hasRecoveredState,
        hasOnboardingData: Boolean(latestState.onboardingData),
        hasSurveyLevelResult: Boolean(latestState.surveyLevelResult),
      });

      if (!hasRecoveredState) {
        navigation.replace('AIOnboarding', { resetAt: Date.now(), entry: route.params?.entry });
      }
    }, 150);

    return () => {
      if (missingStateRedirectTimerRef.current) {
        clearTimeout(missingStateRedirectTimerRef.current);
        missingStateRedirectTimerRef.current = null;
      }
    };
  }, [navigation, onboardingData, route.params?.autoCreatePlan, route.params?.entry, surveyLevelResult]);

  const imageSource = useMemo(() => {
    if (!surveyLevelResult) return null;
    return getFitnessTypeImage(
      surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT,
      surveyLevelResult.genderVariant ?? 'male',
    );
  }, [surveyLevelResult]);

  const celebContent = useMemo(() => {
    if (!surveyLevelResult) return null;
    return getFitnessTypeContent(
      surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT,
      surveyLevelResult.genderVariant ?? 'male',
    );
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
      const shareMessage = buildShareMessage({
        levelName: celebContent?.headline ?? surveyLevelResult?.levelName,
        typeName: null,
        summary: celebContent?.typeStory?.split('.')[0] ?? shareDescription,
        shareUrl,
      });

      if (Platform.OS === 'web' || !shareCardRef.current?.capture) {
        await Share.share({
          title: '헬스 유형 테스트',
          message: shareMessage,
        });
        return;
      }

      const captureUri = await shareCardRef.current.capture();
      await Share.share({
        title: '헬스 유형 테스트',
        message: shareMessage,
        url: captureUri,
      });
    } catch (e) {
      const shareUrl = getSharedLevelTestUrl();
      const fallbackMessage = shareUrl
        ? buildShareMessage({
            levelName: celebContent?.headline ?? surveyLevelResult?.levelName,
            typeName: null,
            summary: celebContent?.typeStory?.split('.')[0] ?? shareDescription,
            shareUrl,
          })
        : null;

      if (fallbackMessage) {
        try {
          await Share.share({
            title: '헬스 유형 테스트',
            message: fallbackMessage,
          });
          return;
        } catch {
          // 폴백 실패 시 아래 Alert 사용
        }
      }

      const msg = e instanceof Error ? e.message : '공유를 열지 못했습니다.';
      Alert.alert('공유 실패', msg, [{ text: '확인' }]);
    }
  };

  const handleSignupPrompt = (intent: 'plan' | 'signup_only') => {
    setPendingPostSignupIntent(intent);
    if (onboardingData && surveyLevelResult) {
      stashPendingResumeContext(onboardingData, surveyLevelResult);
    }
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
            <View style={styles(colors).anonymousFooterGroup}>
              <TouchableOpacity
                style={styles(colors).primaryBtn}
                onPress={() => handleSignupPrompt('plan')}
                activeOpacity={0.85}
              >
                <View style={styles(colors).ctaBtnInner}>
                  <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                  <Text style={styles(colors).primaryBtnText}>회원가입하고 AI 플랜 받기</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(colors).shareHeroBtn}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <View style={styles(colors).ctaBtnInner}>
                  <MaterialCommunityIcons name="share-variant" size={20} color={colors.accent} />
                  <Text style={styles(colors).shareHeroBtnText}>친구에게 공유하기</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(colors).tertiaryBtn}
                onPress={() => handleSignupPrompt('signup_only')}
                activeOpacity={0.8}
              >
                <Text style={styles(colors).tertiaryBtnText}>그냥 회원가입만 하기</Text>
              </TouchableOpacity>
            </View>
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
            onPress={() => navigation.replace('AIOnboarding', {
              resetAt: Date.now(),
              mode: currentPlan ? 'retest' : 'default',
            })}
            activeOpacity={0.8}
          >
            <Text style={styles(colors).retryTestBtnText}>테스트 다시 하기</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles(colors).badge}>
        <Text style={styles(colors).badgeText}>
          {isSharedEntry ? '공유로 시작한 헬스 유형 테스트 결과' : '헬스 유형 테스트 결과'}
        </Text>
      </View>

      {imageSource ? (
        <View style={styles(colors).imageWrap}>
          <Image source={imageSource} style={styles(colors).image} resizeMode="contain" />
        </View>
      ) : null}

      <Text style={styles(colors).title}>{celebContent?.headline}</Text>
      <View style={styles(colors).levelBadge}>
        <Text style={styles(colors).levelBadgeText}>{surveyLevelResult.levelName}</Text>
      </View>

      <View style={styles(colors).sectionCard}>
        <Text style={styles(colors).sectionLabel}>이런 분이에요</Text>
        <Text style={styles(colors).sectionBody}>{celebContent?.celebIntro}</Text>
      </View>

      <View style={styles(colors).sectionCard}>
        <Text style={styles(colors).sectionLabel}>이 유형의 이야기</Text>
        <Text style={styles(colors).sectionBody}>{celebContent?.typeStory}</Text>
      </View>

      <View style={styles(colors).sectionCard}>
        <Text style={styles(colors).sectionLabel}>이런 특징이 있어요</Text>
        {celebContent?.traits.map((trait, i) => (
          <Text key={i} style={styles(colors).traitText}>✓ {trait}</Text>
        ))}
      </View>

      <View style={styles(colors).tipsRow}>
        <View style={[styles(colors).tipCard, { flex: 1 }]}>
          <Text style={styles(colors).tipLabel}>운동 방향</Text>
          <Text style={styles(colors).tipBody}>{celebContent?.trainingTip}</Text>
        </View>
        <View style={[styles(colors).tipCard, { flex: 1 }]}>
          <Text style={styles(colors).tipLabel}>식단 방향</Text>
          <Text style={styles(colors).tipBody}>{celebContent?.dietTip}</Text>
        </View>
      </View>

      {isRetestMode && currentPlan ? (
        <View style={styles(colors).retestInfoCard}>
          <View style={styles(colors).retestInfoHeader}>
            <MaterialCommunityIcons name="refresh-circle" size={18} color={colors.accent} />
            <Text style={styles(colors).retestInfoTitle}>기존 AI 플랜은 그대로 유지되고 있어요</Text>
          </View>
          <Text style={styles(colors).retestInfoBody}>
            이번 결과는 다시 테스트한 현재 유형 기준이에요. 원하면 여기서 공유만 하고, 나중에 새 플랜을 다시 만들 수도 있어요.
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
            • 방금 입력한 테스트 결과를 기준으로 맞춤 AI 플랜 받기
          </Text>
          <Text style={styles(colors).signupBenefitText}>
            • 나중에 다시 돌아와 결과와 플랜 이어서 보기
          </Text>
          <Text style={styles(colors).signupBenefitHint}>
            테스트는 이미 끝났어요. 계정만 만들면 다음 단계로 바로 이어집니다.
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

      {imageSource ? (
        <ViewShot
          ref={shareCardRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={styles(colors).shareCaptureCanvas}
        >
          <View style={styles(colors).shareCard}>
            <View style={styles(colors).shareBadge}>
              <Text style={styles(colors).shareBadgeText}>FITLOG 헬스 유형 테스트</Text>
            </View>
            <View style={styles(colors).shareImagePanel}>
              <Image source={imageSource} style={styles(colors).shareImage} resizeMode="contain" />
            </View>
            <Text style={styles(colors).shareCardTitle}>{celebContent?.headline}</Text>
            <Text style={styles(colors).shareCardSubtitle}>{surveyLevelResult.levelName}</Text>
            <Text style={styles(colors).shareCardBody}>{shareDescription}</Text>
            <View style={styles(colors).shareFooter}>
              <Text style={styles(colors).shareFooterText}>지금 바로 헬스 유형 테스트하러 가기</Text>
              <Text style={styles(colors).shareFooterUrl}>{getSharedLevelTestUrl() ?? '링크를 설정해주세요'}</Text>
            </View>
          </View>
        </ViewShot>
      ) : null}
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
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 10,
      lineHeight: 36,
    },
    levelBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    levelBadgeText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },
    sectionLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    sectionBody: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
    traitText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
    },
    tipsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    tipCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
    },
    tipLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginBottom: 8,
    },
    tipBody: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
    },
    retestInfoCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.accentMuted,
    },
    retestInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    retestInfoTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    retestInfoBody: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
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
    anonymousFooterGroup: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
      shadowColor: colors.accent,
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    ctaBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryBtnText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
    },
    shareHeroBtn: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    shareHeroBtnText: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: '700',
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
    shareCaptureCanvas: {
      position: 'absolute',
      left: -2000,
      top: 0,
      width: 1080,
    },
    shareCard: {
      width: 1080,
      backgroundColor: colors.background,
      paddingHorizontal: 80,
      paddingTop: 88,
      paddingBottom: 96,
    },
    shareBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentMuted,
      borderRadius: 999,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 28,
    },
    shareBadgeText: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: '800',
    },
    shareImagePanel: {
      backgroundColor: colors.card,
      borderRadius: 36,
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
    },
    shareImage: {
      width: 460,
      height: 460,
    },
    shareCardTitle: {
      color: colors.text,
      fontSize: 64,
      fontWeight: '800',
      marginBottom: 12,
    },
    shareCardSubtitle: {
      color: colors.accent,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      marginBottom: 18,
    },
    shareCardBody: {
      color: colors.textSecondary,
      fontSize: 28,
      lineHeight: 40,
      marginBottom: 34,
    },
    shareFooter: {
      borderRadius: 28,
      backgroundColor: colors.card,
      paddingHorizontal: 28,
      paddingVertical: 24,
    },
    shareFooterText: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 8,
    },
    shareFooterUrl: {
      color: colors.accent,
      fontSize: 24,
      fontWeight: '600',
    },
  });
