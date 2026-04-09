# Design System Strategy: The Immersive Curator

## 1. Overview & Creative North Star
**The Creative North Star: "Cinematic Atmosphere"**

This design system is engineered to disappear, acting as a sophisticated gallery space that prioritizes content over container. We move beyond the "template" look by treating the desktop viewport as a high-end editorial stage. Instead of rigid, boxed-in grids, we utilize **intentional asymmetry** and **tonal layering** to guide the eye.

The goal is to create a digital environment that feels "expensive"—achieved through expansive breathing room, hyper-refined typography scales, and a "light-through-glass" approach to depth. We are not just building a gallery; we are building a premiere experience.

---

### 2. Colors & Surface Philosophy

The color palette is anchored in a deep, nocturnal base to provide maximum contrast for media assets.

*   **The "No-Line" Rule:** We do not use 1px solid borders to define sections. Period. Boundaries are established through background shifts. For example, a `surface-container-low` (#111318) sidebar should sit against a `background` (#0c0e12) main stage.
*   **Surface Hierarchy & Nesting:** Use the surface tiers to create "stacked" depth. 
    *   **Base:** `surface` (#0c0e12)
    *   **In-Page Sections:** `surface-container` (#171a1f)
    *   **Interactive Elements:** `surface-container-high` (#1d2025)
*   **The "Glass & Gradient" Rule:** Floating navigation or high-level overlays must use Glassmorphism. Apply `surface_variant` (#23262c) at 60% opacity with a `24px` backdrop blur. 
*   **Signature Textures:** For primary CTAs, use a linear gradient from `primary` (#8ff5ff) to `primary_container` (#00eefc) at a 135-degree angle. This adds a "lithographic" soul to the interface that flat fills lack.

---

### 3. Typography: Editorial Authority

We use a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for hero titles. This creates a bold, "curated" feel.
*   **Body & UI (Inter):** The workhorse. Inter provides exceptional legibility at small scales. Use `body-md` (0.875rem) for metadata to keep the UI from feeling cluttered.
*   **Hierarchical Intent:** Use `label-md` (0.75rem, uppercase, 0.05em tracking) for category tags. This shifts the tone from "standard website" to "professional media tool."

---

### 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "heavy" for this system. We use light and transparency to simulate height.

*   **The Layering Principle:** To lift a card, do not add a border. Place a `surface-container-highest` (#23262c) element on top of a `surface-container-low` (#111318) background. The delta in luminance creates a natural, soft edge.
*   **Ambient Shadows:** For floating modals, use a "Tinted Ambient Shadow": 
    *   `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(143, 245, 255, 0.05);` (using a hint of the `primary` token).
*   **The "Ghost Border":** If accessibility requires a stroke, use `outline_variant` (#46484d) at 15% opacity. It should be felt, not seen.
*   **Glassmorphism:** Use `backdrop-filter: blur(12px)` on all floating headers to allow the vibrant media colors to bleed through as the user scrolls, creating an immersive, integrated atmosphere.

---

### 5. Components

#### Cards (The Core Component)
*   **Visuals:** Use `xl` (1.5rem) corner radius for media cards. No borders.
*   **Hover State:** On hover, the card should scale to 1.02, the background should shift to `surface_bright` (#292c32), and a subtle `primary` inner-glow (inset shadow) should appear.
*   **Content:** Overlay metadata using a `surface_container_lowest` (#000000) gradient at the bottom 30% of the image for text legibility.

#### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `full` (pill) radius.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **States:** On press, reduce opacity to 90%. Use a 200ms ease-out transition.

#### Chips (Filtering)
*   **Style:** Use `surface_container_high` with a `sm` (0.25rem) radius.
*   **Active State:** Background becomes `secondary` (#ac89ff), text becomes `on_secondary` (#290067).

#### Input Fields
*   **Style:** `surface_container_low` background, no border, `md` (0.75rem) radius.
*   **Focus:** Transition the background to `surface_container_highest` and add a 1px "Ghost Border" using the `primary` token at 30% opacity.

#### Immersive Video Scrubber
*   **Track:** `outline_variant` at 20% opacity.
*   **Progress:** Linear gradient of `primary` to `tertiary`.
*   **Knob:** `on_surface` (white) with a `primary` glow.

---

### 6. Do’s and Don’ts

**Do:**
*   **Do** use asymmetrical spacing. Allow a larger margin-top for a headline than margin-bottom to create editorial "flow."
*   **Do** use `secondary` (#ac89ff) and `tertiary` (#65afff) for subtle accenting, such as "New" badges or active play-states.
*   **Do** embrace the dark. Use `surface_container_lowest` (#000000) for the deepest focus modes (e.g., full-screen video players).

**Don’t:**
*   **Don’t** use a divider line between list items. Use 16px or 24px of vertical white space to separate thoughts.
*   **Don’t** use pure white (#FFFFFF) for body text. Use `on_surface_variant` (#aaabb0) for secondary info to maintain the "Dark Gallery" vibe.
*   **Don’t** use hard-edged shadows. If the shadow is visible as a "line," it is too dark and too small. Increase the blur.
*   **Don’t** use the `error` color (#ff716c) for anything other than critical destructive actions; its vibrancy will break the immersive calm of the system.