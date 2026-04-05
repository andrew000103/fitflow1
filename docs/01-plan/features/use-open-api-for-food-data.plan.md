# Use Open API for Food Data Plan

## Objective
Replace the current static food database with a real-time Open API to provide users with more up-to-date and extensive food information. This involves switching from the current MFDS data dump to a live API.

## Scope
1.  **Analysis:** Analyze the existing food data schema and data flow (`src/lib/food-search.ts`, `src/lib/diet-supabase.ts`, `supabase/migrations/20260327_food_db_setup.sql`).
2.  **API Evaluation:** From the provided list, evaluate the "식품의약품안전처_식품영양성분DB" API to determine its suitability. This includes checking its data schema, query capabilities, and usage limits.
3.  **Data Layer Refactoring:** Modify the data access layer to fetch data from the API instead of the local Supabase database. This might require a new module, e.g., `src/lib/food-api.ts`.
4.  **Backend/Supabase Changes:** A Supabase edge function will be created to act as a proxy to the food API. This will protect the API key and can be used for caching in the future.
5.  **UI/UX Adaptation:** Ensure the UI (`src/screens/diet/`) handles the asynchronous nature of API calls gracefully (loading states, error handling).
6.  **Testing:** Create a test plan to verify the new implementation.

## Constraints
- The solution must use one of the APIs from the provided list.
- API keys must be handled securely, not exposed on the client-side.

## Assumptions
- The "식품의약품안전처_식품영양성분DB" API provides sufficient data to replace the existing dataset.
- The API is reliable and has acceptable performance.
- The user is okay with completely replacing the current database search with an API search.

## Success Criteria
- Food search functionality in the app is fully powered by the selected Open API.
- The app can successfully search, retrieve, and display nutritional information for food items from the API.
- The local food database is no longer the primary source for food searches.
- The change does not negatively impact user experience in terms of performance or data quality.

## Next Step
- Create Design Document (`/pdca design`)
