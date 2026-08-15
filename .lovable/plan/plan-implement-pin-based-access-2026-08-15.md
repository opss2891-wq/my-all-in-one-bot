# Plan - Implement PIN-based access

The goal is to replace the current email/password authentication with a simple 4-digit PIN (4419) access mechanism as requested by the user.

## Proposed Changes

### 1. Authentication Context Update
- Update `src/contexts/AuthContext.tsx` to handle "PIN-based session".
- We will simulate a user session when the correct PIN is entered.
- Since real Supabase Auth is no longer wanted for this specific interaction, we'll store a "guest_session" flag in `localStorage` to persist access across refreshes.

### 2. Login Component Refactor
- Completely rewrite `src/components/Auth.tsx`.
- Remove Email, Password, and Google sign-in options.
- Add a PIN input field.
- Implement logic to check if input equals "4419".
- On success, trigger the new session state in `AuthContext`.

### 3. Cleanup
- Ensure that the rest of the application (which might expect a Supabase `user` object) doesn't break.
- We will mock the `user` object in `AuthContext` when the PIN is active.

## Technical Details
- **PIN**: 4419
- **Storage**: `localStorage.setItem('databot_pin_access', 'true')`
- **Context**: `user` will be returned as a mock object `{ id: 'guest', email: 'guest@databot.local' }` to satisfy existing component dependencies.

## User Review Required
- Note: This bypasses standard backend security. Anyone with the PIN will have access to the UI.
- Data fetching (Supabase RLS) might need adjustments if it relies on `auth.uid()`. I will check if I need to update RLS policies or provide a "public" access path if the user expects data to persist without a real account.
