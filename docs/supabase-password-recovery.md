# Supabase Password Recovery Setup

FitFlow uses Supabase Auth email recovery for password reset.

## Required dashboard settings

1. Open `Supabase Dashboard > Authentication > URL Configuration`.
2. Set `Site URL` to your deployed app root.
   - Example: `https://fitflow1.pages.dev`
3. Add these URLs to `Redirect URLs`.
   - `https://fitflow1.pages.dev`
   - `https://fitflow1.pages.dev/`
   - `http://localhost:5173`
   - `http://localhost:5173/`

FitFlow uses `HashRouter`, so the password recovery link intentionally lands on the app root first.
The app then normalizes the recovery URL and sends the user to `#/auth/reset-password` internally.

## Recovery redirect used in the client

The client sends this redirect when requesting a password reset email:

`https://your-domain.example?auth_flow=reset-password`

Do not change that query flag unless you also update:

- `src/features/auth/authRecovery.js`
- `src/features/auth/ResetPasswordPage.jsx`

## Notes

- Email is the only login identifier in the current FitFlow auth flow.
- There is no separate username or account ID sign-in flow, so email-based password recovery is sufficient.
