# Implementation Plan: DataBot

## PHASE 01 — Foundation & Warnings
- [ ] Task FOUND-01: Fix React Router future flags. (Finding: TECH-001)
- [ ] Task FOUND-02: Move hardcoded keys to environment variables. (Finding: SEC-002)

## PHASE 02 — Authentication & Identity
- [ ] Task AUTH-01: Enable Firebase Authentication (Email/Password or Google).
- [ ] Task AUTH-02: Create AuthContext to manage user state.
- [ ] Task AUTH-03: Implement Login/Signup UI.

## PHASE 03 — Data Isolation (The Big Shift)
- [ ] Task ISO-01: Update Firestore Schema to include `userId` in all documents.
- [ ] Task ISO-02: Update `src/lib/firebase.ts` CRUD operations to filter by `userId`.
- [ ] Task ISO-03: Implement Firebase Security Rules (RLS) to prevent cross-user access.

## PHASE 04 — Security Hardening
- [ ] Task SEC-01: Implement client-side encryption for the Credentials module.
- [ ] Task SEC-02: Audit and sanitize all AI prompts to prevent leakage.

## PHASE 05 — UX & Refinement
- [ ] Task UX-01: Improve offline persistence for Firestore.
- [ ] Task UX-02: Final RTL/LTR consistency check.

---
*Created during Implementation Plan phase.*
