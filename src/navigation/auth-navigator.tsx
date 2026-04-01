import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/auth/login-screen';
import SignupScreen from '../screens/auth/signup-screen';
import { AuthStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
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
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '회원가입' }} />
    </Stack.Navigator>
  );
}
