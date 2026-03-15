import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from 'three';
import type { CurveData, CurvePoint, GrowthSettings } from '../types';
import { SeededRng } from './seededRng';

type CurveState = {
  id: number;
  closed: boolean;
  points: Vector3[];
  basePoints: Vector3[];
  mask: Float32Array;
  variation: Float32Array;
  curvature: Float32Array;
  displacement: Float32Array;
};

type PointRef = {
  curveIndex: number;
  pointIndex: number;
};

type SegmentRef = {
  curveIndex: number;
  segmentIndex: number;
  aIndex: number;
  bIndex: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const tempVecA = new Vector3();

export type CurveSnapshot = {
  id: number;
  closed: boolean;
  points: number[];
  basePoints: number[];
  mask: number[];
  variation: number[];
};

export type DifferentialGrowthSnapshot = {
  curves: CurveSnapshot[];
  rngState: number;
};

function clonePoint(point: CurvePoint): Vector3 {
  return new Vector3(point.x, point.y, 0);
}

function cloneVectorArray(points: Vector3[]): Vector3[] {
  return points.map((point) => point.clone());
}

function distance2d(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function signedArea(points: Vector3[]): number {
  if (points.length < 3) {
    return 0;
  }
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area * 0.5;
}

function pointNormal(points: Vector3[], index: number, closed: boolean): Vector3 {
  const count = points.length;
  const current = points[index];
  const hasPrev = closed || index > 0;
  const hasNext = closed || index < count - 1;

  const prev = hasPrev ? points[(index - 1 + count) % count] : current;
  const next = hasNext ? points[(index + 1) % count] : current;

  tempVecA.set(next.x - prev.x, next.y - prev.y, 0);
  if (tempVecA.lengthSq() < 1e-12) {
    if (hasNext) {
      tempVecA.set(next.x - current.x, next.y - current.y, 0);
    } else if (hasPrev) {
      tempVecA.set(current.x - prev.x, current.y - prev.y, 0);
    }
  }

  if (tempVecA.lengthSq() < 1e-12) {
    return new Vector3(0, 1, 0);
  }

  tempVecA.normalize();
  const clockwise = closed && signedArea(points) < 0;
  const nx = clockwise ? tempVecA.y : -tempVecA.y;
  const ny = clockwise ? -tempVecA.x : tempVecA.x;
  return new Vector3(nx, ny, 0).normalize();
}

function buildSampleDistances(points: Vector3[], closed: boolean): { cumulative: number[]; total: number } {
  const cumulative: number[] = [0];
  if (points.length < 2) {
    return { cumulative, total: 0 };
  }

  const segmentCount = closed ? points.length : points.length - 1;
  let total = 0;
  for (let i = 0; i < segmentCount; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += distance2d(a, b);
    cumulative.push(total);
  }

  return { cumulative, total };
}

function sampleAtDistance(points: Vector3[], closed: boolean, cumulative: number[], distance: number): Vector3 {
  const segmentCount = closed ? points.length : points.length - 1;
  if (segmentCount <= 0) {
    return points[0]?.clone() ?? new Vector3();
  }

  const clampedDistance = MathUtils.clamp(distance, 0, cumulative[cumulative.length - 1]);
  let segment = 0;
  while (segment + 1 < cumulative.length && cumulative[segment + 1] < clampedDistance) {
    segment += 1;
  }

  const start = points[segment % points.length];
  const end = points[(segment + 1) % points.length];
  const startDistance = cumulative[segment];
  const endDistance = cumulative[segment + 1];
  const span = Math.max(endDistance - startDistance, 1e-6);
  const t = (clampedDistance - startDistance) / span;

  return new Vector3(
    MathUtils.lerp(start.x, end.x, t),
    MathUtils.lerp(start.y, end.y, t),
    0,
  );
}

function resampleCurve(points: Vector3[], closed: boolean, spacing: number): Vector3[] {
  if (points.length < 2 || spacing <= 1e-6) {
    return cloneVectorArray(points);
  }

  const { cumulative, total } = buildSampleDistances(points, closed);
  if (total <= 1e-6) {
    return cloneVectorArray(points);
  }

  const samples: Vector3[] = [];
  if (closed) {
    const segmentCount = Math.max(3, Math.round(total / spacing));
    const step = total / segmentCount;
    for (let i = 0; i < segmentCount; i += 1) {
      samples.push(sampleAtDistance(points, true, cumulative, i * step));
    }
  } else {
    const segmentCount = Math.max(1, Math.round(total / spacing));
    const step = total / segmentCount;
    for (let i = 0; i <= segmentCount; i += 1) {
      samples.push(sampleAtDistance(points, false, cumulative, i * step));
    }
  }

  return samples;
}

function toCurveData(curve: CurveState): CurveData {
  return {
    id: curve.id,
    closed: curve.closed,
    points: curve.points.map((point) => ({ x: point.x, y: point.y, z: 0 })),
  };
}

export class DifferentialGrowthEngine {
  private curves: CurveState[] = [];

  private readonly settings: GrowthSettings;

  private rng: SeededRng;

  private gradientBlur = 0.35;

  constructor(settings: GrowthSettings, seed: number) {
    this.settings = settings;
    this.rng = new SeededRng(seed);
  }

  getCurves(): CurveData[] {
    return this.curves.map(toCurveData);
  }

  getTotalPointCount(): number {
    let count = 0;
    for (let i = 0; i < this.curves.length; i += 1) {
      count += this.curves[i].points.length;
    }
    return count;
  }

  setCurves(curves: CurveData[], resampleSpacing = this.settings.targetEdgeLength): void {
    this.curves = curves
      .filter((curve) => curve.points.length >= (curve.closed ? 3 : 2))
      .map((curve) => {
        const source = curve.points.map(clonePoint);
        const points = resampleCurve(source, curve.closed, resampleSpacing);
        const mask = new Float32Array(points.length);
        const variation = new Float32Array(points.length);
        for (let i = 0; i < variation.length; i += 1) {
          variation[i] = this.rng.signed();
        }
        return {
          id: curve.id,
          closed: curve.closed,
          points,
          basePoints: cloneVectorArray(points),
          mask,
          variation,
          curvature: new Float32Array(points.length),
          displacement: new Float32Array(points.length),
        };
      });

    this.updateScalarFields();
  }

  setGrowthSettings(settings: GrowthSettings): void {
    this.settings.growthStep = settings.growthStep;
    this.settings.targetEdgeLength = settings.targetEdgeLength;
    this.settings.splitThreshold = settings.splitThreshold;
    this.settings.repulsion = settings.repulsion;
    this.settings.smoothing = settings.smoothing;
    this.settings.shapeRetention = settings.shapeRetention;
    this.settings.sideBias = settings.sideBias;
    this.settings.maxVertices = settings.maxVertices;
  }

  reseed(seed: number): void {
    this.rng = new SeededRng(seed);
  }

  setGradientBlur(strength: number): void {
    this.gradientBlur = MathUtils.clamp(strength, 0, 1);
    this.updateScalarFields();
  }

  clearMask(): void {
    for (let i = 0; i < this.curves.length; i += 1) {
      this.curves[i].mask.fill(0);
    }
  }

  blurMask(strength: number): void {
    const blend = MathUtils.clamp(strength, 0, 1) * 0.8;
    const passes = Math.max(1, Math.round(1 + strength * 5));

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      const work = new Float32Array(curve.mask.length);
      for (let pass = 0; pass < passes; pass += 1) {
        for (let i = 0; i < curve.mask.length; i += 1) {
          const prev = this.previousIndex(curve, i);
          const next = this.nextIndex(curve, i);
          let sum = curve.mask[i];
          let count = 1;
          if (prev >= 0) {
            sum += curve.mask[prev];
            count += 1;
          }
          if (next >= 0) {
            sum += curve.mask[next];
            count += 1;
          }
          const average = sum / count;
          work[i] = MathUtils.lerp(curve.mask[i], average, blend);
        }
        curve.mask.set(work);
      }
    }
  }

  paintMask(point: Vector3, radius: number, falloffOffset: number): void {
    this.modifyMask(point, radius, falloffOffset, false);
  }

  eraseMask(point: Vector3, radius: number, falloffOffset: number): void {
    this.modifyMask(point, radius, falloffOffset, true);
  }

  exportSnapshot(): DifferentialGrowthSnapshot {
    return {
      curves: this.curves.map((curve) => ({
        id: curve.id,
        closed: curve.closed,
        points: this.flattenPoints(curve.points),
        basePoints: this.flattenPoints(curve.basePoints),
        mask: Array.from(curve.mask),
        variation: Array.from(curve.variation),
      })),
      rngState: this.rng.getState(),
    };
  }

  importSnapshot(snapshot: DifferentialGrowthSnapshot): void {
    this.curves = snapshot.curves
      .map((curve) => {
        const points = this.expandPoints(curve.points);
        const basePoints = this.expandPoints(curve.basePoints);
        if (points.length < (curve.closed ? 3 : 2)) {
          return null;
        }

        const count = points.length;
        const mask = new Float32Array(count);
        const variation = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
          mask[i] = curve.mask[i] ?? 0;
          variation[i] = curve.variation[i] ?? this.rng.signed();
        }

        const normalizedBase = basePoints.length === count ? basePoints : cloneVectorArray(points);

        return {
          id: curve.id,
          closed: curve.closed,
          points,
          basePoints: normalizedBase,
          mask,
          variation,
          curvature: new Float32Array(count),
          displacement: new Float32Array(count),
        } as CurveState;
      })
      .filter((curve): curve is CurveState => curve !== null);

    this.rng.setState(snapshot.rngState);
    this.updateScalarFields();
  }

  applyMaskFromSnapshot(snapshot: DifferentialGrowthSnapshot, blendMode: 'replace' | 'max' = 'replace'): void {
    if (this.curves.length === 0 || snapshot.curves.length === 0) {
      return;
    }

    const sourceById = new Map<number, { closed: boolean; mask: number[] }>();
    for (let i = 0; i < snapshot.curves.length; i += 1) {
      const source = snapshot.curves[i];
      sourceById.set(source.id, { closed: source.closed, mask: source.mask });
    }

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const target = this.curves[curveIndex];
      const source = sourceById.get(target.id);
      if (!source || source.mask.length === 0) {
        continue;
      }

      const targetCount = target.points.length;
      const sourceCount = source.mask.length;
      if (targetCount === 0) {
        continue;
      }

      if (sourceCount === 1) {
        target.mask.fill(MathUtils.clamp(source.mask[0], 0, 1));
        continue;
      }

      for (let i = 0; i < targetCount; i += 1) {
        const t = source.closed ? i / targetCount : (targetCount === 1 ? 0 : i / (targetCount - 1));
        let sampled = 0;

        if (source.closed) {
          const position = t * sourceCount;
          const base = Math.floor(position) % sourceCount;
          const next = (base + 1) % sourceCount;
          const alpha = position - Math.floor(position);
          sampled = MathUtils.lerp(source.mask[base] ?? 0, source.mask[next] ?? 0, alpha);
        } else {
          const position = t * (sourceCount - 1);
          const base = Math.floor(position);
          const next = Math.min(base + 1, sourceCount - 1);
          const alpha = position - base;
          sampled = MathUtils.lerp(source.mask[base] ?? 0, source.mask[next] ?? 0, alpha);
        }

        const clamped = MathUtils.clamp(sampled, 0, 1);
        target.mask[i] = blendMode === 'max' ? Math.max(target.mask[i], clamped) : clamped;
      }
    }

    this.updateScalarFields();
  }

  step(deltaSeconds: number, growthSpeed: number, seedInfluence = 0.35): void {
    if (this.curves.length === 0) {
      return;
    }

    const safeDt = Math.min(Math.max(deltaSeconds, 0), 1 / 20);
    if (safeDt <= 0) {
      return;
    }

    const subSteps = Math.max(1, Math.round(growthSpeed * 2));
    const dt = (safeDt * growthSpeed) / subSteps;

    for (let stepIndex = 0; stepIndex < subSteps; stepIndex += 1) {
      this.maybeSplitLongSegments();
      this.integrate(dt, seedInfluence);
      this.applyCurveSmoothing(Math.max(1, Math.round(1 + this.settings.smoothing * 3)), this.settings.smoothing * 0.34);
    }

    this.updateScalarFields();
  }

  getRibbonGeometry(width: number): BufferGeometry {
    const safeWidth = Math.max(width, 0.0001);
    const halfWidth = safeWidth * 0.5;

    let vertexCount = 0;
    let segmentCount = 0;
    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      const count = curve.points.length;
      if (count < 2) {
        continue;
      }
      vertexCount += count * 2;
      segmentCount += curve.closed ? count : count - 1;
    }

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const masks = new Float32Array(vertexCount);
    const curvatures = new Float32Array(vertexCount);
    const displacements = new Float32Array(vertexCount);
    const indices = new Uint32Array(segmentCount * 6);

    let vertexOffset = 0;
    let indexOffset = 0;
    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      const count = curve.points.length;
      if (count < 2) {
        continue;
      }

      for (let i = 0; i < count; i += 1) {
        const center = curve.points[i];
        const normal = pointNormal(curve.points, i, curve.closed);

        const leftX = center.x + normal.x * halfWidth;
        const leftY = center.y + normal.y * halfWidth;
        const rightX = center.x - normal.x * halfWidth;
        const rightY = center.y - normal.y * halfWidth;

        const left = (vertexOffset + i * 2) * 3;
        const right = left + 3;

        positions[left] = leftX;
        positions[left + 1] = leftY;
        positions[left + 2] = 0;
        positions[right] = rightX;
        positions[right + 1] = rightY;
        positions[right + 2] = 0;

        normals[left + 2] = 1;
        normals[right + 2] = 1;

        const scalarIndex = vertexOffset + i * 2;
        masks[scalarIndex] = curve.mask[i];
        masks[scalarIndex + 1] = curve.mask[i];
        curvatures[scalarIndex] = curve.curvature[i];
        curvatures[scalarIndex + 1] = curve.curvature[i];
        displacements[scalarIndex] = curve.displacement[i];
        displacements[scalarIndex + 1] = curve.displacement[i];
      }

      const segmentLimit = curve.closed ? count : count - 1;
      for (let i = 0; i < segmentLimit; i += 1) {
        const next = (i + 1) % count;
        const aLeft = vertexOffset + i * 2;
        const aRight = aLeft + 1;
        const bLeft = vertexOffset + next * 2;
        const bRight = bLeft + 1;

        indices[indexOffset] = aLeft;
        indices[indexOffset + 1] = bLeft;
        indices[indexOffset + 2] = aRight;
        indices[indexOffset + 3] = bLeft;
        indices[indexOffset + 4] = bRight;
        indices[indexOffset + 5] = aRight;
        indexOffset += 6;
      }

      vertexOffset += count * 2;
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));
    geometry.setAttribute('aMask', new BufferAttribute(masks, 1));
    geometry.setAttribute('aCurvature', new BufferAttribute(curvatures, 1));
    geometry.setAttribute('aDisplacement', new BufferAttribute(displacements, 1));
    geometry.computeBoundingSphere();
    return geometry;
  }

  private integrate(dt: number, seedInfluence: number): void {
    const influence = MathUtils.clamp(seedInfluence, 0, 1);
    const dynamicNoise = 0.06 * influence;
    const staticVariation = 0.9 * influence;
    const sideBias = MathUtils.clamp(this.settings.sideBias / 100, -1, 1);
    const preferredSideSign = sideBias >= 0 ? 1 : -1;
    const biasMix = Math.abs(sideBias);

    const deltaX: Float32Array[] = this.curves.map((curve) => new Float32Array(curve.points.length));
    const deltaY: Float32Array[] = this.curves.map((curve) => new Float32Array(curve.points.length));

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      const points = curve.points;
      const count = points.length;

      for (let i = 0; i < count; i += 1) {
        const current = points[i];
        const prevIndex = this.previousIndex(curve, i);
        const nextIndex = this.nextIndex(curve, i);
        const prev = prevIndex >= 0 ? points[prevIndex] : current;
        const next = nextIndex >= 0 ? points[nextIndex] : current;

        const avgX = (prev.x + next.x) * 0.5;
        const avgY = (prev.y + next.y) * 0.5;
        const curvature = Math.hypot(avgX - current.x, avgY - current.y) / Math.max(this.settings.targetEdgeLength, 1e-6);

        const normal = pointNormal(points, i, curve.closed);
        const baseNormal = pointNormal(curve.basePoints, i, curve.closed);
        const medianOffsetX = current.x - curve.basePoints[i].x;
        const medianOffsetY = current.y - curve.basePoints[i].y;
        const signedMedianOffset = medianOffsetX * baseNormal.x + medianOffsetY * baseNormal.y;
        const medianBand = Math.max(this.settings.targetEdgeLength * 0.02, 1e-5);
        const sideSign = Math.abs(signedMedianOffset) <= medianBand ? (curve.variation[i] >= 0 ? 1 : -1) : Math.sign(signedMedianOffset);
        const growthNormalX = normal.x * 0.35 + baseNormal.x * 0.65;
        const growthNormalY = normal.y * 0.35 + baseNormal.y * 0.65;
        const growthNormalLength = Math.hypot(growthNormalX, growthNormalY);
        const safeNormalX = growthNormalLength > 1e-8 ? growthNormalX / growthNormalLength : baseNormal.x;
        const safeNormalY = growthNormalLength > 1e-8 ? growthNormalY / growthNormalLength : baseNormal.y;
        const growthMobility = 1 - MathUtils.clamp(curve.mask[i], 0, 1);
        const jitter = this.rng.signed() * dynamicNoise;
        const seeded = Math.max(0.12, 1 + curve.variation[i] * staticVariation);
        const growth = Math.max(
          0,
          this.settings.growthStep * dt * growthMobility * (0.58 + curvature * 0.92 + jitter) * seeded,
        );

        const directionFactor = sideSign * (1 - biasMix) + preferredSideSign * biasMix;
        deltaX[curveIndex][i] += safeNormalX * growth * directionFactor;
        deltaY[curveIndex][i] += safeNormalY * growth * directionFactor;
      }

      const springStrength = 0.52;
      const segmentLimit = curve.closed ? count : count - 1;
      for (let i = 0; i < segmentLimit; i += 1) {
        const next = (i + 1) % count;
        const a = points[i];
        const b = points[next];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length <= 1e-6) {
          continue;
        }
        const correction = (length - this.settings.targetEdgeLength) * springStrength * dt;
        const ux = dx / length;
        const uy = dy / length;

        deltaX[curveIndex][i] += ux * correction;
        deltaY[curveIndex][i] += uy * correction;
        deltaX[curveIndex][next] -= ux * correction;
        deltaY[curveIndex][next] -= uy * correction;
      }

      const retention = this.settings.shapeRetention * 0.18 * dt;
      if (retention > 0) {
        for (let i = 0; i < count; i += 1) {
          deltaX[curveIndex][i] += (curve.basePoints[i].x - points[i].x) * retention;
          deltaY[curveIndex][i] += (curve.basePoints[i].y - points[i].y) * retention;
        }
      }
    }

    this.applySpatialRepulsion(deltaX, deltaY, dt);
    this.applyPointSegmentRepulsion(deltaX, deltaY, dt);

    const maxDisplacement = this.settings.targetEdgeLength * 0.24;
    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let i = 0; i < curve.points.length; i += 1) {
        const dx = deltaX[curveIndex][i];
        const dy = deltaY[curveIndex][i];
        const length = Math.sqrt(dx * dx + dy * dy);
        const scale = length > maxDisplacement && length > 1e-6 ? maxDisplacement / length : 1;
        curve.points[i].x += dx * scale;
        curve.points[i].y += dy * scale;
        curve.points[i].z = 0;
      }
    }
  }

  private applySpatialRepulsion(deltaX: Float32Array[], deltaY: Float32Array[], dt: number): void {
    if (this.settings.repulsion <= 0) {
      return;
    }

    const radius = this.settings.targetEdgeLength * this.settings.splitThreshold * 1.35;
    if (radius <= 1e-6) {
      return;
    }

    const radiusSq = radius * radius;
    const invCell = 1 / radius;
    const grid = new Map<string, PointRef[]>();

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let pointIndex = 0; pointIndex < curve.points.length; pointIndex += 1) {
        const point = curve.points[pointIndex];
        const cellX = Math.floor(point.x * invCell);
        const cellY = Math.floor(point.y * invCell);
        const key = `${cellX}|${cellY}`;
        const bucket = grid.get(key);
        if (bucket) {
          bucket.push({ curveIndex, pointIndex });
        } else {
          grid.set(key, [{ curveIndex, pointIndex }]);
        }
      }
    }

    const strength = this.settings.repulsion * dt * 0.03;
    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let pointIndex = 0; pointIndex < curve.points.length; pointIndex += 1) {
        const point = curve.points[pointIndex];
        const cellX = Math.floor(point.x * invCell);
        const cellY = Math.floor(point.y * invCell);

        for (let ox = -1; ox <= 1; ox += 1) {
          for (let oy = -1; oy <= 1; oy += 1) {
            const key = `${cellX + ox}|${cellY + oy}`;
            const bucket = grid.get(key);
            if (!bucket) {
              continue;
            }

            for (let bi = 0; bi < bucket.length; bi += 1) {
              const other = bucket[bi];
              if (
                other.curveIndex < curveIndex ||
                (other.curveIndex === curveIndex && other.pointIndex <= pointIndex)
              ) {
                continue;
              }

              const otherCurve = this.curves[other.curveIndex];
              if (this.areAdjacent(curve, pointIndex, otherCurve, other.pointIndex)) {
                continue;
              }

              const otherPoint = otherCurve.points[other.pointIndex];
              const dx = point.x - otherPoint.x;
              const dy = point.y - otherPoint.y;
              const distSq = dx * dx + dy * dy;
              if (distSq <= 1e-12 || distSq >= radiusSq) {
                continue;
              }

              const dist = Math.sqrt(distSq);
              const falloff = 1 - dist / radius;
              const force = (strength * falloff) / (distSq + 1e-6);
              const ux = dx / dist;
              const uy = dy / dist;
              const fx = ux * force;
              const fy = uy * force;

              deltaX[curveIndex][pointIndex] += fx;
              deltaY[curveIndex][pointIndex] += fy;
              deltaX[other.curveIndex][other.pointIndex] -= fx;
              deltaY[other.curveIndex][other.pointIndex] -= fy;
            }
          }
        }
      }
    }
  }

  private applyPointSegmentRepulsion(deltaX: Float32Array[], deltaY: Float32Array[], dt: number): void {
    if (this.settings.repulsion <= 0) {
      return;
    }

    const radius = this.settings.targetEdgeLength * this.settings.splitThreshold * 1.25;
    if (radius <= 1e-6) {
      return;
    }
    const radiusSq = radius * radius;
    const cellSize = radius;
    const invCell = 1 / cellSize;
    const grid = new Map<string, SegmentRef[]>();

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      const segmentLimit = curve.closed ? curve.points.length : curve.points.length - 1;
      for (let segmentIndex = 0; segmentIndex < segmentLimit; segmentIndex += 1) {
        const aIndex = segmentIndex;
        const bIndex = (segmentIndex + 1) % curve.points.length;
        const a = curve.points[aIndex];
        const b = curve.points[bIndex];
        const minX = Math.min(a.x, b.x) - radius;
        const maxX = Math.max(a.x, b.x) + radius;
        const minY = Math.min(a.y, b.y) - radius;
        const maxY = Math.max(a.y, b.y) + radius;
        const cellMinX = Math.floor(minX * invCell);
        const cellMaxX = Math.floor(maxX * invCell);
        const cellMinY = Math.floor(minY * invCell);
        const cellMaxY = Math.floor(maxY * invCell);
        const ref: SegmentRef = { curveIndex, segmentIndex, aIndex, bIndex, minX, maxX, minY, maxY };

        for (let cx = cellMinX; cx <= cellMaxX; cx += 1) {
          for (let cy = cellMinY; cy <= cellMaxY; cy += 1) {
            const key = `${cx}|${cy}`;
            const bucket = grid.get(key);
            if (bucket) {
              bucket.push(ref);
            } else {
              grid.set(key, [ref]);
            }
          }
        }
      }
    }

    const strength = this.settings.repulsion * dt * 0.055;
    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let pointIndex = 0; pointIndex < curve.points.length; pointIndex += 1) {
        const point = curve.points[pointIndex];
        const cellX = Math.floor(point.x * invCell);
        const cellY = Math.floor(point.y * invCell);
        const visited = new Set<string>();

        for (let ox = -1; ox <= 1; ox += 1) {
          for (let oy = -1; oy <= 1; oy += 1) {
            const key = `${cellX + ox}|${cellY + oy}`;
            const bucket = grid.get(key);
            if (!bucket) {
              continue;
            }

            for (let si = 0; si < bucket.length; si += 1) {
              const segment = bucket[si];
              const segmentKey = `${segment.curveIndex}:${segment.segmentIndex}`;
              if (visited.has(segmentKey)) {
                continue;
              }
              visited.add(segmentKey);

              if (
                point.x < segment.minX || point.x > segment.maxX ||
                point.y < segment.minY || point.y > segment.maxY
              ) {
                continue;
              }

              const targetCurve = this.curves[segment.curveIndex];
              if (curve === targetCurve) {
                if (
                  pointIndex === segment.aIndex || pointIndex === segment.bIndex ||
                  this.areAdjacent(curve, pointIndex, targetCurve, segment.aIndex) ||
                  this.areAdjacent(curve, pointIndex, targetCurve, segment.bIndex)
                ) {
                  continue;
                }
              }

              const a = targetCurve.points[segment.aIndex];
              const b = targetCurve.points[segment.bIndex];
              const vx = b.x - a.x;
              const vy = b.y - a.y;
              const lenSq = vx * vx + vy * vy;
              if (lenSq <= 1e-12) {
                continue;
              }

              const wx = point.x - a.x;
              const wy = point.y - a.y;
              const t = MathUtils.clamp((wx * vx + wy * vy) / lenSq, 0, 1);
              const closestX = a.x + vx * t;
              const closestY = a.y + vy * t;
              const dx = point.x - closestX;
              const dy = point.y - closestY;
              const distSq = dx * dx + dy * dy;
              if (distSq <= 1e-12 || distSq >= radiusSq) {
                continue;
              }

              const dist = Math.sqrt(distSq);
              const falloff = 1 - dist / radius;
              const force = (strength * falloff) / (distSq + 1e-6);
              const ux = dx / dist;
              const uy = dy / dist;
              const fx = ux * force;
              const fy = uy * force;

              deltaX[curveIndex][pointIndex] += fx;
              deltaY[curveIndex][pointIndex] += fy;

              const weightA = 1 - t;
              const weightB = t;
              deltaX[segment.curveIndex][segment.aIndex] -= fx * weightA;
              deltaY[segment.curveIndex][segment.aIndex] -= fy * weightA;
              deltaX[segment.curveIndex][segment.bIndex] -= fx * weightB;
              deltaY[segment.curveIndex][segment.bIndex] -= fy * weightB;
            }
          }
        }
      }
    }
  }

  private applyCurveSmoothing(iterations: number, amount: number): void {
    const blend = MathUtils.clamp(amount, 0, 0.45);
    if (iterations <= 0 || blend <= 0) {
      return;
    }

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      if (curve.points.length < 2) {
        continue;
      }

      const work = curve.points.map((point) => point.clone());
      for (let pass = 0; pass < iterations; pass += 1) {
        for (let i = 0; i < curve.points.length; i += 1) {
          const prev = this.previousIndex(curve, i);
          const next = this.nextIndex(curve, i);
          let avgX = curve.points[i].x;
          let avgY = curve.points[i].y;
          let count = 1;
          if (prev >= 0) {
            avgX += curve.points[prev].x;
            avgY += curve.points[prev].y;
            count += 1;
          }
          if (next >= 0) {
            avgX += curve.points[next].x;
            avgY += curve.points[next].y;
            count += 1;
          }
          avgX /= count;
          avgY /= count;

          const inhibition = MathUtils.clamp(curve.mask[i], 0, 1);
          const localBlend = blend * (1 - inhibition);
          work[i].x = MathUtils.lerp(curve.points[i].x, avgX, localBlend);
          work[i].y = MathUtils.lerp(curve.points[i].y, avgY, localBlend);
          work[i].z = 0;
        }

        for (let i = 0; i < curve.points.length; i += 1) {
          curve.points[i].copy(work[i]);
        }
      }
    }
  }

  private maybeSplitLongSegments(): void {
    const splitLength = this.settings.targetEdgeLength * this.settings.splitThreshold;
    if (splitLength <= 1e-6) {
      return;
    }

    let didSplit = true;
    let passes = 0;
    while (didSplit && passes < 2) {
      didSplit = false;
      passes += 1;

      for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
        const curve = this.curves[curveIndex];
        if (this.getTotalPointCount() >= this.settings.maxVertices) {
          return;
        }

        const segmentLimit = curve.closed ? curve.points.length : curve.points.length - 1;
        for (let i = 0; i < segmentLimit; i += 1) {
          const next = (i + 1) % curve.points.length;
          const a = curve.points[i];
          const b = curve.points[next];
          if (distance2d(a, b) <= splitLength) {
            continue;
          }

          const midpoint = new Vector3((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
          const baseMid = new Vector3(
            (curve.basePoints[i].x + curve.basePoints[next].x) * 0.5,
            (curve.basePoints[i].y + curve.basePoints[next].y) * 0.5,
            0,
          );
          const maskMid = (curve.mask[i] + curve.mask[next]) * 0.5;
          const variationMid = (curve.variation[i] + curve.variation[next]) * 0.5;

          if (curve.closed && next === 0) {
            curve.points.push(midpoint);
            curve.basePoints.push(baseMid);
            curve.mask = this.expandScalarArray(curve.mask, curve.mask.length, maskMid);
            curve.variation = this.expandScalarArray(curve.variation, curve.variation.length, variationMid);
          } else {
            curve.points.splice(next, 0, midpoint);
            curve.basePoints.splice(next, 0, baseMid);
            curve.mask = this.expandScalarArray(curve.mask, next, maskMid);
            curve.variation = this.expandScalarArray(curve.variation, next, variationMid);
          }

          curve.curvature = new Float32Array(curve.points.length);
          curve.displacement = new Float32Array(curve.points.length);
          didSplit = true;
          i += 1;

          if (this.getTotalPointCount() >= this.settings.maxVertices) {
            return;
          }
        }
      }
    }
  }

  private updateScalarFields(): void {
    let minCurvature = Number.POSITIVE_INFINITY;
    let maxCurvature = Number.NEGATIVE_INFINITY;
    let maxDisplacement = 0;

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let i = 0; i < curve.points.length; i += 1) {
        const prev = this.previousIndex(curve, i);
        const next = this.nextIndex(curve, i);
        let curvature = 0;
        if (prev >= 0 && next >= 0) {
          const current = curve.points[i];
          const avgX = (curve.points[prev].x + curve.points[next].x) * 0.5;
          const avgY = (curve.points[prev].y + curve.points[next].y) * 0.5;
          curvature = Math.hypot(avgX - current.x, avgY - current.y);
        }

        curve.curvature[i] = curvature;
        if (curvature < minCurvature) {
          minCurvature = curvature;
        }
        if (curvature > maxCurvature) {
          maxCurvature = curvature;
        }

        const displacement = distance2d(curve.points[i], curve.basePoints[i]);
        curve.displacement[i] = displacement;
        if (displacement > maxDisplacement) {
          maxDisplacement = displacement;
        }
      }
    }

    const curvatureSpan = Math.max(maxCurvature - minCurvature, 1e-6);
    const invCurvatureSpan = 1 / curvatureSpan;
    const invMaxDisplacement = maxDisplacement > 1e-8 ? 1 / maxDisplacement : 0;

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let i = 0; i < curve.points.length; i += 1) {
        curve.curvature[i] = MathUtils.clamp((curve.curvature[i] - minCurvature) * invCurvatureSpan, 0, 1);
        curve.displacement[i] = invMaxDisplacement > 0 ? MathUtils.clamp(curve.displacement[i] * invMaxDisplacement, 0, 1) : 0;
      }
      this.blurScalarCurve(curve.curvature, curve.closed);
      this.blurScalarCurve(curve.displacement, curve.closed);
      this.renormalize(curve.curvature);
      this.renormalize(curve.displacement);
    }
  }

  private blurScalarCurve(values: Float32Array, closed: boolean): void {
    const amount = MathUtils.clamp(this.gradientBlur * 0.42, 0, 0.42);
    if (amount <= 0 || values.length <= 2) {
      return;
    }
    const passes = Math.max(1, Math.round(1 + this.gradientBlur * 5));
    const work = new Float32Array(values.length);

    for (let pass = 0; pass < passes; pass += 1) {
      for (let i = 0; i < values.length; i += 1) {
        const prev = closed ? (i - 1 + values.length) % values.length : i > 0 ? i - 1 : -1;
        const next = closed ? (i + 1) % values.length : i < values.length - 1 ? i + 1 : -1;
        let sum = values[i];
        let count = 1;
        if (prev >= 0) {
          sum += values[prev];
          count += 1;
        }
        if (next >= 0) {
          sum += values[next];
          count += 1;
        }
        const average = sum / count;
        work[i] = MathUtils.lerp(values[i], average, amount);
      }
      values.set(work);
    }
  }

  private renormalize(values: Float32Array): void {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] < min) {
        min = values[i];
      }
      if (values[i] > max) {
        max = values[i];
      }
    }
    const span = Math.max(max - min, 1e-6);
    for (let i = 0; i < values.length; i += 1) {
      values[i] = MathUtils.clamp((values[i] - min) / span, 0, 1);
    }
  }

  private modifyMask(point: Vector3, radius: number, falloffOffset: number, erase: boolean): void {
    const outer = radius + Math.max(0, falloffOffset);
    const hasFalloff = outer > radius + 1e-6;

    for (let curveIndex = 0; curveIndex < this.curves.length; curveIndex += 1) {
      const curve = this.curves[curveIndex];
      for (let i = 0; i < curve.points.length; i += 1) {
        const dist = distance2d(curve.points[i], point);
        if (dist > outer) {
          continue;
        }

        let strength = 1;
        if (dist > radius && hasFalloff) {
          const t = (dist - radius) / (outer - radius);
          strength = Math.max(0, 1 - t);
        }

        if (erase) {
          curve.mask[i] = Math.max(0, curve.mask[i] - strength);
        } else if (strength > curve.mask[i]) {
          curve.mask[i] = strength;
        }
      }
    }
  }

  private previousIndex(curve: CurveState, index: number): number {
    if (curve.closed) {
      return (index - 1 + curve.points.length) % curve.points.length;
    }
    return index > 0 ? index - 1 : -1;
  }

  private nextIndex(curve: CurveState, index: number): number {
    if (curve.closed) {
      return (index + 1) % curve.points.length;
    }
    return index < curve.points.length - 1 ? index + 1 : -1;
  }

  private areAdjacent(curveA: CurveState, indexA: number, curveB: CurveState, indexB: number): boolean {
    if (curveA !== curveB) {
      return false;
    }
    if (Math.abs(indexA - indexB) === 1) {
      return true;
    }
    if (curveA.closed) {
      const count = curveA.points.length;
      return (indexA === 0 && indexB === count - 1) || (indexB === 0 && indexA === count - 1);
    }
    return false;
  }

  private flattenPoints(points: Vector3[]): number[] {
    const flat = new Array<number>(points.length * 3);
    for (let i = 0; i < points.length; i += 1) {
      const offset = i * 3;
      flat[offset] = points[i].x;
      flat[offset + 1] = points[i].y;
      flat[offset + 2] = 0;
    }
    return flat;
  }

  private expandPoints(flat: number[]): Vector3[] {
    const points: Vector3[] = [];
    for (let i = 0; i + 2 < flat.length; i += 3) {
      points.push(new Vector3(flat[i], flat[i + 1], 0));
    }
    return points;
  }

  private expandScalarArray(array: Float32Array, insertIndex: number, value: number): Float32Array {
    const next = new Float32Array(array.length + 1);
    next.set(array.subarray(0, insertIndex), 0);
    next[insertIndex] = value;
    next.set(array.subarray(insertIndex), insertIndex + 1);
    return next;
  }
}
