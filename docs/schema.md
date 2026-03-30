# FitLog DB 스키마 (Supabase PostgreSQL)

## users (Supabase Auth 확장)
```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS goal_type TEXT CHECK (goal_type IN ('cut','bulk','maintain','strength'));
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS goal_calories INT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS goal_protein INT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS goal_carbs INT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS goal_fat INT;
```

## body_logs
```sql
CREATE TABLE body_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  muscle_mass_kg NUMERIC(5,2)
);
```

## exercises
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  default_rest_seconds INT DEFAULT 90,
  is_custom BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

## workout_sessions
```sql
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_volume_kg NUMERIC(10,2),
  notes TEXT
);
```

## workout_sets
```sql
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  set_number INT,
  reps INT,
  weight_kg NUMERIC(6,2),
  rest_seconds INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  is_pr BOOLEAN DEFAULT FALSE
);
```

## foods
```sql
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  source TEXT CHECK (source IN ('openfoodfacts','mfds','user')),
  calories_per_100g NUMERIC(7,2),
  protein_per_100g NUMERIC(6,2),
  carbs_per_100g NUMERIC(6,2),
  fat_per_100g NUMERIC(6,2),
  sodium_per_100g NUMERIC(7,2),
  sugar_per_100g NUMERIC(6,2),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

## meal_logs
```sql
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT CHECK (meal_type IN ('아침','점심','저녁','간식')),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT
);
```

## programs
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  duration_weeks INTEGER DEFAULT 4,
  days_per_week INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## program_days
```sql
CREATE TABLE program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT
);
```

## program_exercises
```sql
CREATE TABLE program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER DEFAULT 3,
  target_reps INTEGER DEFAULT 10,
  target_weight_kg NUMERIC(6,2) DEFAULT 0
);
```

## user_programs
```sql
CREATE TABLE user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_day INTEGER DEFAULT 1,
  completed_sessions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, program_id)
);
```

## meal_items
```sql
CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  amount_g NUMERIC(7,2),
  serving_count NUMERIC(5,2),
  calories NUMERIC(7,2),
  protein_g NUMERIC(6,2),
  carbs_g NUMERIC(6,2),
  fat_g NUMERIC(6,2),
  sodium_mg NUMERIC(7,2),
  sugar_g NUMERIC(6,2)
);
```
