"use client"

import { useEffect, useRef, useState } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Play, Pause, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShaderProgram, WebGLError } from "@/utils/webgl"
import ShaderDebugPanel from "./shader-debug-panel"
import { wrapShaderWithEffects } from "@/utils/shader-effects"
import { DEFAULT_SHADER_CODE } from "@/lib/constants"
import { wrapShaderToyCode } from "@/lib/shader-utils"
import { MixerEffect } from "./shader-mixer-context"

interface ShaderPreviewProps {
  shaderId: string | null
  inputIndex: number
  showDebug?: boolean
  opacity?: number
  blendMode?: string
  effects?: MixerEffect[] // Update to MixerEffect type
  effectsEnabled?: boolean
  isPlaying?: boolean
}

export default function ShaderPreview({
  shaderId,
  inputIndex,
  showDebug = true,
  opacity = 1,
  blendMode = "normal",
  effects = [],
  effectsEnabled = true,
  isPlaying: externalIsPlaying,
}: ShaderPreviewProps) {
  const { shaders } = useShaderMixer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const shaderProgramRef = useRef<ShaderProgram | null>(null)
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isCompiled, setIsCompiled] = useState(false)
  const mousePositionRef = useRef<[number, number, number, number]>([0, 0, 0, 0])

  // Use external isPlaying state if provided
  const effectiveIsPlaying = externalIsPlaying !== undefined ? externalIsPlaying : isPlaying

  const shader = shaderId ? shaders.find((s) => s.id === shaderId) : null

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Update mouse position for shader uniforms
      // Format: [current x, current y, click x, click y]
      mousePositionRef.current = [x, y, mousePositionRef.current[2], mousePositionRef.current[3]]
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Update click position
      mousePositionRef.current = [mousePositionRef.current[0], mousePositionRef.current[1], x, y]
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
    }
  }, [])

  // Set up WebGL and shader
  useEffect(() => {
    if (!shader || !canvasRef.current) return

    const canvas = canvasRef.current
    const gl = canvas.getContext("webgl2", {
      alpha: true, // Enable alpha channel for blending
      premultipliedAlpha: false, // Don't premultiply alpha
      preserveDrawingBuffer: true, // Needed for mixing shaders
    })

    if (!gl) {
      setErrors(["WebGL 2 is not supported in your browser"])
      return
    }

    try {
      // Clean up previous shader program
      if (shaderProgramRef.current) {
        shaderProgramRef.current.dispose()
      }

      // Default shader code if none provided
      const shaderCode = shader?.code || DEFAULT_SHADER_CODE
      const wrappedCode = shader?.category === "shadertoy" ? wrapShaderToyCode(shaderCode) : shaderCode

      // Process the shader code to include effects
      const processedCode = wrapShaderWithEffects(wrappedCode)

      // Create new shader program
      const shaderProgram = new ShaderProgram(gl, processedCode)
      shaderProgramRef.current = shaderProgram
      setIsCompiled(true)
      setErrors([])

      // Reset start time to ensure consistent animation
      startTimeRef.current = performance.now()

      // Animation loop
      let lastFrame = performance.now()
      const animate = (now: number) => {
        // Always request next frame to keep loop running
        animationRef.current = requestAnimationFrame(animate)

        // Only update and render if playing
        if (!effectiveIsPlaying) return

        const deltaTime = now - lastFrame
        lastFrame = now
        const time = (now - startTimeRef.current) / 1000

        // Resize canvas to match display size
        const displayWidth = canvas.clientWidth
        const displayHeight = canvas.clientHeight
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth
          canvas.height = displayHeight
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        }

        // Clear with transparency
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Enable blending
        gl.enable(gl.BLEND)

        // Set blend mode based on prop
        switch (blendMode) {
          case "multiply":
            gl.blendFunc(gl.DST_COLOR, gl.ZERO)
            break
          case "screen":
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR)
            break
          case "overlay":
            // Approximation of overlay
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            break
          case "darken":
            gl.blendFunc(gl.ONE, gl.ONE)
            gl.blendEquation(gl.MIN)
            break
          case "lighten":
            gl.blendFunc(gl.ONE, gl.ONE)
            gl.blendEquation(gl.MAX)
            break
          default:
            // Normal blend mode
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.blendEquation(gl.FUNC_ADD)
        }

        // Prepare effect uniform values
        const effectUniforms: Record<string, number> = {
          uEffectsEnabled: effectsEnabled ? 1.0 : 0.0,
        }

        // Add each effect's uniform value based on enabled state and intensity
        effects.forEach(effect => {
          const uniformName = `uEffect${effect.id.charAt(0).toUpperCase() + effect.id.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())}`
          effectUniforms[uniformName] = effect.enabled ? (effect.intensity || 0.5) : 0.0
        })

        // Update uniforms
        shaderProgram.setUniforms({
          iResolution: [gl.canvas.width, gl.canvas.height, 1.0],
          iTime: time,
          iTimeDelta: deltaTime / 1000,
          iFrame: Math.floor(time * 60),
          iMouse: mousePositionRef.current,
          iOpacity: opacity,
          ...effectUniforms
        })

        // Render frame
        shaderProgram.render(now)

        // Update debug info
        if (showDebug) {
          setDebugInfo(shaderProgram.getDebugInfo())
        }
      }

      animate(performance.now())

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        if (shaderProgramRef.current) {
          shaderProgramRef.current.dispose()
        }
      }
    } catch (error) {
      if (error instanceof WebGLError) {
        setErrors([error.message])
      } else if (error instanceof Error) {
        setErrors([error.message])
      } else {
        setErrors(["Unknown error occurred while setting up shader"])
      }
      setIsCompiled(false)
    }
  }, [shader, opacity, blendMode, effects, showDebug, effectiveIsPlaying, effectsEnabled])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const openFullscreen = () => {
    setIsFullscreen(true)
  }

  if (!shader) return null

  return (
    <>
      <div className="relative w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full object-cover" width={400} height={300} />

        <div className="absolute bottom-2 right-2 flex gap-1">
          {externalIsPlaying === undefined && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70"
            onClick={openFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {showDebug && <ShaderDebugPanel debugInfo={debugInfo} errors={errors} isCompiled={isCompiled} />}
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white">{shader.name}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[80vh]">
            <canvas ref={canvasRef} className="w-full h-full object-cover" width={800} height={600} />
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

