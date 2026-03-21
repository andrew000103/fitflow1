import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet } from 'react-native';
import DietScreen from '../screens/diet/diet-screen';
import HomeScreen from '../screens/home/home-screen';
import ProfileScreen from '../screens/profile/profile-screen';
import WorkoutScreen from '../screens/workout/workout-screen';
import { useAppTheme } from '../theme';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { default: IconName; focused: IconName }> = {
  Home: { default: 'home-outline', focused: 'home' },
  Workout: { default: 'dumbbell', focused: 'dumbbell' },
  Diet: { default: 'food-apple-outline', focused: 'food-apple' },
  Profile: { default: 'account-outline', focused: 'account' },
};

export default function MainNavigator() {
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
      <Tab.Screen name="Workout" component={WorkoutScreen} options={{ tabBarLabel: '운동' }} />
      <Tab.Screen name="Diet" component={DietScreen} options={{ tabBarLabel: '식단' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />
    </Tab.Navigator>
  );
}
