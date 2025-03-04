/**
 * Defines the shader data structures used throughout the application
 */

export interface Shader {
    id: string
    name: string
    vertexShader: string
    fragmentShader: string
    thumbnail?: string
    description?: string
    category?: string
    isCustom?: boolean
    metadata?: Record<string, unknown>
}

// Default vertex shader for fullscreen quad rendering
export const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}`;

// Default fragment shader template
export const DEFAULT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 color = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0, 2, 4));
  fragColor = vec4(color, 1.0);
}`;

// ShaderToy compatibility wrapper
export const SHADERTOY_WRAPPER = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform int frame;
uniform vec4 mouse;
out vec4 fragColor;

#define iResolution vec3(resolution, 1.0)
#define iTime time
#define iFrame frame
#define iMouse mouse

// SHADER_CODE_PLACEHOLDER

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`;

export interface ShaderUniforms {
    resolution: [number, number]
    time: number
    frame: number
    mouse: [number, number, number, number]
    [key: string]: number | number[] | Float32Array | WebGLTexture
}