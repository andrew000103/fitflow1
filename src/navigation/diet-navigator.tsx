import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CustomFoodFormScreen from '../screens/diet/custom-food-form-screen';
import DietScreen from '../screens/diet/diet-screen';
import FoodSearchScreen from '../screens/diet/food-search-screen';
import { DietStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <Stack.Screen name="DietMain" component={DietScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ title: '음식 검색' }} />
      <Stack.Screen name="CustomFoodForm" component={CustomFoodFormScreen} options={{ title: '음식 직접 추가' }} />
    </Stack.Navigator>
  );
}
