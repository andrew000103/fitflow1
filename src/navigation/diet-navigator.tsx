import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CustomFoodFormScreen from '../screens/diet/custom-food-form-screen';
import DietScreen from '../screens/diet/diet-screen';
import FoodSearchScreen from '../screens/diet/food-search-screen';
import { DietStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<DietStackParamList>();

export default function DietNavigator() {
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
      <Stack.Screen name="DietMain" component={DietScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ title: '음식 검색' }} />
      <Stack.Screen name="CustomFoodForm" component={CustomFoodFormScreen} options={{ title: '음식 직접 추가' }} />
    </Stack.Navigator>
  );
}
