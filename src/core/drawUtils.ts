import { CatmullRomCurve3, Vector2, Vector3 } from 'three';

export function isWithinCloseThreshold(start: Vector2, pointer: Vector2, thresholdPx: number): boolean {
  const dx = start.x - pointer.x;
  const dy = start.y - pointer.y;
  return dx * dx + dy * dy <= thresholdPx * thresholdPx;
}

type PointLike = {
  x: number;
  y: number;
  z?: number;
};

export function buildSubdividedCurve(points: PointLike[], closed: boolean, subdivision: number): PointLike[] {
  const safeSubdivision = Math.max(1, Math.round(subdivision));
  if (points.length < 2 || safeSubdivision <= 1) {
    return points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 }));
  }

  const controls = points.map((point) => new Vector3(point.x, point.y, 0));
  const curve = new CatmullRomCurve3(controls, closed, 'centripetal');
  const segmentCount = closed ? controls.length : controls.length - 1;
  const sampleCount = Math.max(closed ? 3 : 2, segmentCount * safeSubdivision);
  const result: PointLike[] = [];

  if (closed) {
    for (let i = 0; i < sampleCount; i += 1) {
      const p = curve.getPoint(i / sampleCount);
      result.push({ x: p.x, y: p.y, z: 0 });
    }
  } else {
    for (let i = 0; i <= sampleCount; i += 1) {
      const p = curve.getPoint(i / sampleCount);
      result.push({ x: p.x, y: p.y, z: 0 });
    }
  }

  return result;
}
