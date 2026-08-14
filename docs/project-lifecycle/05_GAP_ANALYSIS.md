# Gap Analysis: DataBot

## Findings

### SEC-001: Missing User Isolation (P0 - IN PROGRESS)
- **Problem**: All users share the same Firestore collections. Any visitor can see, edit, or delete any other user's data.
- **Root Cause**: No authentication or user-scoped queries.
- **Evidence**: `src/lib/firebase.ts` queries collections without `where('userId', '==', ...)` clauses.
- **User Impact**: Complete loss of privacy.
- **Recommended Solution**: Implement Firebase Authentication and update all Firestore queries to include `userId`.

### SEC-002: Hardcoded API Keys in Frontend (VERIFIED)
- **Problem**: Gemini API keys and Firebase config are exposed in the client-side code.
- **Root Cause**: Keys are hardcoded in `src/lib/gemini.ts` and `src/lib/firebase.ts`.
- **Evidence**: `API_KEYS` array in `gemini.ts`.
- **User Impact**: Potential API quota theft and unauthorized backend access.
- **Recommended Solution**: Move keys to environment variables and use a backend proxy or serverless functions if possible, or at least restrict keys.

### SEC-003: Plain Text Credentials (P1 - Critical)
- **Problem**: Sensitive data (passwords, hosts) is stored in Firestore without encryption.
- **Root Cause**: The `CredentialsSection` saves data directly to the database.
- **Evidence**: `CredentialData` interface in `firebase.ts` has no encrypted fields.
- **User Impact**: Data breach exposes all stored passwords.
- **Recommended Solution**: Implement client-side encryption (AES) before saving to Firestore.

### TECH-001: React Router Future Flags (P4 - Low)
- **Problem**: Console warnings about upcoming React Router v7 changes.
- **Evidence**: User-provided logs.
- **Recommended Solution**: Enable `v7_startTransition` in `App.tsx`.

---
*Created during Gap Analysis phase.*
