import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CustomFoodFormScreen from '../screens/diet/custom-food-form-screen';
import DietScreen from '../screens/diet/diet-screen';
import FoodSearchScreen from '../screens/diet/food-search-screen';
import { DietStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<DietStackParamList>();

export default function DietNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DietMain" component={DietScreen} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <Stack.Screen name="CustomFoodForm" component={CustomFoodFormScreen} />
    </Stack.Navigator>
  );
}
