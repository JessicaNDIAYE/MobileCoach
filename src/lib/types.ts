export type WeightMode = 'lose' | 'gain' | 'keep';
export type ChallengeType = 'no_sugar' | 'no_carbs' | 'fiber_max';

export type Profile = {
  id: string;
  username: string | null;
  monthly_budget: number;
  weight_mode: WeightMode;
  weight_goal_kg: number | null;
};

export type WeightEntry = { id: string; measured_on: string; weight_kg: number };

export type Purchase = {
  id: string;
  name: string;
  price: number;
  category: string;
  store: string | null;
  purchased_on: string;
  expires_on: string | null;
  in_stock: boolean;
};

export type Challenge = {
  id: string;
  created_by: string;
  type: ChallengeType;
  title: string;
  fiber_goal_g: number;
  starts_on: string;
  ends_on: string;
  invite_code: string;
};

export type Checkin = { challenge_id: string; user_id: string; day: string; success: boolean; fiber_g: number };

export type LeaderboardRow = {
  challenge_id: string;
  user_id: string;
  username: string | null;
  days_success: number;
  total_fiber_g: number;
};
