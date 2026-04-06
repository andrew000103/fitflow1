import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { loadTodayEntries } from '../lib/diet-supabase';
import { parseSharedEntryUrl, SharedEntryTarget } from '../lib/shared-entry';
import { supabase } from '../lib/supabase';
import { useAIPlanStore } from '../stores/ai-plan-store';
import { useAuthStore } from '../stores/auth-store';
import { useDietStore } from '../stores/diet-store';
import AuthNavigator from './auth-navigator';
import MainNavigator from './main-navigator';

type SharedEntryStage =
  | 'idle'
  | 'initializing-auth'
  | 'checking-url'
  | 'shared-link-detected'
  | 'starting-guest-login'
  | 'guest-login-complete'
  | 'waiting-navigation'
  | 'ready';

export default function RootNavigator() {
  const { user, initialized, initialize, signInAnonymously } = useAuthStore();
  const setDietCurrentUser = useDietStore((state) => state.setCurrentUser);
  const hydrateFromSupabase = useDietStore((state) => state.hydrateFromSupabase);
  const {
    onboardingData,
    setNeedsOnboarding,
    markOnboardingComplete,
    hasCompletedOnboarding,
    currentPlan,
    setCurrentPlan,
    setOnboardingData,
  } = useAIPlanStore();
  const [pendingSharedEntry, setPendingSharedEntry] = useState<SharedEntryTarget | null>(null);
  const [processingSharedEntry, setProcessingSharedEntry] = useState(false);
  const [sharedEntryError, setSharedEntryError] = useState<string | null>(null);
  const [sharedEntryStage, setSharedEntryStage] = useState<SharedEntryStage>('initializing-auth');
  const [sharedEntryDebug, setSharedEntryDebug] = useState<string | null>(null);
  const [initTimeoutHit, setInitTimeoutHit] = useState(false);
  const initialUrlHandledRef = useRef(false);
  const isAnonymousUser = Boolean(user?.isAnonymous);

  const runSharedEntryLogin = async (sharedTarget: SharedEntryTarget) => {
    setSharedEntryError(null);
    setSharedEntryDebug(null);
    setPendingSharedEntry(sharedTarget);
    setSharedEntryStage('shared-link-detected');

    if (user) {
      setSharedEntryStage('waiting-navigation');
      return;
    }

    setProcessingSharedEntry(true);
    setSharedEntryStage('starting-guest-login');
    try {
      await Promise.race([
        signInAnonymously(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('게스트 로그인 응답이 12초 넘게 지연되고 있어요. Supabase Auth 설정 또는 네트워크를 확인해주세요.')), 12000)
        ),
      ]);
      setSharedEntryStage('guest-login-complete');
      setSharedEntryDebug('게스트 세션 생성 요청은 완료됐어요. 메인 화면 전환을 기다리는 중입니다.');
    } catch (error) {
      setPendingSharedEntry(null);
      setSharedEntryStage('idle');
      const message =
        error instanceof Error
          ? error.message
          : '게스트 로그인을 시작하지 못했어요. Supabase Anonymous Sign-Ins 설정을 확인해주세요.';
      setSharedEntryError(message);
      setSharedEntryDebug('공유 링크는 감지됐지만 게스트 세션 생성 단계에서 멈췄습니다.');
    } finally {
      setProcessingSharedEntry(false);
    }
  };

  useEffect(() => {
    setSharedEntryStage('initializing-auth');
    initialize();
  }, []);

  useEffect(() => {
    if (initialized) {
      setInitTimeoutHit(false);
      setSharedEntryStage((prev) => (prev === 'initializing-auth' ? 'checking-url' : prev));
      return;
    }

    const timer = setTimeout(() => {
      setInitTimeoutHit(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [initialized]);

  useEffect(() => {
    let mounted = true;

    const handleIncomingUrl = async (url: string | null | undefined) => {
      setSharedEntryStage('checking-url');
      const sharedTarget = parseSharedEntryUrl(url);
      if (!sharedTarget || !mounted) return;
      await runSharedEntryLogin(sharedTarget);
    };

    if (!initialUrlHandledRef.current) {
      initialUrlHandledRef.current = true;
      Linking.getInitialURL().then(handleIncomingUrl).catch(() => {});
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url).catch(() => {});
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [signInAnonymously, user]);

  useEffect(() => {
    if (pendingSharedEntry && user) {
      setSharedEntryStage('waiting-navigation');
      setSharedEntryDebug(
        user.isAnonymous
          ? '게스트 로그인 완료. 공유 설문 화면으로 이동하는 중입니다.'
          : '로그인된 세션이 확인되어 공유 설문 화면으로 이동하는 중입니다.'
      );
    }
  }, [pendingSharedEntry, user]);

  useEffect(() => {
    setDietCurrentUser(user?.id && !isAnonymousUser ? user.id : null);
  }, [setDietCurrentUser, isAnonymousUser, user?.id]);

  // 앱 시작 시 오늘 식단 Supabase → diet-store 복원
  useEffect(() => {
    if (!user?.id || isAnonymousUser) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    loadTodayEntries(user.id, today)
      .then((entries) => { hydrateFromSupabase(today, entries); })
      .catch(() => {});
  }, [user?.id, hydrateFromSupabase, isAnonymousUser]);

  // 앱 재시작 시 Supabase에서 활성 플랜 로드 (로컬 플랜 없을 때만)
  useEffect(() => {
    if (!user?.id || currentPlan || isAnonymousUser) return;
    const loadPlan = async () => {
      try {
        const { data } = await supabase
          .from('ai_plans')
          .select('plan_json, generation_context')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        if (data?.plan_json) {
          setCurrentPlan(data.plan_json);
          if (!onboardingData && data.generation_context) {
            setOnboardingData(data.generation_context);
          }
        }
      } catch {
        // 네트워크 오류 시 무시
      }
    };
    loadPlan();
  }, [onboardingData, setCurrentPlan, setOnboardingData, user?.id, currentPlan, isAnonymousUser]);

  useEffect(() => {
    if (!user?.id || onboardingData || isAnonymousUser) return;

    const loadOnboardingData = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('ai_onboarding_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.ai_onboarding_data) {
          setOnboardingData(data.ai_onboarding_data);
          return;
        }

        const { data: activePlan } = await supabase
          .from('ai_plans')
          .select('generation_context')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (activePlan?.generation_context) {
          setOnboardingData(activePlan.generation_context);
        }
      } catch {
        // 네트워크 오류 시 무시
      }
    };

    loadOnboardingData();
  }, [onboardingData, setOnboardingData, user?.id, isAnonymousUser]);

  // AI 온보딩 체크: 로그인 후 최초 1회, 로컬 온보딩 완료 전에만
  // 기존 플랜이 있는 사용자는 온보딩 스킵 (재설정 시에만 다시 진행)
  useEffect(() => {
    if (!user?.id || hasCompletedOnboarding || isAnonymousUser) return;

    const checkConsent = async () => {
      try {
        // 기존 AI 플랜 존재 여부 먼저 확인
        const { data: existingPlan } = await supabase
          .from('ai_plans')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (existingPlan) {
          // 이미 플랜을 만든 적 있음 → 온보딩 완료로 표시, 새로 만들 필요 없음
          markOnboardingComplete();
          return;
        }

        // 처음 로그인한 사용자 → consent 확인
        const { data } = await supabase
          .from('user_profiles')
          .select('ai_consent')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data && data.ai_consent === null) {
          setNeedsOnboarding(true);
        } else if (!data) {
          setNeedsOnboarding(true);
        }
      } catch {
        // 네트워크 오류 시 무시
      }
    };
    checkConsent();
  }, [user?.id, hasCompletedOnboarding, setNeedsOnboarding, markOnboardingComplete, isAnonymousUser]);

  if (!initialized || processingSharedEntry) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 18, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          {sharedEntryStage === 'initializing-auth'
            ? '인증 상태를 확인하는 중이에요'
            : sharedEntryStage === 'starting-guest-login'
              ? '공유 링크용 게스트 로그인을 시도하는 중이에요'
              : sharedEntryStage === 'waiting-navigation'
                ? '공유 설문 화면으로 이동하는 중이에요'
                : '앱을 준비하는 중이에요'}
        </Text>
        <Text style={{ marginTop: 10, fontSize: 13, lineHeight: 20, color: '#666', textAlign: 'center' }}>
          단계: {sharedEntryStage}
        </Text>
        {sharedEntryDebug ? (
          <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 20, color: '#666', textAlign: 'center' }}>
            {sharedEntryDebug}
          </Text>
        ) : null}
        {initTimeoutHit ? (
          <Text style={{ marginTop: 12, fontSize: 13, lineHeight: 20, color: '#c0392b', textAlign: 'center' }}>
            인증 초기화가 오래 걸리고 있어요. 새로고침 후에도 같으면 Supabase 웹 인증 설정을 확인해야 합니다.
          </Text>
        ) : null}
      </View>
    );
  }

  if (sharedEntryError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
          공유 링크를 여는 중 문제가 생겼어요
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 20, color: '#666' }}>
          {sharedEntryError}
        </Text>
        {sharedEntryDebug ? (
          <Text style={{ fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 20, color: '#666' }}>
            {sharedEntryDebug}
          </Text>
        ) : null}
        <TouchableOpacity
          onPress={() => {
            setSharedEntryError(null);
            Linking.getInitialURL()
              .then((url) => {
                if (!url) {
                  setSharedEntryError('공유 링크를 다시 열어주세요.');
                  return;
                }
                const sharedTarget = parseSharedEntryUrl(url);
                if (!sharedTarget) {
                  setSharedEntryError('공유 링크 형식을 다시 확인해주세요.');
                  return;
                }
                return runSharedEntryLogin(sharedTarget);
              })
              .catch(() => {
                setSharedEntryError('공유 링크를 다시 열어주세요.');
              });
          }}
          style={{
            backgroundColor: '#2f80ed',
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainNavigator
          pendingSharedEntry={pendingSharedEntry === 'level-test'}
          onSharedEntryHandled={() => {
            setPendingSharedEntry(null);
            setSharedEntryStage('ready');
            setSharedEntryDebug('공유 설문 라우팅이 완료됐어요.');
          }}
        />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
