# Unpack & Play 3D

Unpack & Play 3D is a cozy Three.js sandbox where the family can unpack SVG-crafted toys, rotate them in 3D, recolor the room, and decorate themed spaces with gentle guidance, autosave, and accessibility-minded controls.

## Quick Start

1. **Install dependencies (first run only)**
   ```bash
   npm install
   ```
2. **Launch the dev server**
   ```bash
   npm run start
   ```
   The project serves on `http://localhost:5173` by default (pass a different `-l` flag if you prefer another port).
3. **Open the game** in your browser at the printed URL.

> Opening `index.html` directly from disk triggers CORS errors—always serve the folder.

## Controls Cheat Sheet

### Mouse & Keyboard
- **Orbit camera:** right-button drag; scroll to zoom.
- **Drag items:** left-click an item and pull it out of the box or around the room.
- **Rotate items:** press `Q`/`E`, click the HUD buttons, or hold `Alt` + mouse wheel for fine steps.
- **Snap helpers:** toggle the HUD switch or hit `G` to enable/disable grid snapping; valid spots glow green, invalid placements glow magenta.
- **Design palette:** press the ?? *Paint* button in the HUD to recolor walls, floors, trim, rugs, and the new string lights.
- **Placement tools:** `Delete` removes the selected item; `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`) undo/redo moves, rotations, or deletes.
- **Diagnostics:** press `D` to reveal FPS, draw calls, triangles, textures, and GPU info.

### Touch / Tablet
- **Orbit camera:** two-finger drag; pinch to zoom.
- **Drag items:** single-finger drag.
- **Rotate items:** use the on-screen rotate buttons.
- A one-time toast explains touch gestures when you first tap.

## Profiles, Saves, and Sharing
- Profiles (Suruli, Shimmy, Guest) are chunky buttons on the splash screen; each keeps its own autosave.
- Autosave fires after every placement, rotation, palette tweak, or settings change (stored in `localStorage`).
- HUD quick actions:
  - `?? Screenshot` downloads a PNG of the current room.
  - `?? Export` saves a JSON snapshot (layout, colors, settings).
  - `?? Import` loads a previously exported snapshot.
- The Settings modal toggles big UI mode, mutes audio, respects prefers-reduced-motion, and includes a **Reset Room** button (with confirmation).

## Painting the Room
The design palette (??) opens a swatch grid for walls, accent wall, floor, trim, rugs, accent mat, and new string lights. Colors apply instantly, persist per profile, and export/import correctly. Use *Reset Theme Colors* to revert to the active theme.

## Adding New SVG Items
1. Drop your SVG into `assets/svg/` (keep shapes simple for nice extrusion).
2. Append an entry to the `itemsConfig` array in `main.js` with the SVG path, scale, depth, box index, and drop height.
3. Reload the page—new toys spawn inside the assigned box and inherit drag, snap, rotate, and autosave behaviour.
4. Extremely intricate SVGs fall back to a sprite billboard so nothing disappears.

## LAN Hosting
Want to share the room around the house?

```bash
npm run start -- -l 0.0.0.0:5173
```

Then visit `http://<your-lan-ip>:5173` from other devices on the network.

## Feature Highlights
- Animated splash with menu links for Play / Profiles / Settings / Tutorial / Credits.
- Replayable tutorial overlay that guides box opening, dragging, snapping, rotating, and free play.
- String-light garlands, rugs, mats, and ambient particles that recolor with the current theme (and dim automatically for reduced-motion users).
- Undo/redo history, delete, grid snap toggle, diagnostics HUD, screenshot/export/import, and autosave per profile.
- Fully responsive layout (360×640 through desktop), keyboard-navigation support, ARIA toasts, and big UI mode for younger decorators.

## Project Structure
```
README.md          # You're here
index.html         # Splash, overlays, HUD, modals
styles.css         # Responsive cartoon styling, palette UI, overlays
main.js            # Three.js scene, gameplay logic, palette management, saves
assets/svg/        # SVG artwork extruded into 3D toys
.eslintrc.json     # ESLint configuration
package.json       # Scripts + dev dependencies (serve, ESLint, Prettier, Vitest, Playwright, Axe, Lighthouse)
reports/           # Test/audit output (Playwright, Lighthouse)
TEST_PLAN.md       # Manual + automated QA strategy
QA_REPORT.md       # Defect log
CHANGELOG.md       # Release notes
```

## Useful Scripts
- `npm run start` — serve locally on port 5173 with live reload.
- `npm run lint` — ESLint across the project (no warnings allowed).
- `npm run format` — Prettier write across the repo.
- `npm run test` — Vitest unit tests (placeholders ready for expansion).
- `npm run test:ui` — Vitest watch/UI mode.
- `npm run e2e` — Playwright end-to-end suite (spins up the local server automatically).
- `npm run perf` — Lighthouse audit saved to `reports/lighthouse.html`.

Have fun expanding the toy chest—add SVGs, craft new tutorials, or dream up fresh palettes. Everything reloads instantly during development.