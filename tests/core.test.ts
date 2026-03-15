import { describe, expect, it } from 'vitest';
import { Vector2 } from 'three';
import { DifferentialGrowthEngine } from '../src/core/differentialGrowthEngine';
import { buildSubdividedCurve, isWithinCloseThreshold } from '../src/core/drawUtils';
import type { CurveData, GrowthSettings } from '../src/types';

const growthSettings: GrowthSettings = {
  growthStep: 0.45,
  targetEdgeLength: 0.12,
  splitThreshold: 1.35,
  repulsion: 0.62,
  smoothing: 0.52,
  shapeRetention: 0.09,
  sideBias: 0,
  maxVertices: 50000,
};

function segmentLengths(curve: CurveData): number[] {
  const lengths: number[] = [];
  const limit = curve.closed ? curve.points.length : curve.points.length - 1;
  for (let i = 0; i < limit; i += 1) {
    const a = curve.points[i];
    const b = curve.points[(i + 1) % curve.points.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    lengths.push(Math.sqrt(dx * dx + dy * dy));
  }
  return lengths;
}

describe('Curve resampling', () => {
  it('normalizes segment spacing near target length', () => {
    const engine = new DifferentialGrowthEngine(growthSettings, 1);
    const source: CurveData[] = [{
      id: 1,
      closed: false,
      points: [
        { x: -1, y: 0, z: 0 },
        { x: -0.2, y: 0, z: 0 },
        { x: -0.1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ],
    }];

    engine.setCurves(source, 0.2);
    const curve = engine.getCurves()[0];
    const lengths = segmentLengths(curve);
    const avg = lengths.reduce((sum, value) => sum + value, 0) / Math.max(1, lengths.length);

    expect(curve.points.length).toBeGreaterThan(source[0].points.length);
    expect(avg).toBeGreaterThan(0.16);
    expect(avg).toBeLessThan(0.24);
  });
});

describe('DifferentialGrowthEngine dynamics', () => {
  it('splits long segments when threshold is exceeded', () => {
    const engine = new DifferentialGrowthEngine(
      { ...growthSettings, targetEdgeLength: 0.05, splitThreshold: 1.2, maxVertices: 100000 },
      2,
    );

    engine.setCurves([
      {
        id: 1,
        closed: true,
        points: [
          { x: -1, y: -1, z: 0 },
          { x: 1, y: -1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: -1, y: 1, z: 0 },
        ],
      },
    ], 0.8);

    const before = engine.getTotalPointCount();
    engine.step(0.016, 1);
    const after = engine.getTotalPointCount();
    expect(after).toBeGreaterThan(before);
  });

  it('repulsion affects nearby points across different curves', () => {
    const settings = { ...growthSettings, growthStep: 0, repulsion: 1, smoothing: 0, shapeRetention: 0 };
    const engine = new DifferentialGrowthEngine(settings, 3);
    engine.setCurves([
      {
        id: 1,
        closed: false,
        points: [
          { x: -0.1, y: 0, z: 0 },
          { x: 0.1, y: 0, z: 0 },
        ],
      },
      {
        id: 2,
        closed: false,
        points: [
          { x: -0.1, y: 0.03, z: 0 },
          { x: 0.1, y: 0.03, z: 0 },
        ],
      },
    ], 0.1);

    const before = engine.getCurves();
    engine.step(0.02, 1, 0);
    const after = engine.getCurves();

    const beforeGap = Math.abs(before[1].points[0].y - before[0].points[0].y);
    const afterGap = Math.abs(after[1].points[0].y - after[0].points[0].y);
    expect(afterGap).toBeGreaterThan(beforeGap);
  });

  it('repels a point away from nearby segment interiors', () => {
    const settings = {
      ...growthSettings,
      growthStep: 0,
      repulsion: 1,
      smoothing: 0,
      shapeRetention: 0,
      targetEdgeLength: 0.1,
      splitThreshold: 1.35,
    };
    const engine = new DifferentialGrowthEngine(settings, 17);
    engine.setCurves([
      {
        id: 1,
        closed: false,
        points: [
          { x: -0.5, y: 0, z: 0 },
          { x: 0.5, y: 0, z: 0 },
        ],
      },
      {
        id: 2,
        closed: false,
        points: [
          { x: 0, y: 0.02, z: 0 },
          { x: 0, y: 0.4, z: 0 },
        ],
      },
    ], 0.1);

    const before = engine.getCurves()[1].points[0].y;
    engine.step(0.02, 1, 0);
    const after = engine.getCurves()[1].points[0].y;
    expect(after).toBeGreaterThan(before);
  });

  it('produces deterministic output for same seed and input', () => {
    const curves: CurveData[] = [{
      id: 1,
      closed: true,
      points: [
        { x: -0.8, y: 0, z: 0 },
        { x: 0, y: 0.8, z: 0 },
        { x: 0.8, y: 0, z: 0 },
        { x: 0, y: -0.8, z: 0 },
      ],
    }];

    const a = new DifferentialGrowthEngine(growthSettings, 77);
    const b = new DifferentialGrowthEngine(growthSettings, 77);
    a.setCurves(curves, growthSettings.targetEdgeLength);
    b.setCurves(curves, growthSettings.targetEdgeLength);

    for (let i = 0; i < 8; i += 1) {
      a.step(0.016, 1.1, 0.45);
      b.step(0.016, 1.1, 0.45);
    }

    const outA = a.getCurves();
    const outB = b.getCurves();

    let maxDelta = 0;
    for (let i = 0; i < outA[0].points.length; i += 1) {
      const dx = Math.abs(outA[0].points[i].x - outB[0].points[i].x);
      const dy = Math.abs(outA[0].points[i].y - outB[0].points[i].y);
      maxDelta = Math.max(maxDelta, dx, dy);
    }
    expect(maxDelta).toBeLessThan(1e-9);
  });
});

describe('Close-threshold utility', () => {
  it('returns true when pointer is within threshold', () => {
    expect(isWithinCloseThreshold(new Vector2(100, 100), new Vector2(111, 108), 16)).toBe(true);
  });

  it('returns false when pointer is outside threshold', () => {
    expect(isWithinCloseThreshold(new Vector2(100, 100), new Vector2(130, 100), 16)).toBe(false);
  });
});

describe('Start subdivision utility', () => {
  it('creates denser start curves when subdivision is increased', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0.5, z: 0 },
      { x: 2, y: 0, z: 0 },
    ];
    const base = buildSubdividedCurve(points, false, 1);
    const dense = buildSubdividedCurve(points, false, 6);
    expect(dense.length).toBeGreaterThan(base.length);
  });
});
