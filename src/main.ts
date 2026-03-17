import './style.css';
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MOUSE,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Points,
  PointsMaterial,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { DifferentialGrowthEngine, type DifferentialGrowthSnapshot } from './core/differentialGrowthEngine';
import { buildSubdividedCurve, isWithinCloseThreshold } from './core/drawUtils';
import { InfiniteFadingGrid } from './core/infiniteGrid';
import { MaterialController } from './core/materialController';
import type {
  AppState,
  CurveData,
  CurvePoint,
  GradientType,
  GrowthSettings,
  MaskSettings,
  MaterialSettings,
  SimulationSettings,
  ViewMode,
} from './types';

type Ui = {
  panel: HTMLDivElement;
  handleTop: HTMLDivElement;
  handleBottom: HTMLDivElement;
  collapseToggle: HTMLButtonElement;
  start: HTMLButtonElement;
  reset: HTMLButtonElement;
  maskMode: HTMLButtonElement;
  blurMask: HTMLButtonElement;
  clearMask: HTMLButtonElement;
  resetSubdivision: HTMLButtonElement;
  clearCurves: HTMLButtonElement;
  startSubdivision: HTMLInputElement;
  startSubdivisionValue: HTMLSpanElement;
  growthSpeed: HTMLInputElement;
  growthSpeedValue: HTMLSpanElement;
  timeline: HTMLInputElement;
  timelineValue: HTMLSpanElement;
  stackLayers: HTMLInputElement;
  flipStack: HTMLInputElement;
  showMesh: HTMLInputElement;
  showPath: HTMLInputElement;
  showPoints: HTMLInputElement;
  seed: HTMLInputElement;
  seedValue: HTMLSpanElement;
  seedInfluence: HTMLInputElement;
  seedInfluenceValue: HTMLSpanElement;
  brushRadius: HTMLInputElement;
  brushRadiusValue: HTMLSpanElement;
  falloffOffset: HTMLInputElement;
  falloffOffsetValue: HTMLSpanElement;
  growthStep: HTMLInputElement;
  growthStepValue: HTMLSpanElement;
  targetEdgeLength: HTMLInputElement;
  targetEdgeLengthValue: HTMLSpanElement;
  splitThreshold: HTMLInputElement;
  splitThresholdValue: HTMLSpanElement;
  repulsion: HTMLInputElement;
  repulsionValue: HTMLSpanElement;
  smoothing: HTMLInputElement;
  smoothingValue: HTMLSpanElement;
  shapeRetention: HTMLInputElement;
  shapeRetentionValue: HTMLSpanElement;
  sideBias: HTMLInputElement;
  sideBiasValue: HTMLSpanElement;
  maxVertices: HTMLInputElement;
  maxVerticesValue: HTMLSpanElement;
  ribbonWidth: HTMLInputElement;
  ribbonWidthValue: HTMLSpanElement;
  gradientType: HTMLSelectElement;
  gradientStart: HTMLInputElement;
  gradientEnd: HTMLInputElement;
  curvatureContrast: HTMLInputElement;
  curvatureContrastValue: HTMLSpanElement;
  curvatureBias: HTMLInputElement;
  curvatureBiasValue: HTMLSpanElement;
  gradientBlur: HTMLInputElement;
  gradientBlurValue: HTMLSpanElement;
  fresnel: HTMLInputElement;
  fresnelValue: HTMLSpanElement;
  specular: HTMLInputElement;
  specularValue: HTMLSpanElement;
  bloom: HTMLInputElement;
  bloomValue: HTMLSpanElement;
  exportObj: HTMLButtonElement;
  exportGlb: HTMLButtonElement;
  exportScreenshot: HTMLButtonElement;
  overlay: SVGSVGElement;
  brushCircle: SVGCircleElement;
  falloffCircle: SVGCircleElement;
  brushDot: SVGCircleElement;
};

type TimelineEntry = { step: number; snapshot: DifferentialGrowthSnapshot };
type ExportPrimitive =
  | { kind: 'mesh'; geometry: BufferGeometry; positionZ: number }
  | { kind: 'polyline'; points: CurvePoint[]; closed: boolean; positionZ: number; color: Color }
  | { kind: 'point'; geometry: BufferGeometry; positionZ: number; color: Color };
type UndoState = {
  curves: CurveData[];
  draft: CurvePoint[];
  viewMode: ViewMode;
  engineReady: boolean;
  snapshot: DifferentialGrowthSnapshot | null;
  baseCurves: CurveData[];
};
type EditableControlPointRef =
  | { source: 'curve'; curveIndex: number; pointIndex: number }
  | { source: 'draft'; pointIndex: number };
type CurveInsertTarget = {
  curveIndex: number;
  controlSegmentIndex: number;
  segmentStart: CurvePoint;
  segmentEnd: CurvePoint;
};

const CLOSE_THRESHOLD_PX = 16;
const EDIT_POINT_HIT_THRESHOLD_PX = 16;
const INSERT_POINT_HIT_THRESHOLD_PX = 12;
const FIXED_MASK_BLUR_STRENGTH = 0.35;
const MAX_TIMELINE = 240;
const MAX_UNDO = 80;
const CLICKED_POINT_COMPLETE_COLOR = new Color(0x8d8d8d);
const CLICKED_POINT_DRAFT_COLOR = new Color(0xffffff);
const EDIT_POINT_HOVER_COLOR = 0xc06a00;
const EDIT_POINT_ACTIVE_COLOR = 0xffa01f;

const must = <T extends Element>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as unknown as T;
};

const ui: Ui = {
  panel: must('ui-panel'),
  handleTop: must('ui-handle'),
  handleBottom: must('ui-handle-bottom'),
  collapseToggle: must('collapse-toggle'),
  start: must('start-sim'),
  reset: must('reset-sim'),
  maskMode: must('mask-mode'),
  blurMask: must('blur-mask'),
  clearMask: must('clear-mask'),
  resetSubdivision: must('reset-subdivision'),
  clearCurves: must('clear-curves'),
  startSubdivision: must('start-subdivision'),
  startSubdivisionValue: must('start-subdivision-value'),
  growthSpeed: must('growth-speed'),
  growthSpeedValue: must('growth-speed-value'),
  timeline: must('simulation-timeline'),
  timelineValue: must('simulation-timeline-value'),
  stackLayers: must('stack-layers'),
  flipStack: must('flip-stack'),
  showMesh: must('show-mesh'),
  showPath: must('show-path'),
  showPoints: must('show-points'),
  seed: must('seed-value'),
  seedValue: must('seed-value-label'),
  seedInfluence: must('seed-influence'),
  seedInfluenceValue: must('seed-influence-value'),
  brushRadius: must('brush-radius'),
  brushRadiusValue: must('brush-radius-value'),
  falloffOffset: must('falloff-offset'),
  falloffOffsetValue: must('falloff-offset-value'),
  growthStep: must('growth-step'),
  growthStepValue: must('growth-step-value'),
  targetEdgeLength: must('target-edge-length'),
  targetEdgeLengthValue: must('target-edge-length-value'),
  splitThreshold: must('split-threshold'),
  splitThresholdValue: must('split-threshold-value'),
  repulsion: must('repulsion'),
  repulsionValue: must('repulsion-value'),
  smoothing: must('smoothing'),
  smoothingValue: must('smoothing-value'),
  shapeRetention: must('shape-retention'),
  shapeRetentionValue: must('shape-retention-value'),
  sideBias: must('side-bias'),
  sideBiasValue: must('side-bias-value'),
  maxVertices: must('max-vertices'),
  maxVerticesValue: must('max-vertices-value'),
  ribbonWidth: must('ribbon-width'),
  ribbonWidthValue: must('ribbon-width-value'),
  gradientType: must('gradient-type'),
  gradientStart: must('gradient-start-color'),
  gradientEnd: must('gradient-end-color'),
  curvatureContrast: must('curvature-contrast'),
  curvatureContrastValue: must('curvature-contrast-value'),
  curvatureBias: must('curvature-bias'),
  curvatureBiasValue: must('curvature-bias-value'),
  gradientBlur: must('gradient-blur'),
  gradientBlurValue: must('gradient-blur-value'),
  fresnel: must('fresnel'),
  fresnelValue: must('fresnel-value'),
  specular: must('specular'),
  specularValue: must('specular-value'),
  bloom: must('bloom'),
  bloomValue: must('bloom-value'),
  exportObj: must('export-obj'),
  exportGlb: must('export-glb'),
  exportScreenshot: must('export-screenshot'),
  overlay: must('brush-overlay'),
  brushCircle: must('brush-circle'),
  falloffCircle: must('falloff-circle'),
  brushDot: must('brush-dot'),
};

const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');
if (!canvas) throw new Error('Missing canvas');

const simulationSettings: SimulationSettings = {
  growthSpeed: parseFloat(ui.growthSpeed.value),
  seed: parseInt(ui.seed.value, 10),
  seedInfluence: parseFloat(ui.seedInfluence.value),
};
const maskSettings: MaskSettings = {
  brushRadius: parseFloat(ui.brushRadius.value),
  falloffOffset: parseFloat(ui.falloffOffset.value),
};
const growthSettings: GrowthSettings = {
  growthStep: parseFloat(ui.growthStep.value),
  targetEdgeLength: parseFloat(ui.targetEdgeLength.value),
  splitThreshold: parseFloat(ui.splitThreshold.value),
  repulsion: parseFloat(ui.repulsion.value),
  smoothing: parseFloat(ui.smoothing.value),
  shapeRetention: parseFloat(ui.shapeRetention.value),
  sideBias: parseFloat(ui.sideBias.value),
  maxVertices: parseInt(ui.maxVertices.value, 10),
};
const materialSettings: MaterialSettings = {
  gradientType: ui.gradientType.value as GradientType,
  gradientStart: ui.gradientStart.value,
  gradientEnd: ui.gradientEnd.value,
  curvatureContrast: parseFloat(ui.curvatureContrast.value),
  curvatureBias: parseFloat(ui.curvatureBias.value),
  gradientBlur: parseFloat(ui.gradientBlur.value),
  fresnel: parseFloat(ui.fresnel.value),
  specular: parseFloat(ui.specular.value),
  bloom: parseFloat(ui.bloom.value),
};
const appState: AppState = { running: false, viewMode: 'gradient' };
const parsedDefaultStartSubdivision = Number.parseFloat(ui.startSubdivision.defaultValue || ui.startSubdivision.value);
const defaultStartSubdivision = Math.max(1, Math.round(Number.isFinite(parsedDefaultStartSubdivision) ? parsedDefaultStartSubdivision : 1));
const parsedStartSubdivision = Number.parseFloat(ui.startSubdivision.value);
let startSubdivision = Math.max(1, Math.round(Number.isFinite(parsedStartSubdivision) ? parsedStartSubdivision : defaultStartSubdivision));
let baseSubdivision = startSubdivision;

const renderer = new WebGLRenderer({ antialias: true, canvas, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 1.5, 3));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;

const scene = new Scene();
scene.background = new Color(0x111622);
const camera = new PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 500);
camera.position.set(0, 2.6, 3.6);

const groundGrid = new InfiniteFadingGrid({
  width: 200,
  height: 200,
  sectionSize: 5,
  sectionThickness: 1.35,
  cellSize: 1,
  cellThickness: 0.68,
  cellColor: '#8b9095',
  sectionColor: '#5e6368',
  fadeDistance: 140,
  fadeStrength: 1.2,
  infiniteGrid: true,
  followCamera: true,
  y: 0.001,
  opacity: 2,
});
scene.add(groundGrid.mesh);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set(0, 0, 0);
controls.mouseButtons = { LEFT: -1 as unknown as MOUSE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE };
controls.update();
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
ui.panel.addEventListener('contextmenu', (event) => event.preventDefault());

const materialController = new MaterialController(materialSettings);
const simRoot = new Group();
simRoot.rotation.x = -Math.PI / 2;
scene.add(simRoot);
const ribbonMesh = new Mesh(new BufferGeometry(), materialController.material);
simRoot.add(ribbonMesh);
const layerGroup = new Group();
simRoot.add(layerGroup);
const pathLineMaterial = new LineBasicMaterial({ color: 0x2bb2ff, transparent: true, opacity: 0.9 });
const lineMesh = new LineSegments(new BufferGeometry(), pathLineMaterial);
simRoot.add(lineMesh);
const stackLineGroup = new Group();
simRoot.add(stackLineGroup);
const pathPointMaterial = new PointsMaterial({
  color: 0x7fb3ff,
  size: 9,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0.98,
  depthTest: false,
  depthWrite: false,
});
const pointsMesh = new Points(new BufferGeometry(), pathPointMaterial);
pointsMesh.renderOrder = 30;
simRoot.add(pointsMesh);
const stackPointGroup = new Group();
simRoot.add(stackPointGroup);
const closeCurveHintGeometry = new BufferGeometry();
closeCurveHintGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
const closeCurveHintMesh = new Points(closeCurveHintGeometry, new PointsMaterial({
  color: 0x44ff7a,
  size: 22,
  sizeAttenuation: false,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
}));
closeCurveHintMesh.renderOrder = 33;
closeCurveHintMesh.visible = false;
simRoot.add(closeCurveHintMesh);
const hoverEditPointGeometry = new BufferGeometry();
hoverEditPointGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
const hoverEditPointMesh = new Points(hoverEditPointGeometry, new PointsMaterial({
  color: EDIT_POINT_HOVER_COLOR,
  size: 22,
  sizeAttenuation: false,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
}));
hoverEditPointMesh.renderOrder = 34;
hoverEditPointMesh.visible = false;
simRoot.add(hoverEditPointMesh);
const activeEditPointGeometry = new BufferGeometry();
activeEditPointGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
const activeEditPointMesh = new Points(activeEditPointGeometry, new PointsMaterial({
  color: EDIT_POINT_ACTIVE_COLOR,
  size: 24,
  sizeAttenuation: false,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
}));
activeEditPointMesh.renderOrder = 35;
activeEditPointMesh.visible = false;
simRoot.add(activeEditPointMesh);
const clickedPointsMesh = new Points(new BufferGeometry(), new PointsMaterial({
  color: 0xffffff,
  size: 18,
  sizeAttenuation: false,
  vertexColors: true,
  transparent: true,
  opacity: 1,
  depthTest: false,
  depthWrite: false,
}));
clickedPointsMesh.renderOrder = 32;
simRoot.add(clickedPointsMesh);

const engine = new DifferentialGrowthEngine(growthSettings, simulationSettings.seed);
const previewEngine = new DifferentialGrowthEngine({ ...growthSettings }, simulationSettings.seed);
engine.setGradientBlur(materialSettings.gradientBlur);

const composerTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
composerTarget.samples = Math.min(4, renderer.capabilities.maxSamples);
const composer = new EffectComposer(renderer, composerTarget);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), materialSettings.bloom, 0.7, 0.15);
composer.addPass(bloomPass);
const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);

const updatePostSize = () => {
  const pr = Math.min(window.devicePixelRatio * 1.5, 3);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(pr);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
  fxaaPass.material.uniforms.resolution.value.set(1 / (window.innerWidth * pr), 1 / (window.innerHeight * pr));
};

const raycaster = new Raycaster();
const plane = new Plane(new Vector3(0, 1, 0), 0);
const pointer = new Vector2();
const tmpV = new Vector3();
const tmpS = new Vector2();
const pointerScreen = new Vector2();

let curves: CurveData[] = [];
let draft: CurvePoint[] = [];
let nextCurveId = 1;
let engineReady = false;
let baseCurves: CurveData[] = [];
let baseResetSnapshot: DifferentialGrowthSnapshot | null = null;
const stackLayerCurves: CurveData[][] = [];
const timeline: TimelineEntry[] = [];
let timelineStep = 0;
let timelineSync = false;
let painting = false;
let draggingPanel = false;
let drawLockedAfterPause = false;
let showClickedPointsAfterReset = false;
let clickedPointCount = 0;
let closeCurveHintActive = false;
let hoverControlPoint: EditableControlPointRef | null = null;
let activeControlPoint: EditableControlPointRef | null = null;
let draggingControlPoint = false;
let deferredMaskSnapshot: DifferentialGrowthSnapshot | null = null;
const dragOffset = { x: 0, y: 0 };

const undo: UndoState[] = [];
const redo: UndoState[] = [];

const cloneCurves = (input: CurveData[]) => input.map((c) => ({ id: c.id, closed: c.closed, points: c.points.map((p) => ({ ...p })) }));
const cloneDraft = (input: CurvePoint[]) => input.map((p) => ({ ...p }));

function captureState(): UndoState {
  return {
    curves: cloneCurves(curves),
    draft: cloneDraft(draft),
    viewMode: appState.viewMode,
    engineReady,
    snapshot: engineReady ? engine.exportSnapshot() : null,
    baseCurves: cloneCurves(baseCurves),
  };
}

function pushUndoState() {
  undo.push(captureState());
  while (undo.length > MAX_UNDO) undo.shift();
  redo.length = 0;
}

function restoreState(state: UndoState) {
  curves = cloneCurves(state.curves);
  draft = cloneDraft(state.draft);
  deferredMaskSnapshot = null;
  appState.running = false;
  appState.viewMode = state.viewMode;
  engineReady = state.engineReady;
  baseCurves = cloneCurves(state.baseCurves);
  if (state.engineReady && state.snapshot) {
    engine.importSnapshot(state.snapshot);
    resetTimeline();
  } else {
    refreshRibbon();
    clearTimeline();
  }
  refreshOverlays();
  syncUi();
  refreshStatus();
}

function undoStep() {
  if (appState.running || undo.length === 0) return;
  const prev = undo.pop();
  if (!prev) return;
  redo.push(captureState());
  restoreState(prev);
}

function redoStep() {
  if (appState.running || redo.length === 0) return;
  const next = redo.pop();
  if (!next) return;
  undo.push(captureState());
  restoreState(next);
}

function rangeStepPrecision(step: number) {
  const text = `${step}`.toLowerCase();
  if (text.includes('e-')) {
    const parts = text.split('e-');
    return Number.parseInt(parts[1] ?? '0', 10) || 0;
  }
  const dot = text.indexOf('.');
  return dot < 0 ? 0 : text.length - dot - 1;
}

function normalizeRangeValue(input: HTMLInputElement, value: number) {
  let next = Number.isFinite(value) ? value : Number.parseFloat(input.value);
  const min = Number.parseFloat(input.min);
  const max = Number.parseFloat(input.max);
  const step = Number.parseFloat(input.step);

  if (Number.isFinite(min)) next = Math.max(min, next);
  if (Number.isFinite(max)) next = Math.min(max, next);

  if (Number.isFinite(step) && step > 0) {
    const base = Number.isFinite(min) ? min : 0;
    next = base + Math.round((next - base) / step) * step;
    const precision = rangeStepPrecision(step);
    if (precision > 0) next = Number(next.toFixed(precision));
  }

  if (Number.isFinite(min)) next = Math.max(min, next);
  if (Number.isFinite(max)) next = Math.min(max, next);
  return next;
}

function bindEditableRangeValue(
  input: HTMLInputElement,
  label: HTMLSpanElement,
  fmt: (v: number) => string,
  applyValue: (v: number) => void,
) {
  let isManualEditing = false;

  const commitManualValue = (rawValue: string) => {
    if (input.disabled) {
      label.textContent = fmt(Number.parseFloat(input.value));
      return;
    }
    const parsed = Number.parseFloat(rawValue.trim().replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      label.textContent = fmt(Number.parseFloat(input.value));
      return;
    }
    applyValue(parsed);
  };

  const beginManualEdit = () => {
    if (isManualEditing || input.disabled) return;
    isManualEditing = true;

    const editor = document.createElement('input');
    editor.type = 'number';
    editor.className = 'value-editor';
    editor.value = input.value;
    if (input.min) editor.min = input.min;
    if (input.max) editor.max = input.max;
    if (input.step) editor.step = input.step;

    label.replaceWith(editor);
    editor.focus();
    editor.select();

    let finalized = false;
    const finish = (commit: boolean) => {
      if (finalized) return;
      finalized = true;
      const submitted = editor.value;
      editor.replaceWith(label);
      isManualEditing = false;
      if (commit) commitManualValue(submitted);
      else label.textContent = fmt(Number.parseFloat(input.value));
    };

    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finish(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }
    });
    editor.addEventListener('blur', () => finish(true));
  };

  label.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    beginManualEdit();
  });
}

function bindRange(input: HTMLInputElement, label: HTMLSpanElement, fmt: (v: number) => string, onInput: (v: number) => void) {
  const applyValue = (next: number) => {
    const normalized = normalizeRangeValue(input, next);
    input.value = `${normalized}`;
    label.textContent = fmt(normalized);
    onInput(normalized);
    updateRangeProgress(input);
  };

  input.addEventListener('input', () => applyValue(Number.parseFloat(input.value)));
  bindEditableRangeValue(input, label, fmt, applyValue);
  applyValue(Number.parseFloat(input.value));
}

function updateRangeProgress(input: HTMLInputElement) {
  const value = Number.parseFloat(input.value);
  const min = Number.parseFloat(input.min);
  const max = Number.parseFloat(input.max);
  const p = Number.isFinite(min) && Number.isFinite(max) && max > min ? ((value - min) / (max - min)) * 100 : 100;
  input.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, p))}%`);
}

function bindCustomSelect(select: HTMLSelectElement) {
  const control = select.closest('.select-control');
  const shell = control?.querySelector('.select-shell');
  if (!control || !shell) return;

  select.classList.add('native-select-hidden');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.id = `${select.id}-trigger`;
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('ul');
  menu.className = 'select-menu';
  menu.id = `${select.id}-menu`;
  menu.hidden = true;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-labelledby', trigger.id);

  type OptionButton = HTMLButtonElement & { dataset: DOMStringMap & { value: string; index: string } };
  const optionButtons: OptionButton[] = [];
  const optionValues = Array.from(select.options).map((option) => option.value);
  let activeIndex = Math.max(0, optionValues.indexOf(select.value));

  const buildOptionButton = (index: number, label: string, value: string): OptionButton => {
    const item = document.createElement('li');
    const button = document.createElement('button') as OptionButton;
    button.type = 'button';
    button.className = 'select-option';
    button.dataset.value = value;
    button.dataset.index = `${index}`;
    button.textContent = label;
    button.setAttribute('role', 'option');
    item.appendChild(button);
    menu.appendChild(item);
    return button;
  };

  Array.from(select.options).forEach((option, index) => {
    optionButtons.push(buildOptionButton(index, option.textContent ?? option.value, option.value));
  });

  const setOpen = (open: boolean) => {
    control.classList.toggle('is-open', open);
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const updateSelectionUi = () => {
    const selectedIndex = Math.max(0, optionValues.indexOf(select.value));
    const selectedButton = optionButtons[selectedIndex];
    trigger.textContent = selectedButton?.textContent ?? select.value;
    optionButtons.forEach((button, index) => {
      const selected = index === selectedIndex;
      const active = index === activeIndex;
      button.classList.toggle('is-selected', selected);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });
  };

  const setActiveIndex = (index: number) => {
    if (optionButtons.length === 0) return;
    const count = optionButtons.length;
    activeIndex = ((index % count) + count) % count;
    updateSelectionUi();
  };

  const chooseIndex = (index: number) => {
    const nextValue = optionValues[index];
    if (nextValue === undefined) return;
    const changed = select.value !== nextValue;
    select.value = nextValue;
    activeIndex = index;
    updateSelectionUi();
    setOpen(false);
    if (changed) {
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const openMenu = (focusOption = false) => {
    setActiveIndex(Math.max(0, optionValues.indexOf(select.value)));
    setOpen(true);
    if (focusOption) optionButtons[activeIndex]?.focus();
  };

  select.addEventListener('change', () => {
    activeIndex = Math.max(0, optionValues.indexOf(select.value));
    updateSelectionUi();
    setOpen(false);
  });

  trigger.addEventListener('click', () => {
    if (control.classList.contains('is-open')) setOpen(false);
    else openMenu();
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!control.classList.contains('is-open')) openMenu(true);
      else {
        setActiveIndex(activeIndex + 1);
        optionButtons[activeIndex]?.focus();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!control.classList.contains('is-open')) openMenu(true);
      else {
        setActiveIndex(activeIndex - 1);
        optionButtons[activeIndex]?.focus();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (control.classList.contains('is-open')) chooseIndex(activeIndex);
      else openMenu(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  });

  optionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number.parseInt(button.dataset.index, 10);
      chooseIndex(index);
      trigger.focus();
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(activeIndex + 1);
        optionButtons[activeIndex]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(activeIndex - 1);
        optionButtons[activeIndex]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        chooseIndex(activeIndex);
        trigger.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.focus();
      } else if (event.key === 'Tab') {
        setOpen(false);
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Node) || !control.contains(target)) setOpen(false);
  });

  shell.prepend(menu);
  shell.prepend(trigger);
  updateSelectionUi();
}

function bindSectionCollapses() {
  const headers = Array.from(document.querySelectorAll<HTMLElement>('.panel-section-header'));
  for (const header of headers) {
    const section = header.closest('.panel-section');
    if (!section) continue;
    header.tabIndex = 0;
    const toggle = () => section.classList.toggle('is-collapsed');
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  }
}

function clampPanelToViewport() {
  const margin = 10;
  const menuScaleRaw = getComputedStyle(document.documentElement).getPropertyValue('--menu-scale').trim();
  const menuScale = Number.parseFloat(menuScaleRaw) || 1;
  const maxTop = Math.max(margin, window.innerHeight - ui.panel.offsetHeight * menuScale - margin);
  const maxLeft = Math.max(margin, window.innerWidth - ui.panel.offsetWidth * menuScale - margin);
  const top = Math.min(Math.max(ui.panel.offsetTop, margin), maxTop);
  const left = Math.min(Math.max(ui.panel.offsetLeft, margin), maxLeft);
  ui.panel.style.top = `${top}px`;
  ui.panel.style.left = `${left}px`;
  ui.panel.style.right = 'auto';
}

function removeLayerAt(index: number) {
  const child = layerGroup.children[index];
  if (!child) return;
  if (child instanceof Mesh) child.geometry.dispose();
  layerGroup.remove(child);
}

function removeStackOverlayAt(index: number) {
  const lineChild = stackLineGroup.children[index];
  if (lineChild instanceof LineSegments) lineChild.geometry.dispose();
  if (lineChild) stackLineGroup.remove(lineChild);

  const pointChild = stackPointGroup.children[index];
  if (pointChild instanceof Points) pointChild.geometry.dispose();
  if (pointChild) stackPointGroup.remove(pointChild);
}

function clearLayerStack() {
  for (let i = layerGroup.children.length - 1; i >= 0; i -= 1) {
    removeLayerAt(i);
  }
  for (let i = Math.max(stackLineGroup.children.length, stackPointGroup.children.length) - 1; i >= 0; i -= 1) {
    removeStackOverlayAt(i);
  }
  stackLayerCurves.length = 0;
}

function isLayerStackEnabled() {
  return ui.stackLayers.checked;
}

function isFlipStackEnabled() {
  return ui.flipStack.checked;
}

function isMeshDisplayEnabled() {
  return ui.showMesh.checked;
}

function isPathDisplayEnabled() {
  return ui.showPath.checked;
}

function isPointDisplayEnabled() {
  return ui.showPoints.checked;
}

function isStackDisplayActive() {
  return isLayerStackEnabled() && layerGroup.children.length > 0 && (appState.running || timeline.length > 1) && appState.viewMode !== 'mask';
}

function syncPathVisibility() {
  const showPath = isPathDisplayEnabled();
  const showStack = isStackDisplayActive();
  lineMesh.visible = showPath && !showStack;
  stackLineGroup.visible = showPath && showStack;
}

function syncPointVisibility() {
  const showPoints = isPointDisplayEnabled();
  const showStack = isStackDisplayActive();
  pointsMesh.visible = showPoints && !showStack;
  stackPointGroup.visible = showPoints && showStack;
}

function canEditControlPoints() {
  return !appState.running && appState.viewMode !== 'mask' && !drawLockedAfterPause;
}

function sameEditableControlPoint(a: EditableControlPointRef | null, b: EditableControlPointRef | null) {
  if (!a || !b || a.source !== b.source) return false;
  if (a.source === 'curve' && b.source === 'curve') {
    return a.curveIndex === b.curveIndex && a.pointIndex === b.pointIndex;
  }
  if (a.source === 'draft' && b.source === 'draft') {
    return a.pointIndex === b.pointIndex;
  }
  return false;
}

function getEditableControlPoint(ref: EditableControlPointRef): CurvePoint | null {
  if (ref.source === 'curve') {
    const curve = curves[ref.curveIndex];
    return curve?.points[ref.pointIndex] ?? null;
  }
  return draft[ref.pointIndex] ?? null;
}

function isEditableControlPointValid(ref: EditableControlPointRef | null): ref is EditableControlPointRef {
  if (!ref) return false;
  return getEditableControlPoint(ref) !== null;
}

function writeHintPointPosition(geometry: BufferGeometry, point: CurvePoint) {
  const position = geometry.getAttribute('position') as BufferAttribute;
  position.setXYZ(0, point.x, point.y, 0);
  position.needsUpdate = true;
}

function syncEditableControlPointHints() {
  if (!canEditControlPoints()) {
    hoverControlPoint = null;
    activeControlPoint = null;
    draggingControlPoint = false;
    hoverEditPointMesh.visible = false;
    activeEditPointMesh.visible = false;
    return;
  }

  if (!isEditableControlPointValid(activeControlPoint)) {
    activeControlPoint = null;
    draggingControlPoint = false;
  }
  if (!isEditableControlPointValid(hoverControlPoint)) {
    hoverControlPoint = null;
  }

  if (activeControlPoint) {
    const point = getEditableControlPoint(activeControlPoint);
    if (point) {
      writeHintPointPosition(activeEditPointGeometry, point);
      activeEditPointMesh.visible = true;
    } else {
      activeEditPointMesh.visible = false;
    }
  } else {
    activeEditPointMesh.visible = false;
  }

  if (hoverControlPoint && !sameEditableControlPoint(hoverControlPoint, activeControlPoint)) {
    const point = getEditableControlPoint(hoverControlPoint);
    if (point) {
      writeHintPointPosition(hoverEditPointGeometry, point);
      hoverEditPointMesh.visible = true;
    } else {
      hoverEditPointMesh.visible = false;
    }
  } else {
    hoverEditPointMesh.visible = false;
  }
}

function setHoverControlPoint(ref: EditableControlPointRef | null) {
  hoverControlPoint = ref;
  syncEditableControlPointHints();
}

function setActiveControlPoint(ref: EditableControlPointRef | null) {
  activeControlPoint = ref;
  syncEditableControlPointHints();
}

function findEditableControlPoint(pointerPos: Vector2): EditableControlPointRef | null {
  if (!canEditControlPoints()) return null;

  let closest: EditableControlPointRef | null = null;
  let closestDistanceSq = EDIT_POINT_HIT_THRESHOLD_PX * EDIT_POINT_HIT_THRESHOLD_PX;

  for (let curveIndex = 0; curveIndex < curves.length; curveIndex += 1) {
    const curve = curves[curveIndex];
    for (let pointIndex = 0; pointIndex < curve.points.length; pointIndex += 1) {
      const screen = worldToScreen(curve.points[pointIndex]);
      const dx = screen.x - pointerPos.x;
      const dy = screen.y - pointerPos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > closestDistanceSq) continue;
      closestDistanceSq = distanceSq;
      closest = { source: 'curve', curveIndex, pointIndex };
    }
  }

  const skipDraftStart = canCloseDraftCurve();
  for (let pointIndex = 0; pointIndex < draft.length; pointIndex += 1) {
    if (skipDraftStart && pointIndex === 0) continue;
    const screen = worldToScreen(draft[pointIndex]);
    const dx = screen.x - pointerPos.x;
    const dy = screen.y - pointerPos.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > closestDistanceSq) continue;
    closestDistanceSq = distanceSq;
    closest = { source: 'draft', pointIndex };
  }

  return closest;
}

function updateEditableControlPointHover(event: PointerEvent) {
  pointerScreen.set(event.clientX, event.clientY);
  setHoverControlPoint(findEditableControlPoint(pointerScreen));
}

function moveEditableControlPoint(ref: EditableControlPointRef, worldPoint: Vector3) {
  const point = getEditableControlPoint(ref);
  if (!point) return false;
  const dx = point.x - worldPoint.x;
  const dy = point.y - worldPoint.y;
  if (dx * dx + dy * dy < 1e-8) return false;
  point.x = worldPoint.x;
  point.y = worldPoint.y;
  point.z = 0;
  return true;
}

function moveActiveControlPoint(worldPoint: Vector3) {
  if (!activeControlPoint) return;
  if (!moveEditableControlPoint(activeControlPoint, worldPoint)) return;
  if (engineReady) {
    deferredMaskSnapshot = engine.exportSnapshot();
  }
  engineReady = false;
  clearTimeline();
  refreshRibbon();
  refreshOverlays();
  refreshStatus();
}

function segmentPointDistanceSq(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-8) {
    const dx = px - ax;
    const dy = py - ay;
    return dx * dx + dy * dy;
  }
  const t = MathUtils.clamp(((px - ax) * vx + (py - ay) * vy) / lenSq, 0, 1);
  const cx = ax + vx * t;
  const cy = ay + vy * t;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
}

function projectPointToSegment2d(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
  const vx = bx - ax;
  const vy = by - ay;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-8) return { x: ax, y: ay };
  const t = MathUtils.clamp(((px - ax) * vx + (py - ay) * vy) / lenSq, 0, 1);
  return { x: ax + vx * t, y: ay + vy * t };
}

function findCurveInsertTarget(pointerPos: Vector2): CurveInsertTarget | null {
  if (!canEditControlPoints() || draft.length > 0 || curves.length === 0) return null;

  let best: CurveInsertTarget | null = null;
  let bestDistanceSq = INSERT_POINT_HIT_THRESHOLD_PX * INSERT_POINT_HIT_THRESHOLD_PX;
  const safeSubdivision = Math.max(1, Math.round(startSubdivision));

  for (let curveIndex = 0; curveIndex < curves.length; curveIndex += 1) {
    const curve = curves[curveIndex];
    const pointCount = curve.points.length;
    if (pointCount < 2) continue;

    const previewPoints = buildSubdividedCurve(curve.points, curve.closed, safeSubdivision);
    const previewCount = previewPoints.length;
    const previewSegmentLimit = curve.closed ? previewCount : previewCount - 1;
    const controlSegmentCount = curve.closed ? pointCount : pointCount - 1;
    if (previewSegmentLimit <= 0 || controlSegmentCount <= 0) continue;

    for (let segmentIndex = 0; segmentIndex < previewSegmentLimit; segmentIndex += 1) {
      const a = previewPoints[segmentIndex];
      const b = previewPoints[(segmentIndex + 1) % previewCount];
      const aScreen = worldToScreen(a);
      const bScreen = worldToScreen(b);
      const distanceSq = segmentPointDistanceSq(
        aScreen.x,
        aScreen.y,
        bScreen.x,
        bScreen.y,
        pointerPos.x,
        pointerPos.y,
      );
      if (distanceSq > bestDistanceSq) continue;
      bestDistanceSq = distanceSq;
      const controlSegmentIndex = Math.min(controlSegmentCount - 1, Math.floor(segmentIndex / safeSubdivision));
      best = {
        curveIndex,
        controlSegmentIndex,
        segmentStart: { x: a.x, y: a.y, z: a.z ?? 0 },
        segmentEnd: { x: b.x, y: b.y, z: b.z ?? 0 },
      };
    }
  }

  return best;
}

function insertControlPointOnCurve(target: CurveInsertTarget, worldPoint: Vector3) {
  const curve = curves[target.curveIndex];
  if (!curve) return false;
  const count = curve.points.length;
  if (count < 2) return false;

  const aIndex = target.controlSegmentIndex;
  const bIndex = (aIndex + 1) % count;
  const snapped = projectPointToSegment2d(
    target.segmentStart.x,
    target.segmentStart.y,
    target.segmentEnd.x,
    target.segmentEnd.y,
    worldPoint.x,
    worldPoint.y,
  );
  curve.points.splice(bIndex, 0, { x: snapped.x, y: snapped.y, z: 0 });
  return true;
}

function deleteEditableControlPoint(ref: EditableControlPointRef) {
  if (ref.source === 'draft') {
    if (ref.pointIndex < 0 || ref.pointIndex >= draft.length) return false;
    draft.splice(ref.pointIndex, 1);
    return true;
  }

  const curve = curves[ref.curveIndex];
  if (!curve) return false;
  if (ref.pointIndex < 0 || ref.pointIndex >= curve.points.length) return false;

  curve.points.splice(ref.pointIndex, 1);
  const minPoints = curve.closed ? 3 : 2;
  if (curve.points.length < minPoints) {
    curves.splice(ref.curveIndex, 1);
  }
  return true;
}

function canCloseDraftCurve() {
  return canEditControlPoints() && draft.length >= 2;
}

function isPointerNearDraftStart(pointerPos: Vector2) {
  if (!canCloseDraftCurve()) return false;
  const startScreen = worldToScreen(draft[0]);
  return isWithinCloseThreshold(startScreen, pointerPos, CLOSE_THRESHOLD_PX);
}

function syncCloseCurveHint() {
  if (!canCloseDraftCurve()) {
    closeCurveHintActive = false;
    closeCurveHintMesh.visible = false;
    return;
  }
  if (!closeCurveHintActive) {
    closeCurveHintMesh.visible = false;
    return;
  }
  const start = draft[0];
  if (!start) {
    closeCurveHintMesh.visible = false;
    return;
  }
  const position = closeCurveHintGeometry.getAttribute('position') as BufferAttribute;
  position.setXYZ(0, start.x, start.y, 0);
  position.needsUpdate = true;
  closeCurveHintMesh.visible = true;
}

function setCloseCurveHintActive(active: boolean) {
  if (closeCurveHintActive === active) {
    if (active) syncCloseCurveHint();
    return;
  }
  closeCurveHintActive = active;
  syncCloseCurveHint();
}

function updateCloseCurveHint(event: PointerEvent) {
  pointerScreen.set(event.clientX, event.clientY);
  setCloseCurveHintActive(isPointerNearDraftStart(pointerScreen));
}

function getClickedPointCurves() {
  if (!engineReady) return curves;
  if (baseCurves.length > 0) return baseCurves;
  return curves;
}

function syncClickedPointVisibility() {
  const visibleContext = !appState.running && appState.viewMode !== 'mask' && !drawLockedAfterPause;
  const duringDrawing = draft.length > 0;
  const atSimulationStart = timelineStep === 0;
  clickedPointsMesh.visible = visibleContext && (duringDrawing || showClickedPointsAfterReset || atSimulationStart) && clickedPointCount > 0;
}

function refreshClickedPoints() {
  const authoredCurves = getClickedPointCurves();
  const arr: number[] = [];
  const colors: number[] = [];

  const pushPoint = (point: CurvePoint, color: Color) => {
    arr.push(point.x, point.y, 0);
    colors.push(color.r, color.g, color.b);
  };

  for (const curve of authoredCurves) {
    for (const point of curve.points) {
      pushPoint(point, CLICKED_POINT_COMPLETE_COLOR);
    }
  }
  for (const point of draft) {
    pushPoint(point, CLICKED_POINT_DRAFT_COLOR);
  }

  const next = new BufferGeometry();
  next.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
  next.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  const prev = clickedPointsMesh.geometry;
  clickedPointsMesh.geometry = next;
  prev.dispose();
  clickedPointCount = arr.length / 3;
  syncClickedPointVisibility();
}

function updateLayerHeights() {
  const heightStep = parseFloat(ui.ribbonWidth.value);
  const flipStack = isLayerStackEnabled() && isFlipStackEnabled();
  const applyGroupHeights = (group: Group) => {
    const count = group.children.length;
    for (let i = 0; i < count; i += 1) {
      const heightIndex = flipStack ? count - 1 - i : i;
      group.children[i].position.set(0, 0, heightIndex * heightStep);
    }
  };
  applyGroupHeights(layerGroup);
  applyGroupHeights(stackLineGroup);
  applyGroupHeights(stackPointGroup);
}

function syncLayerVisibility() {
  const showStack = isStackDisplayActive();
  const showMesh = isMeshDisplayEnabled();
  layerGroup.visible = showMesh && showStack;
  ribbonMesh.visible = showMesh && !showStack;
  syncPathVisibility();
  syncPointVisibility();
}

function pushCurrentLayer() {
  if (!engineReady) return;
  const layerMesh = new Mesh(ribbonMesh.geometry.clone(), materialController.material);
  layerMesh.frustumCulled = false;
  layerGroup.add(layerMesh);

  const layerCurves = engine.getCurves();
  const layerLine = new LineSegments(buildLineGeometry(layerCurves, false, false), pathLineMaterial);
  layerLine.frustumCulled = false;
  stackLineGroup.add(layerLine);

  const layerPoints = new Points(buildPointGeometry(layerCurves, false, false), pathPointMaterial);
  layerPoints.frustumCulled = false;
  layerPoints.renderOrder = 30;
  stackPointGroup.add(layerPoints);
  stackLayerCurves.push(cloneCurves(layerCurves));

  updateLayerHeights();
  syncLayerVisibility();
}

function rebuildLayerStack(maxIndex = timeline.length - 1) {
  clearLayerStack();
  if (!engineReady || timeline.length === 0 || maxIndex < 0) {
    syncLayerVisibility();
    return;
  }

  const saved = engine.exportSnapshot();
  const safeMax = Math.min(maxIndex, timeline.length - 1);
  const ribbonWidth = parseFloat(ui.ribbonWidth.value);

  for (let i = 0; i <= safeMax; i += 1) {
    engine.importSnapshot(timeline[i].snapshot);
    const layerMesh = new Mesh(engine.getRibbonGeometry(ribbonWidth), materialController.material);
    layerMesh.frustumCulled = false;
    layerGroup.add(layerMesh);

    const layerCurves = engine.getCurves();
    const layerLine = new LineSegments(buildLineGeometry(layerCurves, false, false), pathLineMaterial);
    layerLine.frustumCulled = false;
    stackLineGroup.add(layerLine);

    const layerPoints = new Points(buildPointGeometry(layerCurves, false, false), pathPointMaterial);
    layerPoints.frustumCulled = false;
    layerPoints.renderOrder = 30;
    stackPointGroup.add(layerPoints);
    stackLayerCurves.push(cloneCurves(layerCurves));
  }

  engine.importSnapshot(saved);
  updateLayerHeights();
  syncLayerVisibility();
}

function clearTimeline() {
  timeline.length = 0;
  timelineStep = 0;
  clearLayerStack();
  syncTimeline();
}

function resetTimeline() {
  timeline.length = 0;
  timelineStep = 0;
  if (engineReady) timeline.push({ step: 0, snapshot: engine.exportSnapshot() });
  clearLayerStack();
  syncTimeline();
}

function syncTimeline() {
  timelineSync = true;
  if (timeline.length === 0) {
    ui.timeline.min = '0'; ui.timeline.max = '0'; ui.timeline.value = '0'; ui.timelineValue.textContent = '0';
  } else {
    ui.timeline.min = `${timeline[0].step}`;
    ui.timeline.max = `${timeline[timeline.length - 1].step}`;
    ui.timeline.value = `${timelineStep}`;
    ui.timelineValue.textContent = `${timelineStep}`;
  }
  ui.timeline.disabled = appState.running || timeline.length === 0;
  updateRangeProgress(ui.timeline);
  timelineSync = false;
}

function findTimelineIndexByStep(step: number) {
  for (let i = 0; i < timeline.length; i += 1) {
    if (timeline[i].step === step) return i;
  }
  return -1;
}

function appendTimeline() {
  timelineStep += 1;
  timeline.push({ step: timelineStep, snapshot: engine.exportSnapshot() });
  if (isLayerStackEnabled()) pushCurrentLayer();
  if (timeline.length > MAX_TIMELINE) {
    timeline.shift();
    if (isLayerStackEnabled()) {
      removeLayerAt(0);
      removeStackOverlayAt(0);
      if (stackLayerCurves.length > 0) stackLayerCurves.shift();
      updateLayerHeights();
    }
  }
  syncTimeline();
}

function pointerToPlane(event: PointerEvent): Vector3 | null {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = new Vector3();
  if (!raycaster.ray.intersectPlane(plane, hit)) {
    return null;
  }
  simRoot.worldToLocal(hit);
  hit.z = 0;
  return hit;
}

function isPanelTarget(event: Event): boolean {
  return event.target instanceof Element && event.target.closest('#ui-panel') !== null;
}

function worldToScreen(world: { x: number; y: number; z?: number } | Vector3): Vector2 {
  const rect = renderer.domElement.getBoundingClientRect();
  tmpV.set(world.x, world.y, 0);
  simRoot.localToWorld(tmpV);
  tmpV.project(camera);
  tmpS.set(rect.left + (tmpV.x * 0.5 + 0.5) * rect.width, rect.top + (-tmpV.y * 0.5 + 0.5) * rect.height);
  return tmpS.clone();
}

function ensureEngine(setBase = true, subdivisionOverride?: number, maskSnapshotOverride?: DifferentialGrowthSnapshot | null): boolean {
  if (curves.length === 0) return false;
  const effectiveSubdivision = subdivisionOverride ?? startSubdivision;
  const preparedCurves = curves.map((curve) => ({
    ...curve,
    points: buildSubdividedCurve(curve.points, curve.closed, effectiveSubdivision).map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z ?? 0,
    })),
  }));
  engine.reseed(simulationSettings.seed);
  engine.setGrowthSettings(growthSettings);
  engine.setCurves(preparedCurves, growthSettings.targetEdgeLength);
  engine.setGradientBlur(materialSettings.gradientBlur);
  const maskSnapshot = maskSnapshotOverride ?? deferredMaskSnapshot;
  if (maskSnapshot) {
    engine.applyMaskFromSnapshot(maskSnapshot, 'replace');
  }
  deferredMaskSnapshot = null;
  engineReady = true;
  if (setBase) {
    baseCurves = cloneCurves(curves);
    baseSubdivision = effectiveSubdivision;
    baseResetSnapshot = engine.exportSnapshot();
  }
  refreshRibbon();
  resetTimeline();
  return true;
}

function refreshRibbon() {
  let next: BufferGeometry | null = null;
  if (engineReady) {
    next = engine.getRibbonGeometry(parseFloat(ui.ribbonWidth.value));
  } else {
    const previewCurves = buildPreviewRibbonCurves();
    if (previewCurves.length === 0) {
      clearRibbon();
      return;
    }
    previewEngine.reseed(simulationSettings.seed);
    previewEngine.setGrowthSettings(growthSettings);
    previewEngine.setGradientBlur(materialSettings.gradientBlur);
    previewEngine.setCurves(previewCurves, growthSettings.targetEdgeLength);
    if (deferredMaskSnapshot) {
      previewEngine.applyMaskFromSnapshot(deferredMaskSnapshot, 'replace');
    }
    next = previewEngine.getRibbonGeometry(parseFloat(ui.ribbonWidth.value));
  }

  if (!next) {
    clearRibbon();
    return;
  }
  const prev = ribbonMesh.geometry;
  ribbonMesh.geometry = next;
  prev.dispose();
  syncLayerVisibility();
}

function clearRibbon() {
  const prev = ribbonMesh.geometry;
  ribbonMesh.geometry = new BufferGeometry();
  prev.dispose();
  syncLayerVisibility();
}

function getOverlayCurves() {
  if (appState.running && engineReady) return engine.getCurves();
  return curves;
}

function buildPreviewRibbonCurves() {
  const previewCurves: CurveData[] = curves.map((curve) => ({
    id: curve.id,
    closed: curve.closed,
    points: buildSubdividedCurve(curve.points, curve.closed, startSubdivision).map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z ?? 0,
    })),
  }));

  if (draft.length >= 2) {
    previewCurves.push({
      id: -1,
      closed: false,
      points: buildSubdividedCurve(draft, false, startSubdivision).map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z ?? 0,
      })),
    });
  }

  return previewCurves;
}

function getPreviewCurvePoints(curve: CurveData) {
  if (appState.running) return curve.points;
  return buildSubdividedCurve(curve.points, curve.closed, startSubdivision);
}

function buildLineGeometry(sourceCurves: CurveData[], includeDraft = true, usePreviewPoints = true): BufferGeometry {
  const arr: number[] = [];
  const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => arr.push(a.x, a.y, 0, b.x, b.y, 0);
  for (const c of sourceCurves) {
    const points = usePreviewPoints ? getPreviewCurvePoints(c) : c.points;
    const limit = c.closed ? points.length : points.length - 1;
    for (let i = 0; i < limit; i += 1) seg(points[i], points[(i + 1) % points.length]);
  }
  if (includeDraft) {
    for (let i = 0; i < draft.length - 1; i += 1) seg(draft[i], draft[i + 1]);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
  return g;
}

function buildPointGeometry(sourceCurves: CurveData[], includeDraft = true, usePreviewPoints = true): BufferGeometry {
  const arr: number[] = [];
  for (const c of sourceCurves) {
    const points = usePreviewPoints ? getPreviewCurvePoints(c) : c.points;
    for (const p of points) arr.push(p.x, p.y, 0);
  }
  if (includeDraft) {
    for (const p of draft) arr.push(p.x, p.y, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
  return g;
}

function refreshOverlays() {
  const overlayCurves = getOverlayCurves();
  const l = buildLineGeometry(overlayCurves);
  const p = buildPointGeometry(overlayCurves);
  lineMesh.geometry.dispose(); pointsMesh.geometry.dispose();
  lineMesh.geometry = l; pointsMesh.geometry = p;
  syncPathVisibility();
  syncPointVisibility();
  syncEditableControlPointHints();
  syncCloseCurveHint();
  refreshClickedPoints();
}

function refreshStatus() {
  // Path-section live status notifications removed by request.
}

function syncUi() {
  ui.start.textContent = appState.running ? 'Pause' : 'Start';
  ui.start.classList.toggle('is-start-state', !appState.running);
  ui.start.classList.toggle('is-stop-state', appState.running);
  ui.maskMode.textContent = appState.viewMode === 'mask' ? 'Exit Mask Mode' : 'Enter Mask Mode';
  ui.maskMode.classList.toggle('is-mask-active', appState.viewMode === 'mask');
  ui.resetSubdivision.disabled = false;
  ui.clearCurves.disabled = false;
  syncTimeline();
  syncLayerVisibility();
  syncPathVisibility();
  syncPointVisibility();
  syncEditableControlPointHints();
  syncCloseCurveHint();
  syncClickedPointVisibility();
}

function setMode(mode: ViewMode) {
  appState.viewMode = mode;
  materialController.setViewMode(mode);
  syncLayerVisibility();
  refreshStatus();
}

function addPoint(point: Vector3, event: PointerEvent) {
  if (drawLockedAfterPause) return;
  pointerScreen.set(event.clientX, event.clientY);
  if (isPointerNearDraftStart(pointerScreen)) {
    finalizeDraft(true);
    return;
  }
  const last = draft[draft.length - 1];
  if (last) {
    const dx = point.x - last.x; const dy = point.y - last.y;
    if (dx * dx + dy * dy < 1e-6) return;
  }
  draft.push({ x: point.x, y: point.y, z: 0 });
  engineReady = false;
  clearTimeline();
  refreshRibbon();
  refreshOverlays();
  refreshStatus();
}

function finalizeDraft(closed: boolean): boolean {
  const min = closed ? 3 : 2;
  if (draft.length < min) return false;
  curves.push({ id: nextCurveId++, closed, points: cloneDraft(draft) });
  draft = [];
  setCloseCurveHintActive(false);
  engineReady = false;
  clearTimeline();
  refreshRibbon();
  refreshOverlays();
  refreshStatus();
  return true;
}

function restartSimulationIfActiveOrPaused(shouldRestart: boolean) {
  if (!shouldRestart) return;
  appState.running = false;
  drawLockedAfterPause = false;
  setMode('gradient');
  startStop();
  refreshStatus();
  syncUi();
}

function startStop() {
  if (appState.running) {
    appState.running = false;
    drawLockedAfterPause = true;
    deferredMaskSnapshot = null;
    curves = engine.getCurves();
    engineReady = true;
    refreshOverlays();
    return syncUi();
  }
  if (draft.length > 0) {
    draft = [];
    setCloseCurveHintActive(false);
    setHoverControlPoint(null);
    setActiveControlPoint(null);
    draggingControlPoint = false;
    engineReady = false;
    clearTimeline();
    refreshRibbon();
    refreshOverlays();
    refreshStatus();
  }
  if (!engineReady && !ensureEngine()) {
    refreshStatus();
    syncUi();
    return;
  }

  if (isLayerStackEnabled()) {
    const currentIndex = findTimelineIndexByStep(timelineStep);
    if (currentIndex >= 0 && currentIndex < timeline.length - 1) {
      timeline.splice(currentIndex + 1);
      while (layerGroup.children.length > currentIndex + 1) {
        const removeIndex = layerGroup.children.length - 1;
        removeLayerAt(removeIndex);
        removeStackOverlayAt(removeIndex);
        if (stackLayerCurves.length > removeIndex) stackLayerCurves.splice(removeIndex, 1);
      }
      updateLayerHeights();
    }
    if (layerGroup.children.length === 0) pushCurrentLayer();
  } else {
    clearLayerStack();
  }

  if (timelineStep === 0) {
    baseResetSnapshot = engine.exportSnapshot();
  }
  showClickedPointsAfterReset = false;
  appState.running = true;
  setMode('gradient');
  syncUi();
}

function pauseForMaskMode() {
  if (!appState.running) return;
  appState.running = false;
  drawLockedAfterPause = true;
  curves = engine.getCurves();
  engineReady = true;
  refreshOverlays();
}

function setOverlay(point: Vector3 | null, erase: boolean) {
  if (!point || appState.running || appState.viewMode !== 'mask') {
    ui.brushCircle.style.opacity = '0'; ui.falloffCircle.style.opacity = '0'; ui.brushDot.style.opacity = '0';
    return;
  }
  const c = worldToScreen(point);
  const i = worldToScreen({ x: point.x + maskSettings.brushRadius, y: point.y, z: 0 });
  const o = worldToScreen({ x: point.x + maskSettings.brushRadius + maskSettings.falloffOffset, y: point.y, z: 0 });
  const ir = Math.hypot(i.x - c.x, i.y - c.y);
  const or = Math.max(ir, Math.hypot(o.x - c.x, o.y - c.y));
  const inner = erase ? 'rgba(255,72,72,0.98)' : 'rgba(102,170,255,0.98)';
  const outer = erase ? 'rgba(255,72,72,0.72)' : 'rgba(102,170,255,0.72)';
  ui.brushCircle.style.stroke = inner; ui.brushDot.style.fill = inner; ui.falloffCircle.style.stroke = outer;
  ui.brushCircle.setAttribute('cx', `${c.x}`); ui.brushCircle.setAttribute('cy', `${c.y}`); ui.brushCircle.setAttribute('r', `${ir}`);
  ui.falloffCircle.setAttribute('cx', `${c.x}`); ui.falloffCircle.setAttribute('cy', `${c.y}`); ui.falloffCircle.setAttribute('r', `${or}`);
  ui.brushDot.setAttribute('cx', `${c.x}`); ui.brushDot.setAttribute('cy', `${c.y}`); ui.brushDot.setAttribute('r', '4');
  ui.brushCircle.style.opacity = '1'; ui.brushDot.style.opacity = '1'; ui.falloffCircle.style.opacity = maskSettings.falloffOffset > 0 ? '1' : '0';
}

function paintMask(point: Vector3, erase: boolean) {
  if (!engineReady) return;
  if (erase) engine.eraseMask(point, maskSettings.brushRadius, maskSettings.falloffOffset);
  else engine.paintMask(point, maskSettings.brushRadius, maskSettings.falloffOffset);
  refreshRibbon();
}

function buildMeshVertexColors(geometry: BufferGeometry): Float32Array | null {
  const curv = geometry.getAttribute('aCurvature');
  const disp = geometry.getAttribute('aDisplacement');
  if (!(curv instanceof BufferAttribute) || !(disp instanceof BufferAttribute)) return null;
  const mask = geometry.getAttribute('aMask');
  const colors = new Float32Array(curv.count * 3);
  const c0 = new Color(materialSettings.gradientStart);
  const c1 = new Color(materialSettings.gradientEnd);
  const c = new Color();
  for (let i = 0; i < curv.count; i += 1) {
    const a = MathUtils.clamp(curv.getX(i) * materialSettings.curvatureContrast + materialSettings.curvatureBias, 0, 1);
    const b = MathUtils.clamp(disp.getX(i) * materialSettings.curvatureContrast + materialSettings.curvatureBias, 0, 1);
    c.copy(c0).lerp(c1, materialSettings.gradientType === 'displacement' ? b : a);
    if (appState.viewMode === 'mask' && mask instanceof BufferAttribute) {
      c.setScalar(1 - MathUtils.clamp(mask.getX(i), 0, 1));
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  return colors;
}

function buildDisplayedExportCurves(sourceCurves: CurveData[], includeDraft: boolean, usePreviewPoints: boolean) {
  const out: CurveData[] = [];
  for (const curve of sourceCurves) {
    const points = usePreviewPoints ? getPreviewCurvePoints(curve) : curve.points;
    if (points.length < 2) continue;
    out.push({
      id: curve.id,
      closed: curve.closed,
      points: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
    });
  }
  if (includeDraft && draft.length >= 2) {
    out.push({ id: -1, closed: false, points: cloneDraft(draft) });
  }
  return out;
}

function collectVisibleExportPrimitives(): ExportPrimitive[] {
  const out: ExportPrimitive[] = [];
  const stackActive = isStackDisplayActive();

  if (isMeshDisplayEnabled()) {
    if (stackActive) {
      for (let i = 0; i < layerGroup.children.length; i += 1) {
        const child = layerGroup.children[i];
        if (!(child instanceof Mesh) || !(child.geometry instanceof BufferGeometry)) continue;
        out.push({ kind: 'mesh', geometry: child.geometry, positionZ: child.position.z });
      }
    } else if (ribbonMesh.geometry instanceof BufferGeometry) {
      out.push({ kind: 'mesh', geometry: ribbonMesh.geometry, positionZ: ribbonMesh.position.z });
    }
  }

  if (isPathDisplayEnabled()) {
    if (stackActive) {
      for (let i = 0; i < stackLayerCurves.length; i += 1) {
        const curvesAtLayer = stackLayerCurves[i];
        const layerZ = stackLineGroup.children[i]?.position.z ?? layerGroup.children[i]?.position.z ?? 0;
        for (const curve of curvesAtLayer) {
          if (curve.points.length < 2) continue;
          out.push({
            kind: 'polyline',
            points: curve.points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
            closed: curve.closed,
            positionZ: layerZ,
            color: pathLineMaterial.color.clone(),
          });
        }
      }
    } else {
      const overlayCurves = getOverlayCurves();
      const curvesForExport = buildDisplayedExportCurves(overlayCurves, !appState.running, !appState.running);
      for (const curve of curvesForExport) {
        out.push({
          kind: 'polyline',
          points: curve.points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
          closed: curve.closed,
          positionZ: lineMesh.position.z,
          color: pathLineMaterial.color.clone(),
        });
      }
    }
  }

  if (isPointDisplayEnabled()) {
    if (stackActive) {
      for (let i = 0; i < stackPointGroup.children.length; i += 1) {
        const child = stackPointGroup.children[i];
        if (!(child instanceof Points) || !(child.geometry instanceof BufferGeometry)) continue;
        out.push({ kind: 'point', geometry: child.geometry, positionZ: child.position.z, color: pathPointMaterial.color.clone() });
      }
    } else if (pointsMesh.geometry instanceof BufferGeometry) {
      out.push({ kind: 'point', geometry: pointsMesh.geometry, positionZ: pointsMesh.position.z, color: pathPointMaterial.color.clone() });
    }
  }

  return out;
}

function cloneGeometryForExport(source: BufferGeometry, positionZ: number) {
  const g = source.clone();
  if (Math.abs(positionZ) > 1e-8) {
    g.translate(0, 0, positionZ);
  }
  g.rotateX(-Math.PI / 2);
  return g;
}

function buildPolylineGeometryForExport(points: CurvePoint[], positionZ: number) {
  const arr = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i += 1) {
    const offset = i * 3;
    arr[offset] = points[i].x;
    arr[offset + 1] = points[i].y;
    arr[offset + 2] = points[i].z ?? 0;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(arr, 3));
  if (Math.abs(positionZ) > 1e-8) {
    g.translate(0, 0, positionZ);
  }
  g.rotateX(-Math.PI / 2);
  return g;
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function exportObj() {
  const primitives = collectVisibleExportPrimitives();
  if (primitives.length === 0) return;
  const lines: string[] = [];
  let vertexOffset = 0;

  for (const primitive of primitives) {
    const g = primitive.kind === 'polyline'
      ? buildPolylineGeometryForExport(primitive.points, primitive.positionZ)
      : cloneGeometryForExport(primitive.geometry, primitive.positionZ);
    const pos = g.getAttribute('position');
    if (!(pos instanceof BufferAttribute) || pos.count === 0) {
      g.dispose();
      continue;
    }

    if (primitive.kind === 'mesh') {
      const colors = buildMeshVertexColors(primitive.geometry);
      for (let i = 0; i < pos.count; i += 1) {
        const o = i * 3;
        const r = colors ? colors[o] : 1;
        const gr = colors ? colors[o + 1] : 1;
        const b = colors ? colors[o + 2] : 1;
        lines.push(`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)} ${r} ${gr} ${b}`);
      }
      const idx = g.index;
      if (idx) {
        for (let i = 0; i < idx.count; i += 3) {
          lines.push(`f ${idx.getX(i) + 1 + vertexOffset} ${idx.getX(i + 1) + 1 + vertexOffset} ${idx.getX(i + 2) + 1 + vertexOffset}`);
        }
      } else {
        for (let i = 0; i + 2 < pos.count; i += 3) {
          lines.push(`f ${vertexOffset + i + 1} ${vertexOffset + i + 2} ${vertexOffset + i + 3}`);
        }
      }
    } else if (primitive.kind === 'polyline') {
      const { r, g: gr, b } = primitive.color;
      for (let i = 0; i < pos.count; i += 1) {
        lines.push(`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)} ${r} ${gr} ${b}`);
      }
      const indices: number[] = [];
      for (let i = 0; i < pos.count; i += 1) {
        indices.push(vertexOffset + i + 1);
      }
      if (indices.length >= 2) {
        if (primitive.closed) indices.push(indices[0]);
        lines.push(`l ${indices.join(' ')}`);
      }
    } else {
      const { r, g: gr, b } = primitive.color;
      for (let i = 0; i < pos.count; i += 1) {
        lines.push(`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)} ${r} ${gr} ${b}`);
      }
      for (let i = 0; i < pos.count; i += 1) {
        lines.push(`p ${vertexOffset + i + 1}`);
      }
    }

    vertexOffset += pos.count;
    g.dispose();
  }

  if (vertexOffset === 0) return;
  download(`differential-layers-step-${timelineStep}.obj`, new Blob([lines.join('\n')], { type: 'text/plain' }));
}

function exportGlb() {
  const primitives = collectVisibleExportPrimitives();
  if (primitives.length === 0) return;

  const root = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: { dispose: () => void }[] = [];

  for (const primitive of primitives) {
    const g = primitive.kind === 'polyline'
      ? buildPolylineGeometryForExport(primitive.points, primitive.positionZ)
      : cloneGeometryForExport(primitive.geometry, primitive.positionZ);
    const pos = g.getAttribute('position');
    if (!(pos instanceof BufferAttribute) || pos.count === 0) {
      g.dispose();
      continue;
    }

    geometries.push(g);
    if (primitive.kind === 'mesh') {
      const colors = buildMeshVertexColors(primitive.geometry);
      if (colors) g.setAttribute('color', new BufferAttribute(colors, 3));
      const m = new MeshStandardMaterial({ vertexColors: Boolean(colors), color: 0xffffff, roughness: 0.62, metalness: 0.08 });
      materials.push(m);
      root.add(new Mesh(g, m));
    } else if (primitive.kind === 'polyline') {
      const m = new LineBasicMaterial({
        color: primitive.color,
        transparent: pathLineMaterial.transparent,
        opacity: pathLineMaterial.opacity,
      });
      materials.push(m);
      root.add(primitive.closed ? new LineLoop(g, m) : new Line(g, m));
    } else {
      const m = new PointsMaterial({
        color: primitive.color,
        size: pathPointMaterial.size,
        sizeAttenuation: pathPointMaterial.sizeAttenuation,
        transparent: pathPointMaterial.transparent,
        opacity: pathPointMaterial.opacity,
        depthTest: pathPointMaterial.depthTest,
        depthWrite: pathPointMaterial.depthWrite,
      });
      materials.push(m);
      root.add(new Points(g, m));
    }
  }

  if (root.children.length === 0) {
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    return;
  }

  const cleanup = () => {
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };

  new GLTFExporter().parse(root, (result) => {
    if (result instanceof ArrayBuffer) {
      download(`differential-layers-step-${timelineStep}.glb`, new Blob([result], { type: 'model/gltf-binary' }));
    }
    cleanup();
  }, () => {
    cleanup();
  }, { binary: true });
}

function exportPng() {
  composer.render();
  renderer.domElement.toBlob((blob) => blob && download(`differential-layers-step-${timelineStep}.png`, blob), 'image/png');
}

bindRange(ui.startSubdivision, ui.startSubdivisionValue, (v) => `${Math.round(v)}`, (v) => {
  const nextSubdivision = Math.max(1, Math.round(v));
  if (nextSubdivision === startSubdivision) return;
  if (engineReady) {
    deferredMaskSnapshot = engine.exportSnapshot();
  }
  startSubdivision = nextSubdivision;
  if (draft.length === 0 && curves.length > 0 && ensureEngine(true, startSubdivision)) {
    refreshOverlays();
    refreshStatus();
    syncUi();
    return;
  }
  engineReady = false;
  clearTimeline();
  refreshRibbon();
  refreshOverlays();
  refreshStatus();
  syncUi();
});
bindEditableRangeValue(ui.timeline, ui.timelineValue, (v) => `${Math.round(v)}`, (v) => {
  const next = Math.round(normalizeRangeValue(ui.timeline, v));
  ui.timeline.value = `${next}`;
  ui.timeline.dispatchEvent(new Event('input', { bubbles: true }));
});
bindRange(ui.growthSpeed, ui.growthSpeedValue, (v) => v.toFixed(2), (v) => { simulationSettings.growthSpeed = v; });
bindRange(ui.seed, ui.seedValue, (v) => `${Math.round(v)}`, (v) => { simulationSettings.seed = Math.round(v); engineReady = false; });
bindRange(ui.seedInfluence, ui.seedInfluenceValue, (v) => v.toFixed(2), (v) => { simulationSettings.seedInfluence = v; });
bindRange(ui.brushRadius, ui.brushRadiusValue, (v) => v.toFixed(2), (v) => { maskSettings.brushRadius = v; });
bindRange(ui.falloffOffset, ui.falloffOffsetValue, (v) => v.toFixed(2), (v) => { maskSettings.falloffOffset = v; });
bindRange(ui.growthStep, ui.growthStepValue, (v) => v.toFixed(2), (v) => { growthSettings.growthStep = v; engine.setGrowthSettings(growthSettings); });
bindRange(ui.targetEdgeLength, ui.targetEdgeLengthValue, (v) => v.toFixed(3), (v) => { growthSettings.targetEdgeLength = v; engine.setGrowthSettings(growthSettings); engineReady = false; });
bindRange(ui.splitThreshold, ui.splitThresholdValue, (v) => v.toFixed(2), (v) => { growthSettings.splitThreshold = v; engine.setGrowthSettings(growthSettings); });
bindRange(ui.repulsion, ui.repulsionValue, (v) => v.toFixed(2), (v) => { growthSettings.repulsion = v; engine.setGrowthSettings(growthSettings); });
bindRange(ui.smoothing, ui.smoothingValue, (v) => v.toFixed(2), (v) => { growthSettings.smoothing = v; engine.setGrowthSettings(growthSettings); });
bindRange(ui.shapeRetention, ui.shapeRetentionValue, (v) => v.toFixed(2), (v) => { growthSettings.shapeRetention = v; engine.setGrowthSettings(growthSettings); });
bindRange(ui.sideBias, ui.sideBiasValue, (v) => `${Math.round(v)}`, (v) => { growthSettings.sideBias = Math.max(-100, Math.min(100, Math.round(v))); engine.setGrowthSettings(growthSettings); });
bindRange(ui.maxVertices, ui.maxVerticesValue, (v) => `${Math.round(v)}`, (v) => { growthSettings.maxVertices = Math.round(v); engine.setGrowthSettings(growthSettings); });
bindRange(ui.ribbonWidth, ui.ribbonWidthValue, (v) => v.toFixed(3), () => {
  refreshRibbon();
  if (isLayerStackEnabled()) rebuildLayerStack(findTimelineIndexByStep(timelineStep));
});
bindRange(ui.curvatureContrast, ui.curvatureContrastValue, (v) => v.toFixed(2), (v) => { materialSettings.curvatureContrast = v; materialController.setMaterialSettings(materialSettings); });
bindRange(ui.curvatureBias, ui.curvatureBiasValue, (v) => v.toFixed(2), (v) => { materialSettings.curvatureBias = v; materialController.setMaterialSettings(materialSettings); });
bindRange(ui.gradientBlur, ui.gradientBlurValue, (v) => v.toFixed(2), (v) => { materialSettings.gradientBlur = v; engine.setGradientBlur(v); });
bindRange(ui.fresnel, ui.fresnelValue, (v) => v.toFixed(2), (v) => { materialSettings.fresnel = v; materialController.setMaterialSettings(materialSettings); });
bindRange(ui.specular, ui.specularValue, (v) => v.toFixed(2), (v) => { materialSettings.specular = v; materialController.setMaterialSettings(materialSettings); });
bindRange(ui.bloom, ui.bloomValue, (v) => v.toFixed(2), (v) => { materialSettings.bloom = v; bloomPass.strength = v; });

ui.gradientStart.addEventListener('input', () => { materialSettings.gradientStart = ui.gradientStart.value; materialController.setMaterialSettings(materialSettings); });
ui.gradientEnd.addEventListener('input', () => { materialSettings.gradientEnd = ui.gradientEnd.value; materialController.setMaterialSettings(materialSettings); });
ui.gradientType.addEventListener('change', () => { materialSettings.gradientType = ui.gradientType.value as GradientType; materialController.setMaterialSettings(materialSettings); });

ui.start.addEventListener('click', () => { pushUndoState(); startStop(); refreshStatus(); syncUi(); });
ui.reset.addEventListener('click', () => {
  pushUndoState();
  const currentMaskSnapshot = engineReady ? engine.exportSnapshot() : deferredMaskSnapshot;
  deferredMaskSnapshot = null;
  draggingControlPoint = false;
  setActiveControlPoint(null);
  setHoverControlPoint(null);
  setCloseCurveHintActive(false);
  draft = [];
  drawLockedAfterPause = false;
  showClickedPointsAfterReset = false;
  appState.running = false;
  setMode('gradient');

  if (!engineReady) {
    baseCurves = cloneCurves(curves);
    baseSubdivision = startSubdivision;
  }

  if (baseCurves.length > 0) {
    startSubdivision = baseSubdivision;
    ui.startSubdivision.value = `${baseSubdivision}`;
    ui.startSubdivisionValue.textContent = `${baseSubdivision}`;
    updateRangeProgress(ui.startSubdivision);
    curves = cloneCurves(baseCurves);
    engineReady = false;
    if (ensureEngine(false, baseSubdivision)) {
      if (baseResetSnapshot) {
        engine.importSnapshot(baseResetSnapshot);
      }
      engine.clearMask();
      if (currentMaskSnapshot) {
        engine.applyMaskFromSnapshot(currentMaskSnapshot, 'replace');
      }
      engineReady = true;
      showClickedPointsAfterReset = true;
      refreshRibbon();
      resetTimeline();
    }
  } else {
    deferredMaskSnapshot = null;
    engineReady = false;
    clearRibbon();
    clearTimeline();
  }

  refreshOverlays();
  refreshStatus();
  syncUi();
});
ui.maskMode.addEventListener('click', () => {
  pushUndoState();
  if (appState.viewMode === 'mask') setMode('gradient');
  else {
    pauseForMaskMode();
    if (!engineReady && !ensureEngine()) {
      syncUi();
      return;
    }
    setMode('mask');
  }
  syncUi();
});
ui.blurMask.addEventListener('click', () => {
  pauseForMaskMode();
  if (!engineReady && !ensureEngine()) {
    setMode('mask');
    syncUi();
    return;
  }
  pushUndoState();
  engine.blurMask(FIXED_MASK_BLUR_STRENGTH); refreshRibbon(); setMode('mask'); syncUi();
});
ui.clearMask.addEventListener('click', () => {
  pauseForMaskMode();
  if (!engineReady && !ensureEngine()) {
    setMode('mask');
    syncUi();
    return;
  }
  pushUndoState();
  engine.clearMask(); refreshRibbon(); setMode('mask'); syncUi();
});
ui.resetSubdivision.addEventListener('click', () => {
  const shouldRestart = appState.running || drawLockedAfterPause;
  if (startSubdivision === defaultStartSubdivision && !shouldRestart) return;
  pushUndoState();
  if (startSubdivision !== defaultStartSubdivision) {
    ui.startSubdivision.value = `${defaultStartSubdivision}`;
    ui.startSubdivision.dispatchEvent(new Event('input', { bubbles: true }));
  }
  restartSimulationIfActiveOrPaused(shouldRestart);
});
ui.clearCurves.addEventListener('click', () => {
  const shouldRestart = appState.running || drawLockedAfterPause;
  pushUndoState();
  appState.running = false;
  setMode('gradient');
  drawLockedAfterPause = false;
  showClickedPointsAfterReset = false;
  deferredMaskSnapshot = null;
  curves = []; draft = []; baseCurves = []; baseResetSnapshot = null; engineReady = false; clearRibbon(); clearTimeline(); refreshOverlays(); refreshStatus();
  restartSimulationIfActiveOrPaused(shouldRestart);
});

ui.exportObj.addEventListener('click', exportObj);
ui.exportGlb.addEventListener('click', exportGlb);
ui.exportScreenshot.addEventListener('click', exportPng);

ui.timeline.addEventListener('input', () => {
  updateRangeProgress(ui.timeline);
  if (timelineSync || appState.running || timeline.length === 0) return;
  const step = Math.round(parseFloat(ui.timeline.value));
  let bestIndex = 0;
  let best = timeline[0];
  let dist = Math.abs(best.step - step);
  for (let i = 1; i < timeline.length; i += 1) {
    const d = Math.abs(timeline[i].step - step);
    if (d < dist) {
      dist = d;
      best = timeline[i];
      bestIndex = i;
    }
  }
  engine.importSnapshot(best.snapshot);
  engineReady = true;
  appState.running = false;
  timelineStep = best.step;
  curves = engine.getCurves();
  refreshRibbon();
  if (isLayerStackEnabled()) rebuildLayerStack(bestIndex);
  else clearLayerStack();
  refreshOverlays();
  syncUi();
  refreshStatus();
});

ui.stackLayers.addEventListener('change', () => {
  if (isLayerStackEnabled()) rebuildLayerStack(findTimelineIndexByStep(timelineStep));
  else clearLayerStack();
  syncUi();
});

ui.flipStack.addEventListener('change', () => {
  updateLayerHeights();
  syncUi();
});

ui.showMesh.addEventListener('change', () => {
  syncUi();
});

ui.showPath.addEventListener('change', () => {
  syncUi();
});

ui.showPoints.addEventListener('change', () => {
  syncUi();
});

ui.collapseToggle.addEventListener('pointerdown', (event) => event.stopPropagation());
ui.collapseToggle.addEventListener('click', () => {
  const collapsed = ui.panel.classList.toggle('is-collapsed');
  ui.collapseToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
});

const beginPanelDrag = (event: PointerEvent) => {
  if (event.target instanceof Element && event.target.closest('.collapse-button')) return;
  draggingPanel = true;
  const rect = ui.panel.getBoundingClientRect();
  ui.panel.style.left = `${rect.left}px`;
  ui.panel.style.top = `${rect.top}px`;
  ui.panel.style.right = 'auto';
  ui.panel.style.bottom = 'auto';
  dragOffset.x = event.clientX - rect.left;
  dragOffset.y = event.clientY - rect.top;
};
ui.handleTop.addEventListener('pointerdown', beginPanelDrag);
ui.handleBottom.addEventListener('pointerdown', beginPanelDrag);

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || isPanelTarget(event)) return;
  pointerScreen.set(event.clientX, event.clientY);

  if (canEditControlPoints()) {
    const editablePoint = findEditableControlPoint(pointerScreen);
    if (editablePoint) {
      if (event.shiftKey) {
        if (engineReady) {
          deferredMaskSnapshot = engine.exportSnapshot();
        }
        pushUndoState();
        if (deleteEditableControlPoint(editablePoint)) {
          draggingControlPoint = false;
          setActiveControlPoint(null);
          setHoverControlPoint(null);
          setCloseCurveHintActive(false);
          engineReady = false;
          clearTimeline();
          refreshRibbon();
          refreshOverlays();
          refreshStatus();
          syncUi();
        }
        return;
      }
      pushUndoState();
      draggingControlPoint = true;
      setActiveControlPoint(editablePoint);
      setHoverControlPoint(editablePoint);
      setCloseCurveHintActive(false);
      const point = pointerToPlane(event);
      if (point) moveActiveControlPoint(point);
      return;
    }
  }

  const point = pointerToPlane(event); if (!point) return;
  if (appState.viewMode === 'mask' && engineReady && !appState.running) {
    pushUndoState();
    painting = true;
    paintMask(point, event.shiftKey);
    setOverlay(point, event.shiftKey);
    return;
  }
  if (appState.running || appState.viewMode === 'mask' || drawLockedAfterPause) {
    refreshStatus();
    return;
  }

  if (draft.length === 0) {
    const insertTarget = findCurveInsertTarget(pointerScreen);
    if (insertTarget) {
      if (event.shiftKey) {
        if (engineReady) {
          deferredMaskSnapshot = engine.exportSnapshot();
        }
        pushUndoState();
        if (insertTarget.curveIndex >= 0 && insertTarget.curveIndex < curves.length) {
          curves.splice(insertTarget.curveIndex, 1);
          draggingControlPoint = false;
          setActiveControlPoint(null);
          setHoverControlPoint(null);
          setCloseCurveHintActive(false);
          engineReady = false;
          clearTimeline();
          refreshRibbon();
          refreshOverlays();
          refreshStatus();
          syncUi();
        }
        return;
      }
      if (engineReady) {
        deferredMaskSnapshot = engine.exportSnapshot();
      }
      pushUndoState();
      if (insertControlPointOnCurve(insertTarget, point)) {
        setActiveControlPoint(null);
        setHoverControlPoint(null);
        setCloseCurveHintActive(false);
        engineReady = false;
        clearTimeline();
        refreshRibbon();
        refreshOverlays();
        refreshStatus();
        syncUi();
      }
      return;
    }
  }

  pushUndoState();
  addPoint(point, event);
});

window.addEventListener('pointermove', (event) => {
  if (draggingPanel) {
    ui.panel.style.left = `${event.clientX - dragOffset.x}px`;
    ui.panel.style.top = `${event.clientY - dragOffset.y}px`;
    clampPanelToViewport();
    return;
  }
  if (draggingControlPoint && activeControlPoint) {
    const point = pointerToPlane(event);
    if (!point) return;
    moveActiveControlPoint(point);
    return;
  }
  if (isPanelTarget(event)) {
    if (appState.viewMode === 'mask') setOverlay(null, false);
    setHoverControlPoint(null);
    setCloseCurveHintActive(false);
    return;
  }
  if (appState.viewMode === 'mask') {
    setHoverControlPoint(null);
    setCloseCurveHintActive(false);
    if (appState.running) {
      setOverlay(null, false);
      return;
    }
    const point = pointerToPlane(event);
    if (!point) return setOverlay(null, false);
    if (painting) paintMask(point, event.shiftKey);
    setOverlay(point, event.shiftKey);
    return;
  }
  if (appState.running) {
    setHoverControlPoint(null);
    setCloseCurveHintActive(false);
    return;
  }
  updateEditableControlPointHover(event);
  if (hoverControlPoint) {
    setCloseCurveHintActive(false);
    return;
  }
  updateCloseCurveHint(event);
});
window.addEventListener('pointerup', (event) => {
  painting = false;
  draggingPanel = false;
  if (!draggingControlPoint) return;
  draggingControlPoint = false;
  setActiveControlPoint(null);
  pointerScreen.set(event.clientX, event.clientY);
  setHoverControlPoint(findEditableControlPoint(pointerScreen));
});
window.addEventListener('pointercancel', () => {
  painting = false;
  draggingPanel = false;
  draggingControlPoint = false;
  setActiveControlPoint(null);
});
renderer.domElement.addEventListener('pointerleave', () => {
  setCloseCurveHintActive(false);
  if (!draggingControlPoint) setHoverControlPoint(null);
});

window.addEventListener('keydown', (event) => {
  const mod = event.ctrlKey || event.metaKey;
  if (mod && !event.shiftKey && event.key.toLowerCase() === 'z') { event.preventDefault(); undoStep(); return; }
  if (mod && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) { event.preventDefault(); redoStep(); return; }
  if (event.key === 'Enter' && !appState.running && appState.viewMode !== 'mask' && !drawLockedAfterPause) { pushUndoState(); finalizeDraft(false); }
});

window.addEventListener('resize', () => {
  updatePostSize();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  clampPanelToViewport();
});

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  controls.update();
  groundGrid.update(camera);
  if (appState.running) {
    engine.step(dt, simulationSettings.growthSpeed, simulationSettings.seedInfluence);
    refreshRibbon();
    appendTimeline();
    refreshOverlays();
  }
  composer.render();
});

refreshOverlays();
refreshStatus();
syncUi();
setMode('gradient');
bindSectionCollapses();
bindCustomSelect(ui.gradientType);
updatePostSize();
clampPanelToViewport();
requestAnimationFrame(() => {
  document.documentElement.classList.add('ui-ready');
});
