# Test Plan – Unpack & Play 3D

## Overview
Defines the quality checks required before sharing the game with the family.

## Environments
- **Browsers:** Chrome (latest), Edge (latest), Firefox (latest), Safari (latest stable on macOS/iOS).
- **Devices:** Desktop/laptop (1920×1080, 1280×800), tablet (768×1024), phone (360×640).

## Test Suites
### 1. Smoke (Manual)
- Launch via `npm run start` and verify splash ? menu ? play flow.
- Confirm no console errors/warnings.
- Toggle the diagnostics panel (`D`) and ensure FPS/draw-call metrics update.

### 2. Core Gameplay (Manual + Automated)
- Drag, rotation (Q/E, Alt+wheel), snap toggle (`G`), delete (`Del`), undo/redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z).
- Shelf/floor validation cues (green glow valid, magenta halo invalid) with toast guidance.
- Open boxes, ensure SVG extrusion fallback behaves, switch profiles, change themes, autosave state, reset room workflow.
- Exercise the design palette: paint walls/floor/trim/rug/lights, verify colors persist across reload and reset correctly.
- Screenshot export, JSON export/import verification, diagnostics toggle, grid snap toggle.

### 3. Accessibility
- Keyboard-only path from splash to item placement (tab order, focus styling, space/enter activation).
- Verify ARIA roles (modals, toasts, HUD), tooltip text, prefers-reduced-motion handling (camera damping + particles + lights).
- Run axe-core (`npm run test:ui` with axe integration) and confirm zero critical issues.

### 4. Automated Unit Tests (Vitest)
- Grid snapping math.
- AABB collision / shelf bounds.
- Rotation helpers.
- Scene serialization/deserialization + history stack helpers.

### 5. E2E (Playwright)
1. Start the dev server (`npm run start`).
2. Flow: open a glowing box, drag + snap an item, rotate, toggle grid, apply a paint swatch, save.
3. Reload and confirm autosave restores positions + palette for the active profile.
4. Capture screenshot for regression comparison.
5. Store traces/screenshots under `reports/playwright/`.

### 6. Performance
- Run Lighthouse (`npm run perf`) from a warm cache; require =90 for Performance, Accessibility, Best Practices.
- Watch FPS and draw calls via diagnostics; target: draw calls < 150, textures < 64?MB, idle CPU < 10% on a mid-tier laptop.
- Ensure ambient particles dim and string lights soften when reduced motion is enabled.

### 7. Responsive & Touch
- Resize to each breakpoint; HUD should reflow and remain usable.
- Mobile Safari/Chrome: tap-drag, pinch zoom, two-finger orbit, paint via swatches.
- Confirm the touch hint toast appears only once per session.

## Exit Criteria
- `npm run lint`, `npm run test`, and `npm run e2e` succeed.
- Axe-core report shows zero critical findings.
- Lighthouse report meets =90 thresholds.
- Manual checklist complete; QA report updated for any defects/fixes.