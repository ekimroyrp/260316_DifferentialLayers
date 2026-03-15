import { Vector2 } from 'three';

export function isWithinCloseThreshold(start: Vector2, pointer: Vector2, thresholdPx: number): boolean {
  const dx = start.x - pointer.x;
  const dy = start.y - pointer.y;
  return dx * dx + dy * dy <= thresholdPx * thresholdPx;
}
