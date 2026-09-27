export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little to no exercise)",
  light: "Lightly active (exercise 1-3 days/week)",
  moderate: "Moderately active (exercise 3-5 days/week)",
  active: "Very active (exercise 6-7 days/week)",
  very_active: "Extremely active (hard training or physical job)",
};

export const GOAL_CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export const GOAL_LABELS: Record<GoalType, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
};

export interface GoalInputs {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

export interface GoalTargets {
  bmr: number;
  tdee: number;
  calorieGoal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

/** Mifflin-St Jeor equation. */
export function calculateBmr({ sex, age, heightCm, weightKg }: GoalInputs) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateGoalTargets(inputs: GoalInputs): GoalTargets {
  const bmr = calculateBmr(inputs);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel];
  const calorieGoal = Math.round(
    tdee + GOAL_CALORIE_ADJUSTMENT[inputs.goalType],
  );

  // Protein: ~1.8g/kg bodyweight (supports muscle retention in a deficit
  // or growth in a surplus). Fat: 28% of total calories. Carbs: remainder.
  const proteinG = Math.round(inputs.weightKg * 1.8);
  const fatG = Math.round((calorieGoal * 0.28) / 9);
  const carbsG = Math.max(
    0,
    Math.round((calorieGoal - proteinG * 4 - fatG * 9) / 4),
  );

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal,
    proteinG,
    fatG,
    carbsG,
  };
}
