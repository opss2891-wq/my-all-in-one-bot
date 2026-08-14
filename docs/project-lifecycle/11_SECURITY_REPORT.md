# Security Report: DataBot

## Vulnerabilities & Gaps

### SEC-VULN-001: API Key Exposure (P1)
- **Status**: OPEN
- **Description**: Firebase and Gemini API keys are hardcoded in `src/lib/firebase.ts` and `src/lib/gemini.ts`.
- **Impact**: Unauthorized usage of API quotas and access to Firebase project.
- **Fix**: Move to environment variables.

### SEC-VULN-002: Lack of Authentication (P0)
- **Status**: OPEN
- **Description**: No user authentication system exists.
- **Impact**: All data is public to anyone with the app URL.
- **Fix**: Implement Firebase Auth.

### SEC-VULN-003: No Data Isolation (P0)
- **Status**: OPEN
- **Description**: Firestore queries are not scoped to users.
- **Impact**: Data leakage between users (if multiple users existed).
- **Fix**: Add `userId` to documents and queries.

### SEC-VULN-004: Plaintext Secrets (P1)
- **Status**: OPEN
- **Description**: Storing passwords and credentials in plaintext in Firestore.
- **Impact**: Database breach exposes all user secrets.
- **Fix**: Client-side AES encryption.

---
*Created during Security Report phase.*
