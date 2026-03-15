export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 1;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  signed(): number {
    return this.next() * 2 - 1;
  }

  getState(): number {
    return this.state >>> 0;
  }

  setState(state: number): void {
    this.state = (state >>> 0) || 1;
  }
}
