# Plan: Exercise Data Expansion

## 1. Objective
The user wants to massively update the list of available exercises in the application. This involves adding many new exercises, renaming some existing ones, and ensuring all exercises have descriptive content (overview, why, how-to) and a visual guide. The update must not break existing functionality, especially workout history.

## 2. Scope
- **Analysis**: Compare the user-provided list of ~200 exercises against the current list in the database to identify new additions and renames.
- **Client-Side Update**: Update the static exercise list defined in `src/constants/exercises.ts` to match the new comprehensive list.
- **Database Migration (Schema/Data)**: Create a new Supabase migration file to:
    - `INSERT` new exercises into the `exercises` table.
    - `UPDATE` the `name_ko` and `name_en` for existing exercises that are being renamed.
    - `UPDATE` any stored exercise names in other tables (e.g., `ai_plans.plan_json`).
- **Database Migration (Content)**: Create a second Supabase migration file to populate the content for all new and existing exercises:
    - `overview_ko`, `overview_en`
    - `why_ko`, `why_en`
    - `how_ko`, `how_en`
    - `description_ko`, `description_en`
    - `visual_guide_url`
- **Content Generation**: Generate the descriptive text for each exercise and find a suitable public URL for the visual guide.

## 3. Constraints & Assumptions
- **Constraint**: Must preserve existing user workout history. All records are linked by `exercise_id`, so this should be manageable.
- **Constraint**: Changes must be compatible with the existing application structure for displaying exercises and their guides.
- **Assumption**: I can generate high-quality descriptive content for all exercises in Korean and English.
- **Assumption**: I can find suitable, publicly-accessible URLs for visual guides (images/gifs) for most exercises, similar to the existing `wger.de` links.
- **Assumption**: The file `src/constants/exercises.ts` is the primary source for client-side exercise lists and needs to be synchronized with the database.

## 4. Success Criteria
- The application's exercise list (e.g., in workout logging or exercise selection screens) reflects the new, comprehensive list.
- All renamed exercises appear with their new names throughout the app.
- Existing workout logs correctly display the (new) names of the exercises they were recorded with.
- The information ("i") button for every exercise successfully displays the newly added overview, why/how-to sections, and a visual guide.
- The `ai_plans` that use renamed exercises are correctly updated.

## 5. High-Level Plan & Next Steps

1.  **(Done)** **Investigation**: Analyze the database schema, existing migrations, and client-side code to understand the current implementation.
2.  **Step 1: Update Client-Side Constant**: Modify `src/constants/exercises.ts` to include all new and renamed exercises. This makes the app aware of the full list.
3.  **Step 2: Create Data Migration SQL**: Write a new `.sql` migration file for Supabase. This script will perform the `INSERT` and `UPDATE` operations on the `exercises` table and update the `ai_plans` JSON.
4.  **Step 3: Generate Content Migration SQL**: Write a script (or manually prepare) a second, large `.sql` migration file that `UPDATE`s all exercises with their full descriptive content and visual guide URLs.
5.  **Step 4: Verification**: After running the migrations, manually verify through the app that all success criteria are met.

**Next Step**: Proceed with **Step 1: Update Client-Side Constant** by modifying the `src/constants/exercises.ts` file.
