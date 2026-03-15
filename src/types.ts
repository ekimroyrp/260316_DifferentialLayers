export type ViewMode = 'gradient' | 'mask';
export type GradientType = 'curvature' | 'displacement';

export type SimulationSettings = {
  growthSpeed: number;
  seed: number;
  seedInfluence: number;
};

export type DrawSettings = {
  closeThresholdPx: number;
  ribbonWidth: number;
  editPointSize: number;
};

export type MaskSettings = {
  brushRadius: number;
  falloffOffset: number;
};

export type GrowthSettings = {
  growthStep: number;
  targetEdgeLength: number;
  splitThreshold: number;
  repulsion: number;
  smoothing: number;
  shapeRetention: number;
  maxVertices: number;
};

export type MaterialSettings = {
  gradientType: GradientType;
  gradientStart: string;
  gradientEnd: string;
  curvatureContrast: number;
  curvatureBias: number;
  gradientBlur: number;
  fresnel: number;
  specular: number;
  bloom: number;
};

export type AppState = {
  running: boolean;
  viewMode: ViewMode;
};

export type CurvePoint = {
  x: number;
  y: number;
  z: number;
};

export type CurveData = {
  id: number;
  closed: boolean;
  points: CurvePoint[];
};
