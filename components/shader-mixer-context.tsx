"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ShaderType = {
  id: string
  name: string
  thumbnail: string
  description: string
  category: string
  code?: string // Add this line for storing shader code
  isCustom?: boolean // Add this to identify custom shaders
}

export type MixerInput = {
  shaderId: string | null
  opacity: number
  blendMode: string
  effects: string[]
}

export type MixerState = {
  inputs: [MixerInput, MixerInput, MixerInput, MixerInput]
  activeInput: number
  mixMode: string
  transitionType: string
  transitionDuration: number
  outputFormat: string
  outputQuality: string
  outputFps: number
  isRecording: boolean
  isPlaying: boolean
}

type ShaderMixerContextType = {
  shaders: ShaderType[]
  mixerState: MixerState
  setShaderToInput: (shaderId: string, inputIndex: number) => void
  setActiveInput: (inputIndex: number) => void
  updateInputProperty: (inputIndex: number, property: keyof MixerInput, value: any) => void
  updateMixerProperty: <K extends keyof MixerState>(property: K, value: MixerState[K]) => void
  toggleRecording: () => void
  togglePlayback: () => void
  addEffect: (inputIndex: number, effect: string) => void
  removeEffect: (inputIndex: number, effect: string) => void
  addCustomShader: (shader: Partial<ShaderType>) => string // Returns the new shader ID
}

const defaultMixerState: MixerState = {
  inputs: [
    { shaderId: null, opacity: 1, blendMode: "normal", effects: [] },
    { shaderId: null, opacity: 1, blendMode: "normal", effects: [] },
    { shaderId: null, opacity: 1, blendMode: "normal", effects: [] },
    { shaderId: null, opacity: 1, blendMode: "normal", effects: [] },
  ],
  activeInput: 0,
  mixMode: "quad",
  transitionType: "crossfade",
  transitionDuration: 1.0,
  outputFormat: "mp4",
  outputQuality: "high",
  outputFps: 30,
  isRecording: false,
  isPlaying: true,
}

// Sample shader data
const sampleShaders: ShaderType[] = [
  {
    id: "shader1",
    name: "Plasma Wave",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Colorful plasma waves with dynamic movement",
    category: "abstract",
    code: `
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord/iResolution.xy;
      vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
      fragColor = vec4(col,1.0);
    }
  `,
  },
  {
    id: "shader2",
    name: "Fractal Noise",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Procedural fractal noise patterns",
    category: "fractal",
    code: `
    // Simplex noise function
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord/iResolution.xy;
      
      float n = 0.0;
      float frequency = 1.0;
      float amplitude = 0.5;
      
      // Add multiple octaves of noise
      for (int i = 0; i < 5; i++) {
        n += amplitude * snoise(uv * frequency + iTime * 0.1);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      
      // Map noise to color
      vec3 color = vec3(0.5) + 0.5 * sin(vec3(0.2, 0.0, 0.6) * n * 10.0 + iTime);
      
      fragColor = vec4(color, 1.0);
    }
  `,
  },
  {
    id: "shader3",
    name: "Fire Effect",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Realistic fire simulation",
    category: "elements",
    code: `
    float rand(vec2 n) { 
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p){
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u*u*(3.0-2.0*u);
      
      float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
      return res*res;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord.xy / iResolution.xy;
      
      // Adjust UV coordinates
      uv.y = 1.0 - uv.y;
      uv.x = uv.x * 2.0 - 1.0;
      uv.x *= iResolution.x / iResolution.y;
      
      float n = noise(vec2(uv.x * 3.0, (uv.y * 5.0) - iTime * 0.8));
      
      // Create fire shape
      float gradient = pow(uv.y, 2.0) * 5.0;
      float shape = max(0.0, n - gradient);
      
      // Fire colors
      vec3 color = vec3(1.5, 0.5, 0.0) * shape;
      color += vec3(1.0, 0.5, 0.0) * pow(shape, 2.0);
      color += vec3(1.0, 0.2, 0.0) * pow(shape, 8.0);
      
      // Add glow
      color += vec3(0.8, 0.3, 0.0) * 0.5 * pow(max(0.0, 1.0 - gradient * 0.5), 3.0);
      
      fragColor = vec4(color, 1.0);
    }
  `,
  },
  {
    id: "shader4",
    name: "Ocean Waves",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Realistic ocean wave simulation",
    category: "elements",
    code: `
    // Simplex noise function
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord/iResolution.xy;
      
      // Create wave effect
      float time = iTime * 0.3;
      float wave1 = snoise(vec2(uv.x * 4.0 + time, uv.y * 4.0)) * 0.1;
      float wave2 = snoise(vec2(uv.x * 8.0 - time * 0.5, uv.y * 8.0)) * 0.05;
      
      // Combine waves
      float waves = wave1 + wave2;
      
      // Create depth gradient
      float depth = mix(0.3, 1.0, uv.y);
      
      // Create ocean colors
      vec3 deepColor = vec3(0.0, 0.1, 0.3);
      vec3 shallowColor = vec3(0.0, 0.5, 0.8);
      vec3 surfaceColor = vec3(0.8, 0.9, 1.0);
      
      // Mix colors based on depth and waves
      vec3 color = mix(deepColor, shallowColor, depth);
      color = mix(color, surfaceColor, pow(waves + 0.5, 8.0));
      
      // Add highlights
      float highlight = pow(max(0.0, waves + 0.3), 16.0);
      color += surfaceColor * highlight;
      
      fragColor = vec4(color, 1.0);
    }
  `,
  },
  {
    id: "shader5",
    name: "Starfield",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Dynamic star field with parallax effect",
    category: "space",
    code: `
    float rand(vec2 co){
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
      
      // Background color
      vec3 color = vec3(0.0, 0.0, 0.1);
      
      // Create stars
      for (int i = 0; i < 3; i++) {
        float speed = 0.1 + float(i) * 0.2;
        float size = 0.6 - float(i) * 0.2;
        
        // Create star layer
        float t = iTime * speed;
        vec2 uvLayer = uv * (1.0 + float(i) * 2.0);
        vec2 gridUV = fract(uvLayer + t * 0.1) - 0.5;
        vec2 id = floor(uvLayer + t * 0.1);
        
        // Random star properties
        float cellRand = rand(id);
        float starSize = 0.005 * size * (0.5 + cellRand);
        float brightness = step(0.95, cellRand);
        
        // Star shape
        float star = 1.0 - smoothstep(starSize * 0.5, starSize * 1.5, length(gridUV));
        
        // Twinkle effect
        float twinkle = 0.5 + 0.5 * sin(iTime * 5.0 * cellRand);
        
        // Add star to scene
        color += vec3(1.0, 0.9, 0.8) * star * brightness * twinkle;
      }
      
      // Add subtle nebula
      vec2 nebulaUV = uv * 2.0;
      float nebula = 0.5 + 0.5 * sin(nebulaUV.x * 3.0 + iTime * 0.1) * sin(nebulaUV.y * 2.0 - iTime * 0.05);
      color += vec3(0.1, 0.0, 0.2) * nebula * 0.3;
      
      fragColor = vec4(color, 1.0);
    }
  `,
  },
  {
    id: "shader6",
    name: "Audio Visualizer",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Audio reactive visualization",
    category: "audio",
    code: `
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord/iResolution.xy;
      
      // Center coordinates
      vec2 center = vec2(0.5, 0.5);
      float dist = length(uv - center);
      
      // Create circular audio bars
      float angle = atan(uv.y - center.y, uv.x - center.x);
      float normAngle = (angle + 3.14159) / (2.0 * 3.14159);
      
      // Simulate audio data with sine waves
      float audioData = 0.0;
      for (int i = 0; i < 8; i++) {
        float freq = float(i + 1) * 0.5;
        float amp = 0.5 / float(i + 1);
        audioData += sin(normAngle * 20.0 * freq + iTime * freq) * amp;
      }
      audioData = 0.5 + 0.5 * audioData;
      
      // Create audio bars
      float innerRadius = 0.2;
      float outerRadius = 0.4;
      float barWidth = 0.01;
      
      // Check if we're in the circular bar area
      if (dist > innerRadius && dist < outerRadius && 
          mod(normAngle * 40.0, barWidth * 2.0) < barWidth) {
        // Audio reactive height
        float barHeight = audioData * (outerRadius - innerRadius);
        if (dist < innerRadius + barHeight) {
          // Color based on audio intensity and angle
          vec3 color = 0.5 + 0.5 * cos(vec3(0.0, 0.3, 0.6) * normAngle * 6.28 + iTime);
          fragColor = vec4(color, 1.0);
          return;
        }
      }
      
      // Background gradient
      vec3 bgColor = mix(
        vec3(0.1, 0.0, 0.2),
        vec3(0.0, 0.0, 0.1),
        dist
      );
      
      fragColor = vec4(bgColor, 1.0);
    }
  `,
  },
  {
    id: "shader7",
    name: "Geometric Patterns",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Animated geometric patterns",
    category: "geometric",
    code: `
    float sdHexagon(vec2 p, float size) {
      p = abs(p);
      float edge = dot(p, normalize(vec2(1.0, 1.73)));
      edge = max(edge, p.x);
      return edge - size;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
      
      // Rotate over time
      float angle = iTime * 0.2;
      mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      uv = rot * uv;
      
      // Create hexagon grid
      float scale = 8.0 + 4.0 * sin(iTime * 0.5);
      vec2 grid = uv * scale;
      vec2 gridId = floor(grid);
      vec2 gridUv = fract(grid) - 0.5;
      
      // Calculate distance to hexagon
      float size = 0.4 + 0.1 * sin(length(gridId) - iTime * 2.0);
      float d = sdHexagon(gridUv, size);
      
      // Create pattern
      float pattern = smoothstep(0.01, 0.0, d);
      
      // Color based on position and time
      vec3 color = 0.5 + 0.5 * cos(iTime + gridId.xyx + vec3(0, 2, 4));
      
      // Final color
      vec3 finalColor = mix(vec3(0.1, 0.1, 0.2), color, pattern);
      
      fragColor = vec4(finalColor, 1.0);
    }
  `,
  },
  {
    id: "shader8",
    name: "Neon Glow",
    thumbnail: "/placeholder.svg?height=150&width=150",
    description: "Glowing neon effect with bloom",
    category: "effects",
    code: `
    float sdCircle(vec2 p, float r) {
      return length(p) - r;
    }

    float sdLine(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
      
      // Background
      vec3 color = vec3(0.02, 0.02, 0.05);
      
      // Create neon shapes
      float time = iTime * 0.5;
      
      // Rotating triangle
      vec2 p1 = 0.3 * vec2(cos(time), sin(time));
      vec2 p2 = 0.3 * vec2(cos(time + 2.09), sin(time + 2.09));
      vec2 p3 = 0.3 * vec2(cos(time + 4.19), sin(time + 4.19));
      
      float line1 = sdLine(uv, p1, p2);
      float line2 = sdLine(uv, p2, p3);
      float line3 = sdLine(uv, p3, p1);
      
      float triangle = min(min(line1, line2), line3);
      
      // Pulsing circle
      float circle = sdCircle(uv, 0.2 + 0.05 * sin(time * 3.0));
      
      // Combine shapes
      float d = min(triangle, circle);
      
      // Create glow effect
      float glow = 0.0015 / (d * d + 0.000001);
      
      // Neon colors
      vec3 neonColor = mix(
        vec3(0.0, 1.0, 0.7),  // Cyan for triangle
        vec3(1.0, 0.2, 0.8),  // Pink for circle
        smoothstep(0.0, 0.1, abs(circle - triangle))
      );
      
      // Add glow to scene
      color += neonColor * glow;
      
      // Add solid line
      color += neonColor * (1.0 - smoothstep(0.003, 0.004, d));
      
      // Vignette
      color *= 1.0 - 0.5 * length(uv);
      
      fragColor = vec4(color, 1.0);
    }
  `,
  },
]

const ShaderMixerContext = createContext<ShaderMixerContextType | undefined>(undefined)

export function ShaderMixerProvider({ children }: { children: ReactNode }) {
  const [shaders, setShaders] = useState<ShaderType[]>(sampleShaders)
  const [mixerState, setMixerState] = useState<MixerState>(defaultMixerState)

  // Add this function to handle custom shader addition
  const addCustomShader = (shader: Partial<ShaderType>) => {
    const newShaderId = `custom-${Date.now()}`
    const newShader: ShaderType = {
      id: newShaderId,
      name: shader.name || "Custom Shader",
      thumbnail: shader.thumbnail || "/placeholder.svg?height=150&width=150",
      description: shader.description || "Custom shader code",
      category: shader.category || "custom",
      code: shader.code,
      isCustom: true,
    }

    setShaders((prev) => [...prev, newShader])
    return newShaderId
  }

  const setShaderToInput = (shaderId: string, inputIndex: number) => {
    setMixerState((prev) => {
      const newInputs = [...prev.inputs]
      newInputs[inputIndex] = { ...newInputs[inputIndex], shaderId }
      return { ...prev, inputs: newInputs as MixerState["inputs"] }
    })
  }

  const setActiveInput = (inputIndex: number) => {
    setMixerState((prev) => ({ ...prev, activeInput: inputIndex }))
  }

  const updateInputProperty = (inputIndex: number, property: keyof MixerInput, value: any) => {
    setMixerState((prev) => {
      const newInputs = [...prev.inputs]
      newInputs[inputIndex] = { ...newInputs[inputIndex], [property]: value }
      return { ...prev, inputs: newInputs as MixerState["inputs"] }
    })
  }

  const updateMixerProperty = <K extends keyof MixerState>(property: K, value: MixerState[K]) => {
    setMixerState((prev) => ({ ...prev, [property]: value }))
  }

  const toggleRecording = () => {
    setMixerState((prev) => ({ ...prev, isRecording: !prev.isRecording }))
  }

  const togglePlayback = () => {
    setMixerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const addEffect = (inputIndex: number, effect: string) => {
    setMixerState((prev) => {
      const newInputs = [...prev.inputs]
      if (!newInputs[inputIndex].effects.includes(effect)) {
        newInputs[inputIndex] = {
          ...newInputs[inputIndex],
          effects: [...newInputs[inputIndex].effects, effect],
        }
      }
      return { ...prev, inputs: newInputs as MixerState["inputs"] }
    })
  }

  const removeEffect = (inputIndex: number, effect: string) => {
    setMixerState((prev) => {
      const newInputs = [...prev.inputs]
      newInputs[inputIndex] = {
        ...newInputs[inputIndex],
        effects: newInputs[inputIndex].effects.filter((e) => e !== effect),
      }
      return { ...prev, inputs: newInputs as MixerState["inputs"] }
    })
  }

  return (
    <ShaderMixerContext.Provider
      value={{
        shaders,
        mixerState,
        setShaderToInput,
        setActiveInput,
        updateInputProperty,
        updateMixerProperty,
        toggleRecording,
        togglePlayback,
        addEffect,
        removeEffect,
        addCustomShader, // Add this line
      }}
    >
      {children}
    </ShaderMixerContext.Provider>
  )
}

export function useShaderMixer() {
  const context = useContext(ShaderMixerContext)
  if (context === undefined) {
    throw new Error("useShaderMixer must be used within a ShaderMixerProvider")
  }
  return context
}

