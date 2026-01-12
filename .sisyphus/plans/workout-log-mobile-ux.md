# Mobile UI/UX Improvements for WorkoutLog.tsx

## 1. Objective
Optimize the `WorkoutLog` page (specifically the `ExerciseSetList` component) for mobile devices ("Toss" style).
Key goals:
-   Vertical layout for sets on mobile.
-   Large touch targets (min 44px).
-   Eliminate horizontal scrolling.
-   Consistent styling with `theme.ts`.

## 2. Analysis
-   **Current State**: `ExerciseSetList` uses a flex row (`display: flex`) with `Set | Weight | Reps | Delete`. This is cramped on mobile.
-   **Design Tokens**:
    -   Font: Pretendard
    -   Radius: 20px / 24px
    -   Primary Color: `#3182F6`
    -   Backgrounds: `#F2F4F6` (light), `#191F28` (dark)
-   **Mobile Detection**: The codebase uses `useMediaQuery(theme.breakpoints.down('md'))` (or `sm`) to detect mobile.

## 3. Implementation Plan

### Step 1: Update `ExerciseSetList` Component
**File**: `workout-frontend/src/pages/WorkoutLog.tsx`

1.  **Add Mobile Detection**:
    ```typescript
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    ```

2.  **Conditional Rendering**:
    -   **If Mobile**: Render a "Card" layout for each set.
    -   **If Desktop**: Keep the existing Row layout.

3.  **Mobile Card Layout Structure**:
    -   **Container**:
        -   `bgcolor`: `theme.palette.background.default` or `grey[50]`
        -   `borderRadius`: `16px`
        -   `p`: 2 (padding)
        -   `mb`: 1.5 (margin bottom)
    -   **Header Row** (Flex, Space-Between):
        -   **Left**: Set Number (Badge/Circle).
        -   **Right**: Delete Button (Large Icon Button).
    -   **Weight Control Row** (Flex, Align Center, mt: 1):
        -   **Label**: "KG" (Typography, caption, bold).
        -   **Controls**:
            -   Minus Button (44x44px, filled/tonal background).
            -   Input Field (Centered, large text).
            -   Plus Button (44x44px, filled/tonal background).
    -   **Reps Control Row** (Flex, Align Center, mt: 1):
        -   **Label**: "REPS" (Typography, caption, bold).
        -   **Controls**: Same as Weight.

### Step 2: Styling Details (Mobile)
-   **Buttons**:
    -   Use `IconButton` or `Button` with `sx={{ minWidth: 44, minHeight: 44, borderRadius: '12px' }}`.
    -   Background: `theme.palette.action.hover` or light primary tint.
-   **Inputs**:
    -   Remove borders if using a filled background style.
    -   Ensure text is centered and large (fontSize: '1.1rem').
-   **Labels**:
    -   Use `color="text.secondary"` and `fontWeight="600"`.

### Step 3: Clean up Parent Layout
-   Remove the sticky header row ("SET | KG | REPS") when on mobile, as labels are moved inside the cards.
-   Adjust padding of the main `Box` container if necessary.

## 4. Verification
-   Check visibility on mobile breakpoint (<600px).
-   Verify "Add Set" button style matches new look.
-   Ensure no functional regression (values still update correctly).
