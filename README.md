# 260316_DifferentialLayers

260316_DifferentialLayers is a Three.js interactive differential-growth project focused on 2D user-drawn curves that evolve together as one shared system. You sketch open/closed curves directly on the ground plane, preview them as ribbon geometry, then run growth with repulsion, iteration smoothing, edge-length control, adaptive splitting, mask painting, timeline playback, and export outputs.

## Features

- Multi-curve path workflow on the ground plane with open-curve (`Enter`) and close-on-start-click behavior.
- Live `Start Subdivision` preview updates while dragging, including path line and point overlays.
- Live draw-time ribbon preview before simulation starts.
- Shared differential-growth engine for all curves with:
  - resampling to target spacing,
  - adaptive segment splitting,
  - global repulsion across curves,
  - point-to-segment self-collision repulsion to reduce curve overlaps/intersections,
  - iteration smoothing and shape retention,
  - side-bias control to favor either side of the drawn median curve,
  - seeded variation and deterministic snapshots.
- Mask workflow (paint/erase/blur/clear) applied to curve growth.
- Mask-reset behavior preserves baseline pre-run mask while also projecting paused runtime mask edits back onto reset state.
- Reused visual stack from the 3D predecessor:
  - same panel style/environment look,
  - bloom + FXAA postprocessing,
  - gradient/material controls.
- Infinite fading ground grid (ShoeShaper-style) integrated into the scene.
- Timeline scrubbing, undo/redo shortcuts, and export support (`OBJ`, `GLB`, `PNG`).
- `Stack Layers` simulation toggle:
  - Off (default): classic single-layer simulation view.
  - On: each iteration is stacked upward, with vertical spacing equal to Path Thickness.
- `Flip Stack` toggle (default off):
  - When enabled together with `Stack Layers`, oldest layers are placed at the top and new layers are placed at the bottom while staying above ground.
- Ribbon mesh now extrudes upward with thickness equal to `Path Thickness` (height = width).
- Path visibility toggles:
  - `Show Mesh` (default on): show/hide ribbon mesh.
  - `Show Curve` (default off): show/hide curve path overlay.
  - `Show Points` (default off): show/hide growth points overlay.
- Clicked authoring points are displayed as larger markers to distinguish them from growth points:
  - completed curve points are gray,
  - active draft points are white,
  - the start point turns green when hovering close enough to click-close the draft.
- Authored control-point editing in draw mode:
  - hover an existing control point to highlight it dark orange,
  - click/select a control point to highlight it bright orange,
  - drag the selected point to reshape the authored base curve,
  - click a finished path segment (only when not drawing another path) to insert a new control point based on the visible subdivided curve shape,
  - `Shift + Click` a control point to remove that authored control point and rebuild the path,
  - `Shift + Click` a finished path segment (only when not drawing another path) to delete that finished path.
- Mask preservation during authoring edits:
  - moving control points keeps existing mask intent and reprojects mask onto updated curve samples,
  - changing `Start Subdivision` keeps mask intent and remaps mask to the new subdivision density,
  - deleting control points also remaps existing mask intent to the rebuilt path,
  - inserting control points remaps existing mask intent to the rebuilt path.
- Slider value labels are directly editable by click/type (with Enter/blur commit and Esc cancel), without spinner arrows.
- Unfinished-path handling:
  - `Start` clears any unfinished in-progress path instead of auto-finalizing it.
  - Simulation runs only with finished paths.
  - If no finished paths exist, `Start` does not run simulation.
  - `Reset` clears unfinished in-progress path state.
- Paused draw lock: after pausing simulation, drawing is blocked until `Reset` or `Clear All`.

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

- Drawing:
  - `LMB`: add curve point on the ground plane
  - click finished path segment (while not drawing): insert control point on the displayed subdivided curve path
  - `Reset Subdivision` button: reset `Start Subdivision` back to its default value
  - hover an authored control point: dark-orange point highlight
  - click an authored control point: bright-orange active highlight
  - drag selected authored control point: reshape the curve
  - `Shift + Click` authored control point: delete that authored control point and rebuild the path
  - `Shift + Click` finished path segment (while not drawing): delete that finished path
  - `Enter`: end current curve as open
  - hover near first point while drawing: start point turns green (close-ready)
  - click near first point while drawing: close curve and end it
  - next `LMB`: start a new curve
  - after `Pause`: drawing is locked until `Reset` or `Clear All`
- Camera:
  - `RMB`: orbit
  - `MMB`: pan
  - `Wheel`: zoom
- Mask mode:
  - `LMB`: paint mask
  - `Shift + LMB`: erase mask
  - clicking `Enter Mask Mode`, `Blur Mask`, or `Clear Mask` while running pauses simulation and enters mask mode
- Simulation:
  - `Start/Pause`: run or stop growth
  - `Start` with an unfinished path: unfinished path is discarded; only finished paths run
  - `Reset`: reset geometry back to simulation start state while preserving mask intent
  - `Simulation Timeline`: scrub recorded steps (when paused)
- Visibility:
  - `Show Mesh`: toggle ribbon mesh visibility
  - `Show Curve`: toggle path/curve overlay visibility
  - `Show Points`: toggle growth points overlay visibility
- Stack:
  - `Stack Layers`: render timeline layers in vertical stack
  - `Flip Stack`: with stack enabled, place oldest layers at top and latest layers at bottom (still above ground)
- Editing:
  - `Ctrl + Z`: undo
  - `Ctrl + Y` or `Ctrl + Shift + Z`: redo
