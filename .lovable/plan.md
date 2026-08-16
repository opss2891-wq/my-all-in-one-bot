# Plan: Add Custom Colors to Messages

Enable users to assign specific colors to individual messages/notes for better organization and visual categorization.

## User Review Required

> [!IMPORTANT]
> The current color choices will follow the existing project theme: None (default), Red, Orange, Yellow, Green, Blue, Purple, and Pink.

- Do you have specific colors in mind beyond this standard palette?
- Should the color change the border only, or the entire background of the card? (Current plan focuses on the side border and subtle background tint to maintain readability).

## Proposed Changes

### Database & Backend
- Add `color` column to the `messages` table using the existing `app_conversation_color` enum.
- Update the `Message` interface and `updateMessage` function in `src/lib/supabase.ts`.

### UI Components
- **MessageCard.tsx**: 
    - Add a color selector in the card header (visible on hover or via context menu).
    - Update `getBorderColor` and background styles to reflect the selected color.
    - Add logic to persist color changes to the backend.
- **ContextMenu.tsx**:
    - Add a "Change Color" submenu to the message context menu.

## Technical Details

### Database Migration
```sql
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS color public.app_conversation_color DEFAULT 'none';
```

### Component Logic
- The `MessageCard` will receive the `color` property from the message object.
- A new `ColorPicker` sub-component will be added to `MessageCard` or integrated into the existing UI.
- Tailwind dynamic classes will be used to apply the color themes (e.g., `bg-red-500/10 border-red-500/20`).

## Verification Plan

### Automated Tests
- N/A (Manual verification is faster for visual changes).

### Manual Verification
1. Open a conversation.
2. Hover over a message and click the "Color" icon (or right-click).
3. Select a color (e.g., Red).
4. Verify the message border/background changes.
5. Refresh the page to ensure the color choice is persisted.
6. Verify for all message types (Notes, Tasks, Code, etc.).
