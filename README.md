# 260316_DifferentialLayers

260316_DifferentialLayers is a graphics-focused project for building and testing differential layer ideas in an interactive scene. The repository is structured so core logic, visual output, and controls can be iterated quickly while keeping setup simple for local development.

## Features

- Differential layer system scaffold (base architecture for layered behavior).
- Real-time interactive rendering workflow (planned scene loop + updates).
- Modular project layout for adding simulation, shading, and controls.
- Expandable input mapping for keyboard/mouse-driven testing.

## Getting Started

1. Clone the repository:
   `git clone https://github.com/ekimroyrp/260316_DifferentialLayers.git`
2. Enter the project folder:
   `cd 260316_DifferentialLayers`
3. Add project source files (app entry, renderer, layer logic).
4. Install dependencies once `package.json` is added:
   `npm install`
5. Run the local dev server (after scripts are defined):
   `npm run dev`

## Controls

- `LMB` / pointer drag: orbit or inspect scene (when camera controls are enabled).
- `W / A / S / D`: move focus or test object (if mapped).
- `Q / E`: adjust layer parameter up/down (if mapped).
- `R`: reset simulation state (if mapped).
- `Space`: pause/resume update loop (if mapped).
