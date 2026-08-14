# Product Discovery & Evolution Report: DataBot

## Phase 1: Project Understanding

### What is the project?
DataBot is a secure, AI-powered personal data management platform. It allows users to store and organize various types of information—notes, tasks, credentials, code snippets, and files—within threaded conversations.

### Target Users
- **Developers & Tech Professionals**: Who need to store snippets, server credentials, and manage technical tasks.
- **Privacy-Conscious Users**: Who want client-side encrypted storage for sensitive data.
- **Productivity Enthusiasts**: Who want a central hub for personal organization with AI-assisted features (summarization, code explanation).

### Core Processes
- **Multi-Modal Data Entry**: Adding text, markdown, tasks, credentials (encrypted), and code.
- **AI Analysis**: Explaining code and generating metadata via Gemini.
- **Data Organization**: Threading messages into conversations with pinning, coloring, and labeling.
- **Security**: Client-side AES encryption for sensitive fields.

### User Journey
Login -> Create/Select Conversation -> Add Message (Note/Task/etc.) -> AI Processes Input -> Organize (Pin/Label) -> Retrieve via Global Search.

---

## Phase 2: Product Analysis

| Feature | Status | Observation |
|---------|--------|-------------|
| **Loading States** | Good | Used in Auth, Message sending, and API key checks. |
| **Empty States** | Moderate | Basic text prompts; could be more visual/interactive. |
| **Search** | Excellent | Global search across all conversations and local message filtering. |
| **Filters** | Good | Type-based filtering (Notes, Tasks, etc.). |
| **Responsive** | Excellent | Custom mobile sidebar behavior with dropdown persistence. |
| **Settings** | Good | API key management, Custom CSS, and Demo Data toggle. |
| **Export/Import**| Missing | No way to get data out or move it between accounts. |
| **Permissions** | Basic | RLS active, but no multi-user sharing or fine-grained roles. |

---

## Phase 3: Missing Features Discovery

### 1. Master Password (User-Controlled Encryption)
- **Description**: Allow users to set their own encryption key instead of the system-wide secret.
- **Why**: Currently, encryption relies on a VITE secret. If the server is compromised, all data is at risk. A Master Password ensures only the user can decrypt.
- **Importance**: Critical (Security).

### 2. Data Portability (Export JSON/PDF)
- **Description**: Export conversations or the full database to portable formats.
- **Why**: Users fear vendor lock-in. Essential for a "Personal Storage" app.
- **Importance**: High (Growth/Trust).

### 3. AI-Driven Smart Folders/Tags
- **Description**: Automatically categorize conversations based on content analysis.
- **Why**: Manual labeling is tedious. AI can suggest tags like "Work", "Private", "Finance".
- **Importance**: Medium (UX).

---

## Phase 4: Classification of Proposals

### Essential Features (P1)
- **Master Password**: True privacy enhancement.
- **Backup & Restore**: Data safety.

### UX Improvements (P2)
- **Drag & Drop Tasks**: Better task management.
- **Voice-to-Task**: Hands-free entry.
- **Rich Media Previews**: Better link handling.

### Admin/Advanced Features (P3)
- **Activity Log**: Tracking changes to sensitive data.
- **Usage Statistics**: Dashboard showing data growth and AI usage.

---

## Phase 5: Priorities & Implementation Plan

### P1: Master Password Implementation (Security + Scaling)
- **Files**: `src/lib/encryption.ts`, `src/components/SettingsDialog.tsx`, `src/contexts/AuthContext.tsx`.
- **Impact**: 10/10 (Privacy).

### P2: Data Export Module (Trust)
- **Files**: `src/components/SettingsDialog.tsx`, `src/lib/supabase.ts`.
- **Impact**: 8/10.

---

## Evaluation (Current vs Target)

| Element | Current | Target |
|---------|---------|--------|
| UX/UI | 9/10 | 10/10 |
| Performance | 8/10 | 9/10 |
| Security | 7/10 | 10/10 |
| Scalability | 8/10 | 9/10 |
| **Total** | **8.5/10** | **9.5/10** |

---

## Next Steps
1. **Implement Master Password**: Update encryption logic to use a user-defined key stored in session/memory.
2. **Implement Export/Backup**: Add a "Data Management" tab to Settings.
3. **AI Summarization**: Add a button to summarize long threads to save time.
