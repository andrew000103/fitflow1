export type SignupRouteParams = {
  source?: 'default' | 'ai-level-result';
  intent?: 'plan' | 'signup_only';
};

export type LoginRouteParams = {
  source?: 'default' | 'ai-level-result';
  intent?: 'plan' | 'signup_only';
};

export type AuthStackParamList = {
  Login: LoginRouteParams | undefined;
  Signup: SignupRouteParams | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Diet: undefined;
  Profile: undefined;
};

export type WorkoutStackParamList = {
  WorkoutList: undefined;
  WorkoutHistory: undefined;
  WorkoutSession: undefined;
  ExerciseSearch:
    | {
        mode?: 'add' | 'replace';
        exerciseIndex?: number;
        initialQuery?: string;
      }
    | undefined;
  WorkoutSummary: {
    totalVolumeKg: number;
    setCount: number;
    durationSeconds: number;
    exercises: Array<{ name: string; sets: number; volume_kg: number }>;
    nsunsAmrapResults?: Array<{
      exerciseName: string;
      exerciseKey: string;
      currentTm: number;
      amrapReps: number;
      suggestedIncrease: number;
      newTm: number;
    }>;
    userProgramId?: string;
  };
  ProgramList: undefined;
  ProgramDetail: { programId: string };
  ProgramCreate: undefined;
  ProgramReview: { programId: string; programName: string };
  TrainingMaxSetup: {
    userProgramId: string;
    programName: string;
    autoStartWorkout?: boolean;
    programId?: string;
    currentDay?: number;
    daysPerWeek?: number;
  };
};

export type DietStackParamList = {
  DietMain: undefined;
  FoodSearch: { mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; date: string };
  CustomFoodForm: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    foodId?: string;
    initialQuery?: string;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  GoalSettings: undefined;
  WeightHistory: undefined;
};

export type AIModalParamList = {
  AIConsent: undefined;
  AIOnboarding: { resetAt?: number; entry?: 'direct' | 'shared'; mode?: 'default' | 'retest' } | undefined;
  AILevelResult: { entry?: 'direct' | 'shared'; autoCreatePlan?: boolean; mode?: 'default' | 'retest' } | undefined;
  AIPlanResult: { planId?: string };
  AIPlanWeekly: { weekStart: string };
};

export type RootStackParamList = {
  Main: undefined;
  CharacterSetup: undefined;
  Login: LoginRouteParams | undefined;
  Signup: SignupRouteParams | undefined;
  AIConsent: undefined;
  AIOnboarding: { resetAt?: number; entry?: 'direct' | 'shared'; mode?: 'default' | 'retest' } | undefined;
  AILevelResult: { entry?: 'direct' | 'shared'; autoCreatePlan?: boolean; mode?: 'default' | 'retest' } | undefined;
  AIPlanResult: { planId?: string };
  AIPlanWeekly: { weekStart: string };
  AIExerciseSearch: {
    dayLabel: 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7';
    exerciseIndex: number;
    exerciseName: string;
  };
};
