import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet } from 'react-native';
import AIConsentScreen from '../screens/ai/ai-consent-screen';
import AIExerciseSearchScreen from '../screens/ai/ai-exercise-search-screen';
import AILevelResultScreen from '../screens/ai/ai-level-result-screen';
import AIOnboardingScreen from '../screens/ai/ai-onboarding-screen';
import LoginScreen from '../screens/auth/login-screen';
import SignupScreen from '../screens/auth/signup-screen';
import HomeScreen from '../screens/home/home-screen';
import CharacterSetupScreen from '../screens/persona/character-setup-screen';
import { supabase } from '../lib/supabase';
import ProfileScreen from '../screens/profile/profile-screen';
import { useAIPlanStore } from '../stores/ai-plan-store';
import { useAuthStore } from '../stores/auth-store';
import { useAppTheme } from '../theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';
import DietNavigator from './diet-navigator';
import ProfileNavigator from './profile-navigator';
import WorkoutNavigator from './workout-navigator';

import AIPlanResultScreen from '../screens/ai/ai-plan-result-screen';
import AIPlanWeeklyScreen from '../screens/ai/ai-plan-weekly-screen';
import { View } from 'react-native';

// ─── 탭 네비게이터 ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { default: IconName; focused: IconName }> = {
  Home: { default: 'home-outline', focused: 'home' },
  Workout: { default: 'dumbbell', focused: 'dumbbell' },
  Diet: { default: 'food-apple-outline', focused: 'food-apple' },
  Profile: { default: 'account-outline', focused: 'account' },
};

function TabNavigator() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.focused : icons.default}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />
      <Tab.Screen name="Workout" component={WorkoutNavigator} options={{ tabBarLabel: '운동' }} />
      <Tab.Screen name="Diet" component={DietNavigator} options={{ tabBarLabel: '식단' }} />
      <Tab.Screen name="Profile" component={ProfileNavigator} options={{ tabBarLabel: '프로필' }} />
    </Tab.Navigator>
  );
}

// ─── AI 온보딩 트리거 (스택 내부에서만 navigate 가능) ─────────────────────────
function AIOnboardingTrigger() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const needsOnboarding = useAIPlanStore((s) => s.needsOnboarding);

  useEffect(() => {
    if (needsOnboarding) {
      // 스택이 마운트된 후 navigate (짧은 지연으로 안정성 확보)
      const t = setTimeout(() => {
        navigation.navigate('AIConsent');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [needsOnboarding, navigation]);

  return null;
}

function PostSignupResumeTrigger() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const onboardingData = useAIPlanStore((s) => s.onboardingData);
  const surveyLevelResult = useAIPlanStore((s) => s.surveyLevelResult);
  const pendingPostSignupIntent = useAIPlanStore((s) => s.pendingPostSignupIntent);
  const pendingPostSignupEmail = useAIPlanStore((s) => s.pendingPostSignupEmail);
  const pendingResumeOnboardingData = useAIPlanStore((s) => s.pendingResumeOnboardingData);
  const pendingResumeSurveyLevelResult = useAIPlanStore((s) => s.pendingResumeSurveyLevelResult);
  const setPendingPostSignupIntent = useAIPlanStore((s) => s.setPendingPostSignupIntent);
  const setPendingPostSignupEmail = useAIPlanStore((s) => s.setPendingPostSignupEmail);
  const stashPendingResumeContext = useAIPlanStore((s) => s.stashPendingResumeContext);
  const applyPendingResumeContext = useAIPlanStore((s) => s.applyPendingResumeContext);
  const clearPendingResumeContext = useAIPlanStore((s) => s.clearPendingResumeContext);
  const setOnboardingData = useAIPlanStore((s) => s.setOnboardingData);
  const setCurrentPlan = useAIPlanStore((s) => s.setCurrentPlan);
  const resumeResolutionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !user ||
      user.isAnonymous ||
      !pendingPostSignupIntent ||
      !pendingResumeOnboardingData ||
      !pendingResumeSurveyLevelResult
    ) {
      if (!pendingPostSignupIntent) {
        resumeResolutionKeyRef.current = null;
      }
      if (pendingPostSignupIntent) {
        console.log('[signup-resume-debug] blocked', {
          hasUser: Boolean(user),
          isAnonymous: user?.isAnonymous ?? null,
          pendingPostSignupIntent,
          pendingPostSignupEmail,
          hasOnboardingData: Boolean(pendingResumeOnboardingData),
          hasSurveyLevelResult: Boolean(pendingResumeSurveyLevelResult),
        });
      }
      return;
    }

    if (pendingPostSignupEmail && user.email && user.email !== pendingPostSignupEmail) {
      console.log('[signup-resume-debug] email_mismatch_reset', {
        pendingPostSignupIntent,
        pendingPostSignupEmail,
        userEmail: user.email,
      });
      setPendingPostSignupIntent(null);
      setPendingPostSignupEmail(null);
      clearPendingResumeContext();
      return;
    }

    const resolutionKey = `${user.id}:${pendingPostSignupIntent}:${pendingPostSignupEmail ?? 'none'}`;
    if (resumeResolutionKeyRef.current === resolutionKey) {
      return;
    }
    resumeResolutionKeyRef.current = resolutionKey;

    let cancelled = false;

    const navigateWithPendingResults = (options?: { keepExistingPlan?: boolean }) => {
      if (cancelled) return;
      applyPendingResumeContext();
      setPendingPostSignupIntent(null);
      setPendingPostSignupEmail(null);
      clearPendingResumeContext();
      console.log('[signup-resume-debug] navigate_ai_level_result', {
        pendingPostSignupIntent,
        pendingPostSignupEmail,
        userEmail: user.email ?? null,
        autoCreatePlan: pendingPostSignupIntent === 'plan',
        keepExistingPlan: options?.keepExistingPlan ?? false,
      });
      navigation.navigate('AILevelResult', {
        entry: 'shared',
        autoCreatePlan: pendingPostSignupIntent === 'plan',
        mode: options?.keepExistingPlan ? 'retest' : 'default',
      });
    };

    const navigateWithExistingResults = (existingPlanJson: any, existingOnboardingData: any) => {
      if (cancelled) return;
      if (existingPlanJson) {
        setCurrentPlan(existingPlanJson);
      }
      if (existingOnboardingData) {
        setOnboardingData(existingOnboardingData);
      }
      setPendingPostSignupIntent(null);
      setPendingPostSignupEmail(null);
      clearPendingResumeContext();
      if (existingPlanJson) {
        navigation.navigate('AIPlanResult', {});
        return;
      }
      navigation.navigate('AIOnboarding');
    };

    const resolveResume = async () => {
      const [{ data: existingPlan }, { data: profileData }] = await Promise.all([
        supabase
          .from('ai_plans')
          .select('plan_json, generation_context')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('user_profiles')
          .select('ai_onboarding_data')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const existingOnboardingData = profileData?.ai_onboarding_data ?? existingPlan?.generation_context ?? null;
      const hasExistingAIData = Boolean(existingPlan?.plan_json || existingOnboardingData);

      if (!hasExistingAIData) {
        navigateWithPendingResults();
        return;
      }

      Alert.alert(
        '어떤 정보를 사용할까요?',
        '이 계정에는 이미 AI 관련 정보가 있어요. 기존 정보를 유지할지, 방금 진행한 테스트 결과로 이어갈지 선택해주세요.',
        [
          {
            text: '기존 정보 사용',
            onPress: () => navigateWithExistingResults(existingPlan?.plan_json ?? null, existingOnboardingData),
          },
          {
            text: '새 테스트 결과 사용',
            onPress: () => {
              if (existingPlan?.plan_json) {
                setCurrentPlan(existingPlan.plan_json);
              }
              stashPendingResumeContext(pendingResumeOnboardingData, pendingResumeSurveyLevelResult);
              navigateWithPendingResults({ keepExistingPlan: Boolean(existingPlan?.plan_json) });
            },
          },
          {
            text: '취소',
            style: 'cancel',
            onPress: () => {
              resumeResolutionKeyRef.current = null;
            },
          },
        ]
      );
    };

    resolveResume().catch((error) => {
      console.log('[signup-resume-debug] resolve_failed', {
        message: error instanceof Error ? error.message : String(error),
      });
      resumeResolutionKeyRef.current = null;
      Alert.alert('이어가기 오류', '기존 정보 확인 중 문제가 생겼어요. 다시 로그인해 주세요.');
    });

    return () => {
      cancelled = true;
    };
  }, [
    applyPendingResumeContext,
    clearPendingResumeContext,
    navigation,
    pendingPostSignupEmail,
    pendingPostSignupIntent,
    pendingResumeOnboardingData,
    pendingResumeSurveyLevelResult,
    setCurrentPlan,
    setOnboardingData,
    setPendingPostSignupEmail,
    setPendingPostSignupIntent,
    stashPendingResumeContext,
    user,
  ]);

  return null;
}

// ─── 루트 스택 (탭 + AI 모달 화면) ────────────────────────────────────────────
const RootStack = createNativeStackNavigator<RootStackParamList>();

type MainNavigatorProps = {
  pendingSharedEntry?: boolean;
  onSharedEntryHandled?: () => void;
};

function SharedEntryTrigger({
  pendingSharedEntry = false,
  onSharedEntryHandled,
}: MainNavigatorProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!pendingSharedEntry) return;

    const t = setTimeout(() => {
      navigation.navigate('AIOnboarding', {
        entry: 'shared',
        resetAt: Date.now(),
      });
      onSharedEntryHandled?.();
    }, 100);

    return () => clearTimeout(t);
  }, [navigation, onSharedEntryHandled, pendingSharedEntry]);

  return null;
}

export default function MainNavigator({
  pendingSharedEntry = false,
  onSharedEntryHandled,
}: MainNavigatorProps) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main">
        {() => (
          <>
            <TabNavigator />
            <AIOnboardingTrigger />
            <PostSignupResumeTrigger />
            <SharedEntryTrigger
              pendingSharedEntry={pendingSharedEntry}
              onSharedEntryHandled={onSharedEntryHandled}
            />
          </>
        )}
      </RootStack.Screen>
      <RootStack.Screen
        name="CharacterSetup"
        component={CharacterSetupScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ presentation: 'modal', title: '로그인', headerShown: true }}
      />
      <RootStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ presentation: 'modal', title: '회원가입', headerShown: true }}
      />
      <RootStack.Screen
        name="AIConsent"
        component={AIConsentScreen}
        options={{ presentation: 'modal', gestureEnabled: false }}
      />
      <RootStack.Screen
        name="AIOnboarding"
        component={AIOnboardingScreen}
        options={{ presentation: 'card', gestureEnabled: false }}
      />
      <RootStack.Screen
        name="AILevelResult"
        component={AILevelResultScreen}
        options={{ presentation: 'card', gestureEnabled: false }}
      />
      <RootStack.Screen
        name="AIPlanResult"
        component={AIPlanResultScreen}
        options={{ presentation: 'card' }}
      />
      <RootStack.Screen
        name="AIPlanWeekly"
        component={AIPlanWeeklyScreen}
        options={{ presentation: 'modal' }}
      />
      <RootStack.Screen
        name="AIExerciseSearch"
        component={AIExerciseSearchScreen}
        options={{ presentation: 'card' }}
      />
    </RootStack.Navigator>
  );
}
