# Project Overview: DataBot

## Observed Features
- **DataBot** is a personal data storage and analysis application.
- **Core Entities**: Messages, Conversations, Notes, Tasks, Credentials, Code snippets.
- **Technology Stack**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Persistence**: Firebase Firestore (verified via `package.json` and `src/lib/firebase.ts`).
- **AI Integration**: Gemini API (verified via `package.json` and `src/lib/gemini.ts`).
- **PWA**: Support for Progressive Web App.
- **Multilingual**: Arabic (RTL) and English support.
- **Theme**: Dark/Light mode support.

## User Personas
- **Developer/Power User**: Needs to store code snippets, credentials, and tasks securely.
- **General User**: Needs a central place for notes and multi-step tasks with AI assistance.

## Business Purpose
- To provide an autonomous, all-in-one assistant for data organization, task management, and technical troubleshooting.

## Main User Journeys
1. **Conversation Flow**: User starts a chat -> messages are stored in Firestore -> AI analyzes or responds.
2. **Task Management**: User creates tasks/notes -> tasks are tracked and updated.
3. **Credential Storage**: User saves sensitive info (potential security area).

## Observed Modules
- **Authentication**: (To be verified if active or just boilerplate).
- **Chat/Conversation**: Main interface.
- **Sidebar**: Conversation history navigation.
- **Notes/Tasks**: Specialized data entry sections.
- **Credentials**: Sensitive data management.
- **Custom CSS**: Personalization.
- **Global Search**: Search across conversations.

## Inferred Capabilities
- AI-powered task expansion.
- Automatic conversation titling.
- Code highlighting and analysis.

## Unknowns
- Exact Authentication state (is it just Firestore public or protected?).
- Level of encryption for credentials.
- Error handling robustness for offline mode.

---
*Created during Initial Audit phase.*
