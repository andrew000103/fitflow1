export interface MacroNutrient {
  current_g: number;
  goal_g: number;
}

export interface NutritionSummary {
  calories: { current: number; goal: number };
  protein: MacroNutrient;
  carbs: MacroNutrient;
  fat: MacroNutrient;
}
