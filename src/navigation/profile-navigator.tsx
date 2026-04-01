import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ProfileScreen from '../screens/profile/profile-screen';
import EditProfileScreen from '../screens/profile/edit-profile-screen';
import GoalSettingsScreen from '../screens/profile/goal-setting-screen';
import WeightHistoryScreen from '../screens/profile/weight-history-screen';
import { ProfileStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  const { colors, typography } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: typography.fontFamily,
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.text,
        },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: '프로필' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: '개인 정보 수정' }}
      />
      <Stack.Screen
        name="GoalSettings"
        component={GoalSettingsScreen}
        options={{ title: '목표 설정' }}
      />
      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{ title: '체중 기록' }}
      />
    </Stack.Navigator>
  );
}
