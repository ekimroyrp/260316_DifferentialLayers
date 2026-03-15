# 260316_DifferentialLayers

260316_DifferentialLayers is a Three.js interactive differential-growth project focused on 2D user-drawn curves that evolve together as one shared system. You sketch open/closed curves directly on the ground plane, then run growth with repulsion, cohesion/smoothing, spring-like edge control, adaptive splitting, mask painting, timeline playback, and export outputs.

## Features

- Multi-curve drawing workflow on the ground plane with open-curve (`Enter`) and close-on-start-click behavior.
- Shared differential-growth engine for all curves with:
  - resampling to target spacing,
  - adaptive segment splitting,
  - global repulsion across curves,
  - point-to-segment self-collision repulsion to reduce curve overlaps/intersections,
  - smoothing/cohesion and shape retention,
  - side-bias control to favor either side of the drawn median curve,
  - seeded variation and deterministic snapshots.
- Mask workflow (paint/erase/blur/clear) applied to curve growth.
- Reused visual stack from the 3D predecessor:
  - same panel style/environment look,
  - bloom + FXAA postprocessing,
  - gradient/material controls.
- Infinite fading ground grid (ShoeShaper-style) integrated into the scene.
- Timeline scrubbing, undo/redo shortcuts, and export support (`OBJ`, `GLB`, `PNG`).

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
  - `Enter`: end current curve as open
  - click near first point while drawing: close curve and end it
  - next `LMB`: start a new curve
- Camera:
  - `RMB`: orbit
  - `MMB`: pan
  - `Wheel`: zoom
- Mask mode:
  - `LMB`: paint mask
  - `Shift + LMB`: erase mask
- Simulation:
  - `Start/Pause`: run or stop growth
  - `Reset`: reset simulation state
  - `Simulation Timeline`: scrub recorded steps (when paused)
- Editing:
  - `Ctrl + Z`: undo
  - `Ctrl + Y` or `Ctrl + Shift + Z`: redo
