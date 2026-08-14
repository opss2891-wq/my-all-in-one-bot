# Hardcoded Strings Audit: DataBot

## Overview
This audit identifies remaining hardcoded strings in the project for translation into Arabic and English.

## Audit Results

| Current Text | File | Context | Translate? | Suggested Key |
|--------------|------|---------|------------|---------------|
| Credentials  | src/components/CredentialsSection.tsx | Heading | Yes | credentials.title |
| Type | src/components/CredentialsSection.tsx | Label | Yes | credentials.typeLabel |
| Username | src/components/CredentialsSection.tsx | Label | Yes | credentials.usernameLabel |
| Password | src/components/CredentialsSection.tsx | Label | Yes | credentials.passwordLabel |
| Host | src/components/CredentialsSection.tsx | Label | Yes | credentials.hostLabel |
| Port | src/components/CredentialsSection.tsx | Label | Yes | credentials.portLabel |
| URL | src/components/CredentialsSection.tsx | Label | Yes | credentials.urlLabel |
| Code Result | src/lib/gemini.ts | Logic Message | Yes | ai.codeResult |
| Language | src/lib/gemini.ts | Logic Key | No | (Identifier) |
| Explanation | src/lib/gemini.ts | Logic Key | No | (Identifier) |
| tags | src/lib/gemini.ts | Logic Key | No | (Identifier) |
| Demo Conversation (DataBot) | src/components/SettingsDialog.tsx | Static Name | Yes | demo.conversationName |
| # Welcome to DataBot! | src/components/SettingsDialog.tsx | Demo Content | Yes | demo.welcomeContent |
| Explore DataBot features | src/components/SettingsDialog.tsx | Demo Task | Yes | demo.task1 |
| Add your first note | src/components/SettingsDialog.tsx | Demo Task | Yes | demo.task2 |
| Configure API keys | src/components/SettingsDialog.tsx | Demo Task | Yes | demo.task3 |
| Try Markdown formatting | src/components/SettingsDialog.tsx | Demo Task | Yes | demo.task4 |
| A simple JavaScript function | src/components/SettingsDialog.tsx | Demo Explanation | Yes | demo.codeExplanation |

## UI Localization Status
- **Auth**: Fully localized via `Auth.tsx`.
- **ChatView**: Fully localized using `t()`.
- **Sidebar**: Fully localized.
- **MessageCard**: Fully localized.
- **Settings**: Fully localized.

## RTL & Font Status
- **RTL**: Handled via `document.documentElement.dir` in `LanguageContext.tsx`.
- **Fonts**: `Cairo` is loaded and applied in `index.css` for `[lang="ar"]`.
- **Language Switcher**: Implemented in `ContextMenu.tsx` and settings.

## Next Steps
1. Move demo data strings to locale files.
2. Localize `CredentialsSection.tsx` labels.
3. Verify Gemini response mapping for localized labels.
