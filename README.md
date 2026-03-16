# 260316_DifferentialLayers

260316_DifferentialLayers is a Three.js differential-growth sketch tool where you draw 2D paths, reshape them with direct point editing, and simulate layered ribbon growth with mask painting, timeline playback, and export tools. It is designed for fast iteration between path authoring, simulation tuning, and output.

## Features

- Multi-path authoring on the ground plane with open finish (`Enter`) or close-to-start finish (start point highlights green on hover).
- Control-point editing on finished paths: dark-orange hover, bright-orange active selection, drag to reshape, click path to add points, and `Shift + LMB` to delete points or full paths.
- Draft/finalized point states are clearer: draft points stay white, completed path points turn gray.
- `Start Subdivision` works with authored edits and supports `Reset Subdivision` for fast return to default.
- Mask workflow (`paint`, `erase`, `blur`, `clear`) persists through point moves/add/delete and subdivision changes, and reset keeps the current mask state.
- Differential-growth simulation with seeded jitter, repulsion, splitting, smoothing, shape retention, side bias, timeline scrubbing, and adjustable simulation rate.
- Stack visualization with `Stack Layers` + `Flip Stack`, including per-layer curve/point overlays when `Show Curve` and `Show Points` are enabled.
- Visibility-aware export: OBJ/GLB/Screenshot reflect what is currently on screen (mesh, curve, points, single layer vs full stack), and curve export uses joined polylines.
- UI quality-of-life updates: editable numeric value fields, always-available `Start`, `Reset`, `Reset Subdivision`, and `Delete All Paths`.

## Getting Started

1. Clone the repository:
   `git clone https://github.com/ekimroyrp/260316_DifferentialLayers.git`
2. Enter the project folder:
   `cd 260316_DifferentialLayers`
3. Install dependencies:
   `npm install`
4. Run development server:
   `npm run dev`
5. Build production bundle:
   `npm run build`
6. Run tests:
   `npm test`

## Controls

- Path authoring:
  - `LMB`: draw/add path points
  - `Enter`: finish current path as open
  - connect to start point: finish current path as closed
  - `LMB` on finished path segment (while not drawing): insert point
  - `Shift + LMB` on finished path segment (while not drawing): delete path
  - hover control point: dark-orange highlight
  - `LMB` control point: bright-orange active highlight
  - `LMB + Drag` control point: move point
  - `Shift + LMB` control point: delete point
- Camera:
  - `Wheel`: zoom
  - `MMB`: pan
  - `RMB`: orbit
- Mask mode:
  - `LMB`: paint
  - `Shift + LMB`: erase
  - `Blur Mask` and `Clear Mask` update masks used by simulation/reset
- Simulation:
  - `Start/Pause`: run or pause growth
  - `Start` with unfinished draft path: draft is discarded, only finished paths run
  - `Reset`: reset simulation state using current masks and finished paths
  - `Simulation Timeline`: scrub recorded frames while paused
- Visibility and stacking:
  - `Show Mesh`, `Show Curve`, `Show Points`: toggle visible geometry types
  - `Stack Layers`: show layered history stack
  - `Flip Stack`: invert stack ordering while keeping growth above ground
- Shortcuts:
  - `Ctrl + Z`: undo
  - `Ctrl + Y` or `Ctrl + Shift + Z`: redo

## Deployment

- **Local production preview:** `npm install`, then `npm run build -- --base=./` followed by `npm run preview` to inspect the compiled bundle locally.
- **Publish to GitHub Pages:** From a clean `main`, run `npm run build -- --base=./`. In a separate temp clone/worktree, checkout (or create) `gh-pages`, copy everything inside `dist/` to the branch root, include `.nojekyll` (and any required static folders like `env/`), commit with a descriptive message, then `git push origin gh-pages`.
- **Live demo:** https://ekimroyrp.github.io/260316_DifferentialLayers/
