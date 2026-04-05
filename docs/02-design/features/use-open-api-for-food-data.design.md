# Use Open API for Food Data Design

## Options Considered

1.  **Direct Client-to-API:** The client application (React Native) calls the food API directly.
    -   *Pros:* Simple to implement initially.
    -   *Cons:* Exposes the API key on the client-side, which is a major security risk. Doesn't allow for server-side caching or logic.
2.  **Backend Proxy Server:** Create a new, dedicated backend server (e.g., Express.js) to proxy API requests.
    -   *Pros:* Securely manages API keys. Can add caching and other logic.
    -   *Cons:* Adds significant operational overhead (new service to build, deploy, and maintain).
3.  **Supabase Edge Function:** Use a Supabase Edge Function to act as a proxy.
    -   *Pros:* Securely manages API keys. Serverless, so less maintenance overhead. Fits the existing tech stack (`supabase/functions` directory already exists). Can be developed and deployed within the same project structure.
    -   *Cons:* Might have limitations (e.g., execution time, memory) compared to a dedicated server, but these are unlikely to be an issue for this use case.

## Chosen Approach

We will use a **Supabase Edge Function** as a proxy. This is the most secure and efficient option that aligns with the project's existing architecture.

The workflow will be:
1.  The React Native client calls our Supabase Edge Function with a search query.
2.  The Edge Function receives the request, retrieves the Food API key from Supabase secrets.
3.  The Edge Function calls the external Food API with the user's query and the secret key.
4.  The Edge Function receives the response from the Food API.
5.  It transforms the data into a consistent format that the client expects.
6.  It returns the transformed data to the client.

## Target Files

-   **Create:**
    -   `supabase/functions/search-food/index.ts`: The new Supabase Edge Function to proxy requests to the food API.
    -   `src/lib/food-api.ts`: A new client-side library to interact with our Supabase Edge Function.
-   **Modify:**
    -   `src/lib/food-search.ts`: This will be refactored to use `src/lib/food-api.ts` instead of directly querying the Supabase database. The existing logic for ranking or filtering might be adapted or removed depending on the API's capabilities.
    -   `src/screens/diet/SearchFoodScreen.tsx` (or similar): The UI component for food search. It will be updated to use the new data fetching logic, including handling loading and error states from the API call.
-   **Decommission (Potentially):**
    -   The scripts used to import static food data (`scripts/import-mfds-xlsx.ts`, `scripts/seed-mfds.ts`) will become obsolete.
    -   The database table containing the large, static list of foods may be dropped or archived in a future migration.

## Validation Plan

1.  **Unit/Integration Testing:**
    -   Write a test for the Supabase Edge Function to ensure it correctly calls the external API and transforms the data.
    -   Write a test for `src/lib/food-api.ts` to ensure it correctly calls the Edge Function.
2.  **Manual End-to-End Testing:**
    -   Run the app on a simulator or device.
    -   Navigate to the food search screen.
    -   **Test Case 1 (Success):** Search for a common food item (e.g., "사과" - apple). Verify that a list of results is displayed with correct nutritional information.
    -   **Test Case 2 (No Results):** Search for a nonsensical item (e.g., "asdfghjkl"). Verify that a "No results found" message is displayed.
    -   **Test Case 3 (Error):** Manually simulate an error in the Edge Function (e.g., return a 500 status). Verify that the UI displays a user-friendly error message.
3.  **Performance Check:**
    -   Measure the time from initiating a search to results being displayed. Ensure it is within an acceptable range (e.g., < 2 seconds).

## Out of Scope

-   **Offline Support:** This design assumes the user has an active internet connection. Implementing offline food search is not in scope for this change.
-   **Caching:** While the Supabase Edge Function makes caching possible, implementing a caching layer (e.g., with Redis or another service) is out of scope for the initial implementation but can be a future enhancement.
-   **Migrating User's Historical Data:** This change will not affect previously logged food entries.
