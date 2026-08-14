# Remaining Hardcoded Strings Audit: DataBot

## Overview
Status check after the second phase of localization.

## Remaining Internal Strings (Intentional)
These strings are keys, variables, or API-related and should **not** be translated.

| Text | File | Context | Category |
|------|------|---------|----------|
| javascript | src/components/ChatView.tsx | Enum/Value | INTERNAL_ONLY |
| python | src/components/ChatView.tsx | Enum/Value | INTERNAL_ONLY |
| select | src/lib/supabase.ts | SQL | INTERNAL_ONLY |
| app-language | src/contexts/LanguageContext.tsx | Storage Key | INTERNAL_ONLY |
| Cairo | src/index.css | Font Name | INTERNAL_ONLY |

## Localized Components
- **Auth.tsx**: 100%
- **ChatView.tsx**: 100%
- **ConversationSidebar.tsx**: 100%
- **MessageCard.tsx**: 100%
- **SettingsDialog.tsx**: 100%
- **CredentialsSection.tsx**: 100%
- **Demo Data (Static Content)**: 100%

## Verification
- [x] **RTL Support**: Active and toggles correctly with language.
- [x] **Fonts**: `Cairo` applied for Arabic, `Inter` for English.
- [x] **Translation Keys**: All user-facing labels now use `t()`.
- [x] **Toasts**: Success/Error messages are localized.

## Conclusion
The project is now fully bilingual (AR/EN) with professional Arabic typography and correct RTL/LTR handling.
