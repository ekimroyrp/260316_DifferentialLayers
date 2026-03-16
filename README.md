# 260316_DifferentialLayers

260316_DifferentialLayers is a Three.js interactive differential-growth project focused on 2D user-drawn curves that evolve together as one shared system. You sketch open/closed curves directly on the ground plane, preview them as ribbon geometry, then run growth with repulsion, iteration smoothing, edge-length control, adaptive splitting, mask painting, timeline playback, and export outputs.

## Features

- Multi-curve drawing workflow on the ground plane with open-curve (`Enter`) and close-on-start-click behavior.
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
  - On: each iteration is stacked upward, with vertical spacing equal to Ribbon Width.
- Ribbon mesh now extrudes upward with thickness equal to `Ribbon Width` (height = width).
- Draw visibility toggles:
  - `Show Mesh` (default on): show/hide ribbon mesh.
  - `Show Path` (default off): show/hide curve path overlay.
  - `Show Points` (default off): show/hide growth points overlay.
- Clicked authoring points are displayed as larger markers to distinguish them from growth points:
  - completed curve points are gray,
  - active draft points are white,
  - the start point turns green when hovering close enough to click-close the draft.
- Authored control-point editing in draw mode:
  - hover an existing control point to highlight it dark orange,
  - click/select a control point to highlight it bright orange,
  - drag the selected point to reshape the authored base curve.
- Mask preservation during authoring edits:
  - moving control points keeps existing mask intent and reprojects mask onto updated curve samples,
  - changing `Start Subdivision` keeps mask intent and remaps mask to the new subdivision density.
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
  - hover an authored control point: dark-orange point highlight
  - click an authored control point: bright-orange active highlight
  - drag selected authored control point: reshape the curve
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
  - `Reset`: reset geometry back to simulation start state while preserving mask intent
  - `Simulation Timeline`: scrub recorded steps (when paused)
- Visibility:
  - `Show Mesh`: toggle ribbon mesh visibility
  - `Show Path`: toggle path/curve overlay visibility
  - `Show Points`: toggle growth points overlay visibility
- Editing:
  - `Ctrl + Z`: undo
  - `Ctrl + Y` or `Ctrl + Shift + Z`: redo
