import './style.css';
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineBasicMaterial,
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
import { isWithinCloseThreshold } from './core/drawUtils';
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
  undoPoint: HTMLButtonElement;
  undoCurve: HTMLButtonElement;
  clearCurves: HTMLButtonElement;
  drawStatus: HTMLDivElement;
  growthSpeed: HTMLInputElement;
  growthSpeedValue: HTMLSpanElement;
  timeline: HTMLInputElement;
  timelineValue: HTMLSpanElement;
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
type UndoState = {
  curves: CurveData[];
  draft: CurvePoint[];
  viewMode: ViewMode;
  engineReady: boolean;
  snapshot: DifferentialGrowthSnapshot | null;
};

const CLOSE_THRESHOLD_PX = 16;
const FIXED_MASK_BLUR_STRENGTH = 0.35;
const MAX_TIMELINE = 240;
const MAX_UNDO = 80;

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
  undoPoint: must('undo-point'),
  undoCurve: must('undo-curve'),
  clearCurves: must('clear-curves'),
  drawStatus: must('draw-status'),
  growthSpeed: must('growth-speed'),
  growthSpeedValue: must('growth-speed-value'),
  timeline: must('simulation-timeline'),
  timelineValue: must('simulation-timeline-value'),
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
document.documentElement.classList.add('ui-ready');

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

const renderer = new WebGLRenderer({ antialias: true, canvas, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio * 1.5, 3));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;

const scene = new Scene();
scene.background = new Color(0x111622);
const camera = new PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0.25, 4.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.target.set(0, 0, 0);
controls.mouseButtons = { LEFT: -1 as unknown as MOUSE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE };
controls.update();
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

const materialController = new MaterialController(materialSettings);
const ribbonMesh = new Mesh(new BufferGeometry(), materialController.material);
scene.add(ribbonMesh);
const lineMesh = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: 0x2bb2ff, transparent: true, opacity: 0.9 }));
scene.add(lineMesh);
const pointsMesh = new Points(new BufferGeometry(), new PointsMaterial({ color: 0xa8b0c2, size: 6, sizeAttenuation: false }));
scene.add(pointsMesh);

const engine = new DifferentialGrowthEngine(growthSettings, simulationSettings.seed);
engine.setGradientBlur(materialSettings.gradientBlur);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), materialSettings.bloom, 0.7, 0.15);
composer.addPass(bloomPass);
const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);

const raycaster = new Raycaster();
const plane = new Plane(new Vector3(0, 0, 1), 0);
const pointer = new Vector2();
const tmpV = new Vector3();
const tmpS = new Vector2();

let curves: CurveData[] = [];
let draft: CurvePoint[] = [];
let nextCurveId = 1;
let engineReady = false;
const timeline: TimelineEntry[] = [];
let timelineStep = 0;
let timelineSync = false;
let painting = false;
let draggingPanel = false;
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
  appState.running = false;
  appState.viewMode = state.viewMode;
  engineReady = state.engineReady;
  if (state.engineReady && state.snapshot) {
    engine.importSnapshot(state.snapshot);
    resetTimeline();
  } else {
    clearRibbon();
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

function bindRange(input: HTMLInputElement, label: HTMLSpanElement, fmt: (v: number) => string, onInput: (v: number) => void) {
  const update = () => {
    const value = parseFloat(input.value);
    label.textContent = fmt(value);
    onInput(value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const p = max > min ? ((value - min) / (max - min)) * 100 : 100;
    input.style.setProperty('--range-progress', `${p}%`);
  };
  input.addEventListener('input', update);
  update();
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

function clearTimeline() {
  timeline.length = 0;
  timelineStep = 0;
  syncTimeline();
}

function resetTimeline() {
  timeline.length = 0;
  timelineStep = 0;
  if (engineReady) timeline.push({ step: 0, snapshot: engine.exportSnapshot() });
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
  timelineSync = false;
}

function appendTimeline() {
  timelineStep += 1;
  timeline.push({ step: timelineStep, snapshot: engine.exportSnapshot() });
  if (timeline.length > MAX_TIMELINE) timeline.shift();
  syncTimeline();
}

function pointerToPlane(event: PointerEvent): Vector3 | null {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = new Vector3();
  return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
}

function isPanelTarget(event: Event): boolean {
  return event.target instanceof Element && event.target.closest('#ui-panel') !== null;
}

function worldToScreen(world: CurvePoint | Vector3): Vector2 {
  const rect = renderer.domElement.getBoundingClientRect();
  tmpV.set(world.x, world.y, 0).project(camera);
  tmpS.set(rect.left + (tmpV.x * 0.5 + 0.5) * rect.width, rect.top + (-tmpV.y * 0.5 + 0.5) * rect.height);
  return tmpS.clone();
}

function ensureEngine(): boolean {
  if (curves.length === 0) return false;
  engine.reseed(simulationSettings.seed);
  engine.setGrowthSettings(growthSettings);
  engine.setCurves(curves, growthSettings.targetEdgeLength);
  engine.setGradientBlur(materialSettings.gradientBlur);
  engineReady = true;
  refreshRibbon();
  resetTimeline();
  return true;
}

function refreshRibbon() {
  if (!engineReady) return clearRibbon();
  const next = engine.getRibbonGeometry(parseFloat(ui.ribbonWidth.value));
  const prev = ribbonMesh.geometry;
  ribbonMesh.geometry = next;
  prev.dispose();
}

function clearRibbon() {
  const prev = ribbonMesh.geometry;
  ribbonMesh.geometry = new BufferGeometry();
  prev.dispose();
}

function buildLineGeometry(): BufferGeometry {
  const arr: number[] = [];
  const seg = (a: CurvePoint, b: CurvePoint) => arr.push(a.x, a.y, 0, b.x, b.y, 0);
  for (const c of curves) {
    const limit = c.closed ? c.points.length : c.points.length - 1;
    for (let i = 0; i < limit; i += 1) seg(c.points[i], c.points[(i + 1) % c.points.length]);
  }
  for (let i = 0; i < draft.length - 1; i += 1) seg(draft[i], draft[i + 1]);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
  return g;
}

function buildPointGeometry(): BufferGeometry {
  const arr: number[] = [];
  for (const c of curves) for (const p of c.points) arr.push(p.x, p.y, 0);
  for (const p of draft) arr.push(p.x, p.y, 0);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(arr), 3));
  return g;
}

function refreshOverlays() {
  const l = buildLineGeometry(); const p = buildPointGeometry();
  lineMesh.geometry.dispose(); pointsMesh.geometry.dispose();
  lineMesh.geometry = l; pointsMesh.geometry = p;
  lineMesh.visible = !appState.running; pointsMesh.visible = !appState.running;
}

function refreshStatus() {
  if (appState.viewMode === 'mask') ui.drawStatus.textContent = 'Mask mode active. LMB paint, Shift+LMB erase.';
  else if (appState.running) ui.drawStatus.textContent = `Simulation running. Curves: ${curves.length}`;
  else if (draft.length > 0) ui.drawStatus.textContent = `Drawing curve (${draft.length} points). Enter to end.`;
  else ui.drawStatus.textContent = curves.length ? `Curves ready: ${curves.length}. Click to add another.` : 'Click to start a curve.';
}

function syncUi() {
  ui.start.textContent = appState.running ? 'Pause' : 'Start';
  ui.maskMode.textContent = appState.viewMode === 'mask' ? 'Exit Mask Mode' : 'Enter Mask Mode';
  ui.undoPoint.disabled = appState.running || appState.viewMode === 'mask';
  ui.undoCurve.disabled = appState.running || appState.viewMode === 'mask';
  ui.clearCurves.disabled = appState.running || appState.viewMode === 'mask';
  syncTimeline();
}

function setMode(mode: ViewMode) {
  appState.viewMode = mode;
  materialController.setViewMode(mode);
  refreshStatus();
}

function addPoint(point: Vector3, event: PointerEvent) {
  if (draft.length >= 2) {
    const startScreen = worldToScreen(draft[0]);
    if (isWithinCloseThreshold(startScreen, new Vector2(event.clientX, event.clientY), CLOSE_THRESHOLD_PX)) {
      finalizeDraft(true);
      return;
    }
  }
  const last = draft[draft.length - 1];
  if (last) {
    const dx = point.x - last.x; const dy = point.y - last.y;
    if (dx * dx + dy * dy < 1e-6) return;
  }
  draft.push({ x: point.x, y: point.y, z: 0 });
  engineReady = false;
  clearTimeline();
  refreshOverlays();
  refreshStatus();
}

function finalizeDraft(closed: boolean): boolean {
  const min = closed ? 3 : 2;
  if (draft.length < min) return false;
  curves.push({ id: nextCurveId++, closed, points: cloneDraft(draft) });
  draft = [];
  engineReady = false;
  clearTimeline();
  refreshOverlays();
  refreshStatus();
  return true;
}

function startStop() {
  if (appState.running) {
    appState.running = false;
    curves = engine.getCurves();
    engineReady = true;
    refreshOverlays();
    return syncUi();
  }
  if (draft.length >= 2) finalizeDraft(false);
  if (!engineReady && !ensureEngine()) return;
  appState.running = true;
  setMode('gradient');
  syncUi();
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

function exportColorizedGeometry() {
  if (!engineReady) return null;
  const g = engine.getRibbonGeometry(parseFloat(ui.ribbonWidth.value));
  const curv = g.getAttribute('aCurvature') as BufferAttribute;
  const disp = g.getAttribute('aDisplacement') as BufferAttribute;
  const mask = g.getAttribute('aMask') as BufferAttribute;
  const colors = new Float32Array(curv.count * 3);
  const c0 = new Color(materialSettings.gradientStart);
  const c1 = new Color(materialSettings.gradientEnd);
  const c = new Color();
  for (let i = 0; i < curv.count; i += 1) {
    const a = MathUtils.clamp(curv.getX(i) * materialSettings.curvatureContrast + materialSettings.curvatureBias, 0, 1);
    const b = MathUtils.clamp(disp.getX(i) * materialSettings.curvatureContrast + materialSettings.curvatureBias, 0, 1);
    c.copy(c0).lerp(c1, materialSettings.gradientType === 'displacement' ? b : a);
    if (appState.viewMode === 'mask') c.setScalar(1 - MathUtils.clamp(mask.getX(i), 0, 1));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  return { g, colors };
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function exportObj() {
  const data = exportColorizedGeometry(); if (!data) return;
  const pos = data.g.getAttribute('position') as BufferAttribute;
  const idx = data.g.index;
  const lines: string[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    const o = i * 3;
    lines.push(`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)} ${data.colors[o]} ${data.colors[o + 1]} ${data.colors[o + 2]}`);
  }
  if (idx) for (let i = 0; i < idx.count; i += 3) lines.push(`f ${idx.getX(i) + 1} ${idx.getX(i + 1) + 1} ${idx.getX(i + 2) + 1}`);
  data.g.dispose();
  download(`differential-layers-step-${timelineStep}.obj`, new Blob([lines.join('\n')], { type: 'text/plain' }));
}

function exportGlb() {
  const data = exportColorizedGeometry(); if (!data) return;
  data.g.setAttribute('color', new BufferAttribute(data.colors, 3));
  const mesh = new Mesh(data.g, new MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.08 }));
  new GLTFExporter().parse(mesh, (result) => {
    if (result instanceof ArrayBuffer) download(`differential-layers-step-${timelineStep}.glb`, new Blob([result], { type: 'model/gltf-binary' }));
    mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose();
  }, () => {
    mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose();
  }, { binary: true });
}

function exportPng() {
  composer.render();
  renderer.domElement.toBlob((blob) => blob && download(`differential-layers-step-${timelineStep}.png`, blob), 'image/png');
}

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
bindRange(ui.maxVertices, ui.maxVerticesValue, (v) => `${Math.round(v)}`, (v) => { growthSettings.maxVertices = Math.round(v); engine.setGrowthSettings(growthSettings); });
bindRange(ui.ribbonWidth, ui.ribbonWidthValue, (v) => v.toFixed(3), () => { refreshRibbon(); });
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
ui.reset.addEventListener('click', () => { pushUndoState(); appState.running = false; engineReady = false; clearRibbon(); clearTimeline(); refreshOverlays(); refreshStatus(); syncUi(); });
ui.maskMode.addEventListener('click', () => {
  pushUndoState();
  if (appState.viewMode === 'mask') setMode('gradient');
  else {
    if (!engineReady) ensureEngine();
    if (!appState.running) setMode('mask');
  }
  syncUi();
});
ui.blurMask.addEventListener('click', () => {
  if (!engineReady || appState.running) return;
  pushUndoState();
  engine.blurMask(FIXED_MASK_BLUR_STRENGTH); refreshRibbon(); setMode('mask'); syncUi();
});
ui.clearMask.addEventListener('click', () => {
  if (!engineReady || appState.running) return;
  pushUndoState();
  engine.clearMask(); refreshRibbon(); setMode('mask'); syncUi();
});
ui.undoPoint.addEventListener('click', () => {
  pushUndoState();
  if (draft.length > 0) draft.pop(); else if (curves.length) { const c = curves[curves.length - 1]; if (c.points.length > 2) c.points.pop(); else curves.pop(); }
  engineReady = false; clearTimeline(); refreshOverlays(); refreshStatus();
});
ui.undoCurve.addEventListener('click', () => {
  pushUndoState();
  if (draft.length) draft = []; else curves.pop();
  engineReady = false; clearTimeline(); refreshOverlays(); refreshStatus();
});
ui.clearCurves.addEventListener('click', () => {
  pushUndoState();
  curves = []; draft = []; engineReady = false; clearRibbon(); clearTimeline(); refreshOverlays(); refreshStatus();
});

ui.exportObj.addEventListener('click', exportObj);
ui.exportGlb.addEventListener('click', exportGlb);
ui.exportScreenshot.addEventListener('click', exportPng);

ui.timeline.addEventListener('input', () => {
  if (timelineSync || appState.running || timeline.length === 0) return;
  const step = Math.round(parseFloat(ui.timeline.value));
  let best = timeline[0]; let dist = Math.abs(best.step - step);
  for (let i = 1; i < timeline.length; i += 1) { const d = Math.abs(timeline[i].step - step); if (d < dist) { dist = d; best = timeline[i]; } }
  engine.importSnapshot(best.snapshot); engineReady = true; appState.running = false; timelineStep = best.step; curves = engine.getCurves();
  refreshRibbon(); refreshOverlays(); syncUi(); refreshStatus();
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
  const point = pointerToPlane(event); if (!point) return;
  if (appState.viewMode === 'mask' && engineReady && !appState.running) {
    pushUndoState();
    painting = true;
    paintMask(point, event.shiftKey);
    setOverlay(point, event.shiftKey);
    return;
  }
  if (appState.running || appState.viewMode === 'mask') return;
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
  if (isPanelTarget(event)) { if (appState.viewMode === 'mask') setOverlay(null, false); return; }
  if (appState.viewMode !== 'mask' || appState.running) return;
  const point = pointerToPlane(event);
  if (!point) return setOverlay(null, false);
  if (painting) paintMask(point, event.shiftKey);
  setOverlay(point, event.shiftKey);
});
window.addEventListener('pointerup', () => { painting = false; draggingPanel = false; });
window.addEventListener('pointercancel', () => { painting = false; draggingPanel = false; });

window.addEventListener('keydown', (event) => {
  const mod = event.ctrlKey || event.metaKey;
  if (mod && !event.shiftKey && event.key.toLowerCase() === 'z') { event.preventDefault(); undoStep(); return; }
  if (mod && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) { event.preventDefault(); redoStep(); return; }
  if (event.key === 'Enter' && !appState.running && appState.viewMode !== 'mask') { pushUndoState(); finalizeDraft(false); }
});

window.addEventListener('resize', () => {
  const pr = Math.min(window.devicePixelRatio * 1.5, 3);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(pr);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
  fxaaPass.material.uniforms.resolution.value.set(1 / (window.innerWidth * pr), 1 / (window.innerHeight * pr));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  clampPanelToViewport();
});

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  controls.update();
  if (appState.running) {
    engine.step(dt, simulationSettings.growthSpeed, simulationSettings.seedInfluence);
    refreshRibbon();
    appendTimeline();
  }
  composer.render();
});

refreshOverlays();
refreshStatus();
syncUi();
setMode('gradient');
bindSectionCollapses();
