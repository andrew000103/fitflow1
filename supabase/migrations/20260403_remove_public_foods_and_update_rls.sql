-- Remove all existing public food data that was seeded from external sources.
-- The app will now use the food search API for public food data.
DELETE FROM public.foods WHERE visibility = 'public';

-- Update RLS policy to only allow users to read their own food entries.
-- Public food search will now be handled exclusively by the API.
DROP POLICY "Read public foods" ON public.foods;

CREATE POLICY "Users can read their own foods"
  ON public.foods
  FOR SELECT
  USING (auth.uid() = user_id);

-- The policy for inserting public data (e.g., from Open Food Facts cache) is no longer needed
-- as we are moving to an API-first approach for public data.
-- We keep the insert policy for user-owned food.
DROP POLICY "Insert foods" ON public.foods;

CREATE POLICY "Users can insert their own foods"
  ON public.foods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND source = 'user');

-- Note: The "Update own foods" policy is unchanged and remains in effect.
