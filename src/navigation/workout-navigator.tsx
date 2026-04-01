import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ExerciseSearchScreen from '../screens/workout/exercise-search-screen';
import ProgramCreateScreen from '../screens/workout/program-create-screen';
import ProgramReviewScreen from '../screens/workout/program-review-screen';
import ProgramDetailScreen from '../screens/workout/program-detail-screen';
import ProgramListScreen from '../screens/workout/program-list-screen';
import WorkoutHistoryScreen from '../screens/workout/workout-history-screen';
import WorkoutScreen from '../screens/workout/workout-screen';
import WorkoutSessionScreen from '../screens/workout/workout-session-screen';
import WorkoutSummaryScreen from '../screens/workout/workout-summary-screen';
import TrainingMaxScreen from '../screens/workout/training-max-screen';
import { WorkoutStackParamList } from '../types/navigation';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutNavigator() {
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
      <Stack.Screen name="WorkoutList" component={WorkoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: '운동 기록' }} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
      <Stack.Screen
        name="ExerciseSearch"
        component={ExerciseSearchScreen}
        options={{ presentation: 'modal', title: '운동 검색' }}
      />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
      <Stack.Screen name="ProgramList" component={ProgramListScreen} options={{ title: '프로그램 목록' }} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen
        name="ProgramCreate"
        component={ProgramCreateScreen}
        options={{ presentation: 'modal', title: '프로그램 생성' }}
      />
      <Stack.Screen
        name="ProgramReview"
        component={ProgramReviewScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="TrainingMaxSetup"
        component={TrainingMaxScreen}
        options={{ presentation: 'modal', title: 'T-Max 설정' }}
      />
    </Stack.Navigator>
  );
}
