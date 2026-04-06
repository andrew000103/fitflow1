import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import AIConsentScreen from '../screens/ai/ai-consent-screen';
import AIExerciseSearchScreen from '../screens/ai/ai-exercise-search-screen';
import AILevelResultScreen from '../screens/ai/ai-level-result-screen';
import AIOnboardingScreen from '../screens/ai/ai-onboarding-screen';
import SignupScreen from '../screens/auth/signup-screen';
import HomeScreen from '../screens/home/home-screen';
import CharacterSetupScreen from '../screens/persona/character-setup-screen';
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
  const setPendingPostSignupIntent = useAIPlanStore((s) => s.setPendingPostSignupIntent);
  const setPendingPostSignupEmail = useAIPlanStore((s) => s.setPendingPostSignupEmail);

  useEffect(() => {
    if (!user || user.isAnonymous || !pendingPostSignupIntent || !onboardingData || !surveyLevelResult) {
      return;
    }

    if (pendingPostSignupEmail && user.email && user.email !== pendingPostSignupEmail) {
      setPendingPostSignupIntent(null);
      setPendingPostSignupEmail(null);
      return;
    }

    const t = setTimeout(() => {
      navigation.navigate('AILevelResult', {
        entry: 'shared',
        autoCreatePlan: pendingPostSignupIntent === 'plan',
      });
      setPendingPostSignupIntent(null);
      setPendingPostSignupEmail(null);
    }, 100);

    return () => clearTimeout(t);
  }, [
    navigation,
    onboardingData,
    pendingPostSignupEmail,
    pendingPostSignupIntent,
    setPendingPostSignupEmail,
    setPendingPostSignupIntent,
    surveyLevelResult,
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
