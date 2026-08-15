# Plan: Enhance Context Menu with Layout Options & Instant Preview

Implement improved layout selection in the context menu with descriptive labels, icons, and real-time preview (by not closing the menu immediately on selection).

## User Review Required

> [!IMPORTANT]
> The menu will remain open after selecting a layout to allow for "instant preview" of multiple styles. It will close when clicking outside or manually closing via the 'X' button.

## Proposed Changes

### Context Menu Components
- **File:** `src/components/ContextMenu.tsx`
- Refactor the "Layout Controls" section to use a vertical list instead of a compact horizontal row.
- Add descriptive text for each layout (List, Grid, Compact).
- Remove `setIsOpen(false)` from the layout click handlers to enable "momentary preview" without losing the menu context.
- Add visual indicators for the active layout selection.

### UI Context
- **File:** `src/contexts/UIContext.tsx`
- Ensure the layout state is correctly persisted (already seems to be handled, but will verify).

## Technical Details
- Use `cn` (classnames) to highlight the active layout item with background colors and border accents.
- Maintain the RTL support by ensuring text alignment and icons follow the current language direction.
- Adjust the `menuHeight` calculation to account for the expanded layout section.

## Verification Plan

### Manual Verification
- Right-click (or long press) to open the context menu.
- Select different layouts (List, Grid, Compact).
- Verify the main message view updates instantly.
- Confirm the menu stays open for further changes.
- Verify the UI looks good in both Arabic (RTL) and English (LTR).
