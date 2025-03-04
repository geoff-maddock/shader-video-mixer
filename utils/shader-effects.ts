// utils/shader-effects.ts
export type EffectName =
    | "blur"
    | "sharpen"
    | "noise"
    | "pixelate"
    | "edge-detection"
    | "bloom"
    | "chromatic-aberration"
    | "vignette"
    | "color-shift"
    | "invert"
    | "grayscale"
    | "sepia";

export type MixerEffect = {
    id: string;
    enabled: boolean;
    intensity: number;
};

export const effectShaderCode = `
// Effect shader functions to be included in all shaders

// Blur effect
vec4 applyBlur(vec2 uv, sampler2D tex, float intensity) {
  float blurSize = intensity * 0.02;
  vec4 sum = vec4(0.0);
  sum += texture(tex, vec2(uv.x - 4.0 * blurSize, uv.y)) * 0.05;
  sum += texture(tex, vec2(uv.x - 3.0 * blurSize, uv.y)) * 0.09;
  sum += texture(tex, vec2(uv.x - 2.0 * blurSize, uv.y)) * 0.12;
  sum += texture(tex, vec2(uv.x - blurSize, uv.y)) * 0.15;
  sum += texture(tex, vec2(uv.x, uv.y)) * 0.16;
  sum += texture(tex, vec2(uv.x + blurSize, uv.y)) * 0.15;
  sum += texture(tex, vec2(uv.x + 2.0 * blurSize, uv.y)) * 0.12;
  sum += texture(tex, vec2(uv.x + 3.0 * blurSize, uv.y)) * 0.09;
  sum += texture(tex, vec2(uv.x + 4.0 * blurSize, uv.y)) * 0.05;
  return sum;
}

// Sharpen effect
vec4 applySharpen(vec2 uv, sampler2D tex, float intensity) {
  float sharpenSize = 1.0 / 512.0;
  vec4 center = texture(tex, uv);
  vec4 top = texture(tex, uv + vec2(0, -sharpenSize));
  vec4 bottom = texture(tex, uv + vec2(0, sharpenSize));
  vec4 left = texture(tex, uv + vec2(-sharpenSize, 0));
  vec4 right = texture(tex, uv + vec2(sharpenSize, 0));
  
  return center + (center - (top + bottom + left + right) * 0.25) * intensity;
}

// Noise effect
vec4 applyNoise(vec2 uv, vec4 color, float intensity, float time) {
  float noise = fract(sin(dot(uv + time * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
  return mix(color, vec4(noise), intensity);
}

// Pixelate effect
vec4 applyPixelate(vec2 uv, sampler2D tex, float intensity) {
  float pixelSize = intensity * 100.0;
  if (pixelSize <= 1.0) return texture(tex, uv);
  
  vec2 pixelated = floor(uv * pixelSize) / pixelSize;
  return texture(tex, pixelated);
}

// Edge detection effect
vec4 applyEdgeDetection(vec2 uv, sampler2D tex, float intensity) {
  float dx = 1.0 / 512.0;
  float dy = 1.0 / 512.0;
  
  vec4 c1 = texture(tex, uv + vec2(-dx, -dy));
  vec4 c2 = texture(tex, uv + vec2(0, -dy));
  vec4 c3 = texture(tex, uv + vec2(dx, -dy));
  vec4 c4 = texture(tex, uv + vec2(-dx, 0));
  vec4 c5 = texture(tex, uv);
  vec4 c6 = texture(tex, uv + vec2(dx, 0));
  vec4 c7 = texture(tex, uv + vec2(-dx, dy));
  vec4 c8 = texture(tex, uv + vec2(0, dy));
  vec4 c9 = texture(tex, uv + vec2(dx, dy));
  
  vec4 edge = 8.0 * c5 - (c1 + c2 + c3 + c4 + c6 + c7 + c8 + c9);
  return mix(c5, vec4(edge.rgb, c5.a), intensity);
}

// Bloom effect
vec4 applyBloom(vec2 uv, sampler2D tex, float intensity) {
  vec4 color = texture(tex, uv);
  vec4 blurred = applyBlur(uv, tex, intensity);
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float threshold = 0.6;
  
  return color + blurred * intensity * max(luminance - threshold, 0.0) * 2.0;
}

// Chromatic aberration effect
vec4 applyChromatic(vec2 uv, sampler2D tex, float intensity) {
  float aberration = intensity * 0.01;
  
  vec2 uvR = uv + vec2(aberration, 0);
  vec2 uvB = uv - vec2(aberration, 0);
  
  vec4 color = texture(tex, uv);
  color.r = texture(tex, uvR).r;
  color.b = texture(tex, uvB).b;
  
  return color;
}

// Vignette effect
vec4 applyVignette(vec2 uv, vec4 color, float intensity) {
  float dist = length(uv - 0.5);
  float vignette = smoothstep(0.5, 0.2, dist * intensity);
  return vec4(color.rgb * vignette, color.a);
}

// Color shift effect
vec4 applyColorShift(vec4 color, float intensity, float time) {
  mat3 rotationMatrix = mat3(
    vec3(cos(time * intensity), sin(time * intensity), 0.0),
    vec3(-sin(time * intensity), cos(time * intensity), 0.0),
    vec3(0.0, 0.0, 1.0)
  );
  
  return vec4(rotationMatrix * color.rgb, color.a);
}

// Invert effect
vec4 applyInvert(vec4 color, float intensity) {
  return mix(color, vec4(1.0 - color.rgb, color.a), intensity);
}

// Grayscale effect
vec4 applyGrayscale(vec4 color, float intensity) {
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  return mix(color, vec4(vec3(luminance), color.a), intensity);
}

// Sepia effect
vec4 applySepia(vec4 color, float intensity) {
  vec3 sepia = vec3(
    dot(color.rgb, vec3(0.393, 0.769, 0.189)),
    dot(color.rgb, vec3(0.349, 0.686, 0.168)),
    dot(color.rgb, vec3(0.272, 0.534, 0.131))
  );
  
  return mix(color, vec4(sepia, color.a), intensity);
}

// Apply all effects
vec4 applyEffects(vec2 uv, vec4 color, sampler2D tex, float time) {
  vec4 result = color;
  
  // Only apply effects if they're enabled globally
  if (uEffectsEnabled < 0.5) return result;
  
  // Apply each effect if enabled
  if (uEffectBlur > 0.0) result = applyBlur(uv, tex, uEffectBlur);
  if (uEffectSharpen > 0.0) result = applySharpen(uv, tex, uEffectSharpen);
  if (uEffectNoise > 0.0) result = applyNoise(uv, result, uEffectNoise, time);
  if (uEffectPixelate > 0.0) result = applyPixelate(uv, tex, uEffectPixelate);
  if (uEffectEdgeDetection > 0.0) result = applyEdgeDetection(uv, tex, uEffectEdgeDetection);
  if (uEffectBloom > 0.0) result = applyBloom(uv, tex, uEffectBloom);
  if (uEffectChromatic > 0.0) result = applyChromatic(uv, tex, uEffectChromatic);
  if (uEffectVignette > 0.0) result = applyVignette(uv, result, uEffectVignette);
  if (uEffectColorShift > 0.0) result = applyColorShift(result, uEffectColorShift, time);
  if (uEffectInvert > 0.0) result = applyInvert(result, uEffectInvert);
  if (uEffectGrayscale > 0.0) result = applyGrayscale(result, uEffectGrayscale);
  if (uEffectSepia > 0.0) result = applySepia(result, uEffectSepia);
  
  return result;
}
`;

// Function to wrap shader code with effect functions and uniforms
export function wrapShaderWithEffects(shaderCode: string): string {
    // Add effect uniforms
    const uniformDeclarations = `
// Effect uniforms
uniform float uEffectsEnabled;
uniform float uEffectBlur;
uniform float uEffectSharpen;
uniform float uEffectNoise;
uniform float uEffectPixelate;
uniform float uEffectEdgeDetection;
uniform float uEffectBloom;
uniform float uEffectChromatic;
uniform float uEffectVignette;
uniform float uEffectColorShift;
uniform float uEffectInvert;
uniform float uEffectGrayscale;
uniform float uEffectSepia;
`;

    // Find where to inject the code
    let modifiedCode = shaderCode;

    // Insert uniform declarations before main function
    modifiedCode = modifiedCode.replace(
        /void\s+main\s*\(\s*\)/,
        `${uniformDeclarations}\n${effectShaderCode}\nvoid main()`
    );

    // Add effect application before final gl_FragColor assignment
    const fragColorRegex = /gl_FragColor\s*=\s*([^;]+);/;
    if (fragColorRegex.test(modifiedCode)) {
        modifiedCode = modifiedCode.replace(
            fragColorRegex,
            'vec4 baseColor = $1; gl_FragColor = applyEffects(v_texCoord, baseColor, uTexture, iTime);'
        );
    }

    return modifiedCode;
}