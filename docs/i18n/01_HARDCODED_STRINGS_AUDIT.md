# Hardcoded Strings Audit: DataBot

## Overview
This audit identifies user-facing strings that are currently hardcoded in the codebase and need to be moved to the translation system (`LanguageContext`).

## Audit Results

| Current Text | File | Context | Translate? | Suggested Key |
| ------------ | ---- | ------- | ---------- | ------------- |
| "أدخل مفتاح API جديد..." | `src/components/SettingsDialog.tsx` | Input placeholder | Yes | settings.addApiKeyPlaceholder |
| "مفاتيح API" | `src/components/SettingsDialog.tsx` | Tab label | Yes | settings.apiKeysTab |
| "تنسيقات CSS" | `src/components/SettingsDialog.tsx` | Tab label | Yes | settings.customCssTab |
| "الإعدادات" | `src/components/SettingsDialog.tsx` | Dialog title | Yes | settings.title |
| "إضافة" | `src/components/SettingsDialog.tsx` | Button label | Yes | common.add |
| "التحقق من جميع المفاتيح" | `src/components/SettingsDialog.tsx` | Button label | Yes | settings.checkAllKeys |
| "لا توجد مفاتيح مضافة" | `src/components/SettingsDialog.tsx` | Empty state | Yes | settings.noKeys |
| "سيتم استخدام المفاتيح بالتناوب..." | `src/components/SettingsDialog.tsx` | Info text | Yes | settings.apiKeyInfo |
| "تم إضافة المفتاح بنجاح" | `src/components/SettingsDialog.tsx` | Toast | Yes | settings.keyAddedSuccess |
| "المفتاح غير صالح ولكن تم إضافته" | `src/components/SettingsDialog.tsx` | Toast | Yes | settings.keyAddedInvalid |
| "تم حذف المفتاح" | `src/components/SettingsDialog.tsx` | Toast | Yes | settings.keyDeleted |
| "المفتاح موجود مسبقاً أو فارغ" | `src/components/SettingsDialog.tsx` | Toast | Yes | settings.keyExistsError |
| "التنقل بين المحادثات" | `src/components/ContextMenu.tsx` | Menu section | Yes | menu.navigation |
| "السابق" | `src/components/ContextMenu.tsx` | Button | Yes | common.previous |
| "التالي" | `src/components/ContextMenu.tsx` | Button | Yes | common.next |
| "التحكم" | `src/components/ContextMenu.tsx` | Menu section | Yes | menu.controls |
| "الفلاتر" | `src/components/ContextMenu.tsx` | Menu section | Yes | menu.filters |
| "إضافة مهمة جديدة" | `src/components/MessageCard.tsx` | Button | Yes | tasks.addNewTask |
| "اكتب المهمة الجديدة..." | `src/components/MessageCard.tsx` | Input placeholder | Yes | tasks.taskPlaceholder |
| "تم إضافة الصورة بنجاح" | `src/components/MessageInput.tsx` | Toast | Yes | toast.imageAdded |
| "اختر ملف (txt, doc, docx, xls, xlsx, csv)" | `src/components/MessageInput.tsx` | Upload area | Yes | common.chooseFile |
| "إضافة صورة (أو Ctrl+V)" | `src/components/MessageInput.tsx` | Tooltip | Yes | common.addImageTooltip |
| "ملف" | `src/components/MessageInput.tsx` | Label | Yes | common.file |
| "User" | `src/components/MessageCard.tsx` | Label | Yes | credentials.userLabel |
| "Pass" | `src/components/MessageCard.tsx` | Label | Yes | credentials.passLabel |
| "Host" | `src/components/MessageCard.tsx` | Label | Yes | credentials.hostLabel |
| "Port" | `src/components/MessageCard.tsx` | Label | Yes | credentials.portLabel |
| "URL" | `src/components/MessageCard.tsx` | Label | Yes | credentials.urlLabel |

## Excluded (Internal/System)
- `Alert.displayName = "Alert"` (React component display names)
- `alt="Preview"` (Standard accessibility alt, though could be translated)
- `aria-label="Go to previous page"` (Accessibility, should be translated)
