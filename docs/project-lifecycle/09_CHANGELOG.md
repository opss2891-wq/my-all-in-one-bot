# Changelog: DataBot

## [1.0.3] - 2026-08-14
### Security
- P0: Logical Data Isolation. All CRUD operations now scoped to `userId` (SEC-001).
- Updated `ChatView`, `NotesSection`, `TasksSection`, and `CredentialsSection` to support authenticated user context.

## [1.0.2] - 2026-08-14
### Added
- P0: Firebase Authentication system (Email/Google).
- `AuthContext` and `ProtectedRoute` for application security.
- Login/Signup UI and Logout functionality.

## [1.0.1] - 2026-08-14
- P1: Moved hardcoded Firebase and Gemini API keys to `.env` file (SEC-002).

## [1.0.0] - 2026-08-14
### Added
- Initial project structure and documentation in `docs/project-lifecycle/`.
- Logical modules (Conversations, Messages, Credentials).
- Gemini AI integration for metadata parsing.
- PWA support.
