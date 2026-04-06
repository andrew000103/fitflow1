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
  const initialUrlHandledRef = useRef(false);
  const isAnonymousUser = Boolean(user?.isAnonymous);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleIncomingUrl = async (url: string | null | undefined) => {
      const sharedTarget = parseSharedEntryUrl(url);
      if (!sharedTarget || !mounted) return;

      setSharedEntryError(null);
      setPendingSharedEntry(sharedTarget);

      if (user) {
        return;
      }

      setProcessingSharedEntry(true);
      try {
        await Promise.race([
          signInAnonymously(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('게스트 로그인 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.')), 12000)
          ),
        ]);
      } catch (error) {
        setPendingSharedEntry(null);
        const message =
          error instanceof Error
            ? error.message
            : '게스트 로그인을 시작하지 못했어요. Supabase Anonymous Sign-Ins 설정을 확인해주세요.';
        setSharedEntryError(message);
      } finally {
        if (mounted) {
          setProcessingSharedEntry(false);
        }
      }
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
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
                setPendingSharedEntry(sharedTarget);
                setProcessingSharedEntry(true);
                Promise.race([
                  signInAnonymously(),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('게스트 로그인 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.')), 12000)
                  ),
                ])
                  .catch((error) => {
                    setPendingSharedEntry(null);
                    setSharedEntryError(error instanceof Error ? error.message : '다시 시도해주세요.');
                  })
                  .finally(() => {
                    setProcessingSharedEntry(false);
                  });
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
          onSharedEntryHandled={() => setPendingSharedEntry(null)}
        />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
