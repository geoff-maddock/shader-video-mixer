import { DEFAULT_VERTEX_SHADER, SHADERTOY_WRAPPER } from './shader-types';

/**
 * Error class for WebGL shader operations
 */
export class ShaderError extends Error {
    constructor(message: string, public readonly type: 'compilation' | 'runtime' | 'context') {
        super(message);
        this.name = 'ShaderError';
    }
}

/**
 * Compiles a shader program from vertex and fragment shader sources
 */
export function CompileShader(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShaderSource: string = DEFAULT_VERTEX_SHADER,
    fragmentShaderSource: string
): WebGLProgram | null {
    try {
        // Create and compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertexShader) {
            console.error('Failed to create vertex shader');
            return null;
        }
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        // Check vertex shader compilation
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(vertexShader);
            gl.deleteShader(vertexShader);
            console.error('Vertex shader compilation failed:', info);
            return null;
        }

        // Create and compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragmentShader) {
            console.error('Failed to create fragment shader');
            gl.deleteShader(vertexShader);
            return null;
        }
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Check fragment shader compilation
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(fragmentShader);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            console.error('Fragment shader compilation failed:', info);
            return null;
        }

        // Create and link program
        const program = gl.createProgram();
        if (!program) {
            console.error('Failed to create shader program');
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            return null;
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check program linking
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            console.error('Shader program linking failed:', info);
            return null;
        }

        // Cleanup individual shaders as they're now linked to the program
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    } catch (error) {
        console.error('Error during shader compilation:', error);
        return null;
    }
}

/**
 * Wraps ShaderToy code in a compatible format for our renderer
 */
export function wrapShaderToyCode(code: string): string {
    return SHADERTOY_WRAPPER.replace('// SHADER_CODE_PLACEHOLDER', code);
}

/**
 * Creates a texture from an image, video, or canvas element
 */
export function createTexture(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;

    // Set texture parameters
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    return texture;
}

/**
 * Creates a fullscreen quad for rendering shaders
 */
export function createFullscreenQuad(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram
): { buffer: WebGLBuffer | null; attribLocation: number } {
    // Create position buffer (fullscreen quad)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Positions for a fullscreen quad (2 triangles)
    const positions = [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Get position attribute location
    const attribLocation = gl.getAttribLocation(program, 'position');

    return { buffer, attribLocation };
}