# Architecture Map: DataBot

## Overview
- **Type**: Single Page Application (SPA).
- **Framework**: React 18 (Vite).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS + shadcn/ui.

## Frontend Architecture
- **State Management**: React Context (`LanguageContext`, `UIContext`) + TanStack Query for data fetching.
- **Routing**: `react-router-dom` (currently v6, with v7 future flag warnings).
- **Components**: Functional components, Atomic design (UI components in `src/components/ui`).

## Backend & Integration
- **Database**: Firebase Firestore.
- **AI**: Google Gemini API via `src/lib/gemini.ts`.
- **Auth**: Firebase Auth (implied, needs verification).
- **Storage**: (Needs verification if Firebase Storage is used for files/images).

## System Boundaries
1. **Frontend (Browser)**:
   - UI Rendering.
   - Local State (PWA/LocalStorage).
   - Custom CSS Injection.
2. **API Layer**:
   - Firestore Client SDK.
   - Gemini SDK.
3. **External Services**:
   - Firebase (DB/Auth).
   - Google AI (Gemini).

## Deployment & Build
- **Build Tool**: Vite.
- **PWA**: `vite-plugin-pwa` for offline capabilities and installation.

---
*Created during Architecture Discovery phase.*
