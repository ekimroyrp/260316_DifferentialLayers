import {
  BackSide,
  Camera,
  Color,
  type ColorRepresentation,
  Mesh,
  Plane,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';

type InfiniteGridOptions = {
  width?: number;
  height?: number;
  cellSize?: number;
  sectionSize?: number;
  fadeDistance?: number;
  fadeStrength?: number;
  fadeFrom?: number;
  cellThickness?: number;
  sectionThickness?: number;
  cellColor?: ColorRepresentation;
  sectionColor?: ColorRepresentation;
  infiniteGrid?: boolean;
  followCamera?: boolean;
  y?: number;
  opacity?: number;
};

const VERTEX_SHADER = /* glsl */ `
varying vec3 localPosition;
varying vec4 worldPosition;

uniform vec3 worldCamProjPosition;
uniform vec3 worldPlanePosition;
uniform float fadeDistance;
uniform bool infiniteGrid;
uniform bool followCamera;

void main() {
  localPosition = position.xzy;
  if (infiniteGrid) {
    localPosition *= 1.0 + fadeDistance;
  }

  worldPosition = modelMatrix * vec4(localPosition, 1.0);
  if (followCamera) {
    worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
    localPosition = (inverse(modelMatrix) * worldPosition).xyz;
  }

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 localPosition;
varying vec4 worldPosition;

uniform vec3 worldCamProjPosition;
uniform float cellSize;
uniform float sectionSize;
uniform vec3 cellColor;
uniform vec3 sectionColor;
uniform float fadeDistance;
uniform float fadeStrength;
uniform float fadeFrom;
uniform float cellThickness;
uniform float sectionThickness;
uniform float opacity;

float getGrid(float size, float thickness) {
  vec2 r = localPosition.xz / size;
  vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
  float line = min(grid.x, grid.y) + 1.0 - thickness;
  return 1.0 - min(line, 1.0);
}

void main() {
  float g1 = getGrid(cellSize, cellThickness);
  float g2 = getGrid(sectionSize, sectionThickness);

  vec3 from = worldCamProjPosition * vec3(fadeFrom);
  float dist = distance(from, worldPosition.xyz);
  float d = 1.0 - min(dist / fadeDistance, 1.0);
  vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

  gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength) * opacity);
  gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
  if (gl_FragColor.a <= 0.0) {
    discard;
  }

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export class InfiniteFadingGrid {
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly plane = new Plane();
  private readonly up = new Vector3(0, 1, 0);
  private readonly origin = new Vector3(0, 0, 0);

  constructor(options: InfiniteGridOptions = {}) {
    const geometry = new PlaneGeometry(options.width ?? 200, options.height ?? 200);
    const material = new ShaderMaterial({
      transparent: true,
      side: BackSide,
      depthWrite: false,
      uniforms: {
        cellSize: { value: options.cellSize ?? 1 },
        sectionSize: { value: options.sectionSize ?? 5 },
        fadeDistance: { value: options.fadeDistance ?? 140 },
        fadeStrength: { value: options.fadeStrength ?? 1.2 },
        fadeFrom: { value: options.fadeFrom ?? 1 },
        cellThickness: { value: options.cellThickness ?? 0.6 },
        sectionThickness: { value: options.sectionThickness ?? 1.2 },
        opacity: { value: options.opacity ?? 1 },
        cellColor: { value: new Color(options.cellColor ?? '#8b9095') },
        sectionColor: { value: new Color(options.sectionColor ?? '#5e6368') },
        infiniteGrid: { value: options.infiniteGrid ?? true },
        followCamera: { value: options.followCamera ?? false },
        worldCamProjPosition: { value: new Vector3() },
        worldPlanePosition: { value: new Vector3() },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });
    material.alphaToCoverage = true;

    this.mesh = new Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.position.y = options.y ?? 0.001;
    this.mesh.renderOrder = -50;
  }

  update(camera: Camera) {
    this.mesh.updateWorldMatrix(true, false);
    this.plane.setFromNormalAndCoplanarPoint(this.up, this.origin).applyMatrix4(this.mesh.matrixWorld);
    const uniforms = this.mesh.material.uniforms;
    this.plane.projectPoint(camera.position, uniforms.worldCamProjPosition.value as Vector3);
    (uniforms.worldPlanePosition.value as Vector3).copy(this.origin).applyMatrix4(this.mesh.matrixWorld);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
