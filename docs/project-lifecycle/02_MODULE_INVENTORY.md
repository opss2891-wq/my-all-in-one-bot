# Module Inventory: DataBot

## 1. Authentication & Security
- **Status**: MOO (Mostly Out) / Public.
- **Provider**: Firebase Config in code (Sensitive data risk!).
- **User Isolation**: Not implemented. All users see the same Firestore collections.
- **Credential Storage**: Credentials stored in plain text in Firestore.

## 2. Conversation & Chat Interface
- **Components**: `ChatView`, `ConversationSidebar`, `MessageCard`, `MessageInput`.
- **Logic**: Creating, renaming, pinning, coloring, and archiving conversations.
- **Search**: Global search implemented in `src/lib/firebase.ts`.

## 3. Data Sections (Messages)
- **Notes**: Text-based notes with image support (Base64).
- **Tasks**: Hierarchical tasks within messages.
- **Credentials**: Form-based credential storage with AI parsing.
- **Links**: Link metadata fetching using Gemini.
- **Code**: Code highlighting (Highlight.js) + AI explanation.
- **Files**: Small file storage (Base64).

## 4. AI Engine (Gemini)
- **Helper**: `src/lib/gemini.ts`.
- **Functions**: Link title generation, credential parsing, code explanation.
- **Issue**: Multiple API keys hardcoded in frontend.

## 5. UI/UX & Customization
- **Multilingual**: `LanguageContext` for Arabic/English.
- **Custom CSS**: User-defined CSS persistence via `useCustomCSS`.
- **Theme**: Light/Dark via `next-themes`.
- **PWA**: Configured in `vite.config.ts`.

## 6. Project Foundation
- **State**: TanStack Query + React Context.
- **UI Kit**: shadcn/ui.
- **Icons**: Lucide React.

---
*Created during Module Inventory phase.*
