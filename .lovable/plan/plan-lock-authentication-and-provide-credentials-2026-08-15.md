# Plan: Lock Authentication and Provide Credentials

The user wants to disable new registrations (Sign Up) and needs a set of credentials to access the application.

## User-Facing Changes
- Remove the "Sign Up" option from the authentication screen to prevent new users from registering.
- The login screen will only allow signing in with existing credentials or Google.
- Provide the user with the pre-configured admin credentials.

## Technical Details
- **Frontend**: 
    - Modify `src/components/Auth.tsx` to remove the state toggle for `isLogin`.
    - Remove the `CardFooter` that allows switching to the signup form.
    - Ensure the form logic always uses `signInWithPassword` and never `signUp`.
- **Backend (Supabase/Lovable Cloud)**:
    - No changes needed to RLS as it already depends on authentication.
    - The existing user `admin2@admin.com` with password `Admin@Admin123!` will serve as the entry point.

## Proposed Credentials
- **Email**: `admin2@admin.com`
- **Password**: `Admin@Admin123!`
