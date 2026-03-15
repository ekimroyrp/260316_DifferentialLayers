import { Color, DoubleSide, ShaderMaterial, Vector3 } from 'three';
import type { MaterialSettings, ViewMode } from '../types';

export class MaterialController {
  readonly material: ShaderMaterial;

  constructor(settings: MaterialSettings) {
    this.material = new ShaderMaterial({
      side: DoubleSide,
      uniforms: {
        uGradientStart: { value: new Color(settings.gradientStart) },
        uGradientEnd: { value: new Color(settings.gradientEnd) },
        uGradientType: { value: settings.gradientType === 'displacement' ? 1.0 : 0.0 },
        uCurvatureContrast: { value: settings.curvatureContrast },
        uCurvatureBias: { value: settings.curvatureBias },
        uFresnel: { value: settings.fresnel },
        uSpecular: { value: settings.specular },
        uViewMode: { value: 0.0 },
        uLightDirA: { value: new Vector3(0.65, 0.8, 0.42).normalize() },
        uLightDirB: { value: new Vector3(-0.42, 0.24, 0.88).normalize() },
      },
      vertexShader: `
        attribute float aCurvature;
        attribute float aMask;
        attribute float aDisplacement;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vCurvature;
        varying float vMask;
        varying float vDisplacement;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = normalize(normalMatrix * normal);
          vCurvature = aCurvature;
          vMask = aMask;
          vDisplacement = aDisplacement;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vCurvature;
        varying float vMask;
        varying float vDisplacement;

        uniform vec3 uGradientStart;
        uniform vec3 uGradientEnd;
        uniform float uGradientType;
        uniform float uCurvatureContrast;
        uniform float uCurvatureBias;
        uniform float uFresnel;
        uniform float uSpecular;
        uniform float uViewMode;
        uniform vec3 uLightDirA;
        uniform vec3 uLightDirB;

        void main() {
          vec3 n = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 lightA = normalize(uLightDirA);
          vec3 lightB = normalize(uLightDirB);

          float maskView = step(0.5, uViewMode);
          float maskShade = clamp(1.0 - vMask, 0.0, 1.0);
          float curvature = clamp(vCurvature * uCurvatureContrast + uCurvatureBias, 0.0, 1.0);
          float displacement = clamp(vDisplacement * uCurvatureContrast + uCurvatureBias, 0.0, 1.0);
          vec3 curvatureColor = mix(uGradientStart, uGradientEnd, curvature);
          vec3 displacementColor = mix(uGradientStart, uGradientEnd, displacement);
          vec3 growthColor = mix(curvatureColor, displacementColor, step(0.5, uGradientType));
          vec3 baseColor = mix(growthColor, vec3(maskShade), maskView);

          float wrap = 0.32;
          float diffA = max((dot(n, lightA) + wrap) / (1.0 + wrap), 0.0);
          float diffB = max((dot(n, lightB) + wrap) / (1.0 + wrap), 0.0);

          float specA = pow(max(dot(reflect(-lightA, n), viewDir), 0.0), 76.0);
          float specB = pow(max(dot(reflect(-lightB, n), viewDir), 0.0), 32.0);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
          float specularScale = mix(uSpecular, 0.0, maskView);
          float fresnelScale = mix(uFresnel, 0.22, maskView);

          vec3 color = baseColor * (0.14 + 0.88 * (diffA * 0.9 + diffB * 0.5));
          color += vec3(1.0) * (specA + specB * 0.4) * specularScale;
          color += baseColor * fresnel * fresnelScale;
          color = mix(color, color * color * 1.25, 0.26);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }

  setViewMode(mode: ViewMode): void {
    this.material.uniforms.uViewMode.value = mode === 'mask' ? 1.0 : 0.0;
  }

  setMaterialSettings(settings: MaterialSettings): void {
    this.material.uniforms.uGradientType.value = settings.gradientType === 'displacement' ? 1.0 : 0.0;
    this.material.uniforms.uGradientStart.value.set(settings.gradientStart);
    this.material.uniforms.uGradientEnd.value.set(settings.gradientEnd);
    this.material.uniforms.uCurvatureContrast.value = settings.curvatureContrast;
    this.material.uniforms.uCurvatureBias.value = settings.curvatureBias;
    this.material.uniforms.uFresnel.value = settings.fresnel;
    this.material.uniforms.uSpecular.value = settings.specular;
  }

  dispose(): void {
    this.material.dispose();
  }
}
