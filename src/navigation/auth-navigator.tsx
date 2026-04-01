import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/auth/login-screen';
import SignupScreen from '../screens/auth/signup-screen';
import { AuthStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        headerBackTitleVisible: false,
        headerLeft: ({ canGoBack, onPress }) => {
          if (!canGoBack) {
            return null;
          }
          return (
            <TouchableOpacity
              onPress={onPress}
              style={{ marginLeft: 10, paddingVertical: 5, paddingRight: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
          );
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '회원가입' }} />
    </Stack.Navigator>
  );
}
