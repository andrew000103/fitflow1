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

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutScreen} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
      <Stack.Screen
        name="ExerciseSearch"
        component={ExerciseSearchScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
      <Stack.Screen name="ProgramList" component={ProgramListScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen
        name="ProgramCreate"
        component={ProgramCreateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ProgramReview"
        component={ProgramReviewScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="TrainingMaxSetup"
        component={TrainingMaxScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
