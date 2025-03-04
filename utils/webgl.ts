// WebGL shader utilities and error handling
export class WebGLError extends Error {
  constructor(
    message: string,
    public readonly type: "compilation" | "runtime" | "context",
  ) {
    super(message)
    this.name = "WebGLError"
  }
}

export function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new WebGLError("Failed to create shader", "runtime")
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new WebGLError(`Shader compilation failed: ${info}`, "compilation")
  }

  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram()
  if (!program) {
    throw new WebGLError("Failed to create shader program", "runtime")
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new WebGLError(`Program linking failed: ${info}`, "compilation")
  }

  return program
}

// Default vertex shader for fullscreen quad
export const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec4 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = a_position;
  v_texCoord = a_texCoord;
}`

// ShaderToy compatibility layer
export function wrapShaderToyCode(code: string): string {
  return `#version 300 es
precision highp float;
uniform vec3      iResolution;
uniform float     iTime;
uniform float     iTimeDelta;
uniform float     iFrame;
uniform vec4      iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
out vec4 fragColor;

${code}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    mainImage(fragColor, fragCoord);
}`
}

export interface ShaderUniforms {
  iResolution: [number, number, number]
  iTime: number
  iTimeDelta: number
  iFrame: number
  iMouse: [number, number, number, number]
  [key: string]: number | number[] | Float32Array | WebGLTexture
}

export class ShaderProgram {
  private program: WebGLProgram
  private uniformLocations: Map<string, WebGLUniformLocation>
  private frameCount = 0
  private lastTime = 0
  private debugInfo: {
    fps: number
    frameTime: number
    uniformValues: Record<string, any>
  } = {
      fps: 0,
      frameTime: 0,
      uniformValues: {},
    }
  private vao: WebGLVertexArrayObject | null = null

  constructor(
    private gl: WebGL2RenderingContext,
    fragmentShaderSource: string,
    vertexShaderSource: string = DEFAULT_VERTEX_SHADER,
  ) {
    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, wrapShaderToyCode(fragmentShaderSource))

    // Create and link program
    this.program = createProgram(gl, vertexShader, fragmentShader)

    // Clean up shaders
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    // Initialize uniform locations map
    this.uniformLocations = new Map()

    // Set up vertex attributes
    const positionAttributeLocation = gl.getAttribLocation(this.program, "a_position")
    const texCoordAttributeLocation = gl.getAttribLocation(this.program, "a_texCoord")

    // Create and bind vertex array object
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)

    // Create and set up position buffer
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    // Create and set up texCoord buffer
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(texCoordAttributeLocation)
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    // Unbind VAO when done
    gl.bindVertexArray(null)
  }

  public use(): void {
    this.gl.useProgram(this.program)
  }

  public setUniforms(uniforms: ShaderUniforms): void {
    const gl = this.gl // Store reference to gl for consistent use
    this.use() // Ensure use is called unconditionally

    for (const [name, value] of Object.entries(uniforms)) {
      let location = this.uniformLocations.get(name)
      if (!location) {
        location = gl.getUniformLocation(this.program, name)
        if (location) {
          this.uniformLocations.set(name, location)
        }
      }

      if (location) {
        if (Array.isArray(value) || value instanceof Float32Array) {
          switch (value.length) {
            case 2:
              gl.uniform2fv(location, value)
              break
            case 3:
              gl.uniform3fv(location, value)
              break
            case 4:
              gl.uniform4fv(location, value)
              break
            default:
              throw new WebGLError(`Unsupported uniform array length: ${value.length}`, "runtime")
          }
        } else if (typeof value === "number") {
          gl.uniform1f(location, value)
        } else if (value instanceof WebGLTexture) {
          // Handle texture uniforms
          const textureUnit = this.uniformLocations.size % 16 // Maximum of 16 texture units
          gl.activeTexture(gl.TEXTURE0 + textureUnit)
          gl.bindTexture(gl.TEXTURE_2D, value)
          gl.uniform1i(location, textureUnit)
        }

        // Store uniform values for debugging
        this.debugInfo.uniformValues[name] = value
      }
    }

    // Add specific handling for effect uniforms if needed
    const effectUniformNames = [
      "uEffectsEnabled",
      "uEffectBlur",
      "uEffectSharpen",
      "uEffectNoise",
      "uEffectPixelate",
      "uEffectEdgeDetection",
      "uEffectBloom",
      "uEffectChromatic",
      "uEffectVignette",
      "uEffectColorShift",
      "uEffectInvert",
      "uEffectGrayscale",
      "uEffectSepia"
    ];

    // Set default values for missing effect uniforms
    effectUniformNames.forEach(name => {
      if (uniforms[name] === undefined) {
        uniforms[name] = 0.0; // Default to disabled/zero intensity
      }
    });
  }

  public render(time: number): void {
    const deltaTime = time - this.lastTime
    this.lastTime = time
    this.frameCount++

    // Update FPS every second
    if (deltaTime > 0) {
      this.debugInfo.fps = 1000 / deltaTime
      this.debugInfo.frameTime = deltaTime
    }

    this.gl.useProgram(this.program)

    // Bind the VAO before drawing
    this.gl.bindVertexArray(this.vao)

    // Draw the fullscreen quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    // Unbind VAO after drawing
    this.gl.bindVertexArray(null)
  }

  public getDebugInfo() {
    return this.debugInfo
  }

  public dispose(): void {
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao)
    }
    this.gl.deleteProgram(this.program)
  }
}

