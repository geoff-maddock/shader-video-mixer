"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Grid2X2, Grid, Layers, Maximize2 } from "lucide-react"
import ShaderPreview from "./shader-preview"

export default function MixerInterface() {
  const {
    mixerState,
    setActiveInput,
    updateMixerProperty,
    updateInputProperty,
    togglePlayback,
    shaders,
    setShaderToInput,
  } = useShaderMixer()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDrop = (e: React.DragEvent, inputIndex: number) => {
    e.preventDefault()
    const shaderId = e.dataTransfer.getData("shaderId")
    if (shaderId) {
      setActiveInput(inputIndex)
      setShaderToInput(shaderId, inputIndex)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getShaderName = (shaderId: string | null) => {
    if (!shaderId) return "Empty"
    const shader = shaders.find((s) => s.id === shaderId)
    return shader ? shader.name : "Unknown"
  }

  // Track mouse position for shader uniforms
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const handleMouseMove = (e: MouseEvent) => {
      // Store mouse position in a custom attribute that shader previews can access
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      container.setAttribute("data-mouse-x", x.toString())
      container.setAttribute("data-mouse-y", y.toString())
    }

    container.addEventListener("mousemove", handleMouseMove)
    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={mixerState.isPlaying ? "default" : "outline"}
            size="sm"
            onClick={togglePlayback}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {mixerState.isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {mixerState.isPlaying ? "Pause" : "Play"}
          </Button>

          <Select value={mixerState.mixMode} onValueChange={(value) => updateMixerProperty("mixMode", value)}>
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
              {mixerState.mixMode === "quad" && <Grid2X2 className="h-4 w-4 mr-2" />}
              {mixerState.mixMode === "stack" && <Layers className="h-4 w-4 mr-2" />}
              {mixerState.mixMode === "split" && <Grid className="h-4 w-4 mr-2" />}
              {mixerState.mixMode === "single" && <Maximize2 className="h-4 w-4 mr-2" />}
              <SelectValue placeholder="Mix Mode" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="quad">Quad View</SelectItem>
              <SelectItem value="stack">Stack</SelectItem>
              <SelectItem value="split">Split Screen</SelectItem>
              <SelectItem value="single">Single Input</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Transition:</span>
          <Select
            value={mixerState.transitionType}
            onValueChange={(value) => updateMixerProperty("transitionType", value)}
          >
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Transition" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="crossfade">Crossfade</SelectItem>
              <SelectItem value="wipe">Wipe</SelectItem>
              <SelectItem value="dissolve">Dissolve</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="slide">Slide</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Duration:</span>
            <Slider
              className="w-24"
              min={0.1}
              max={5}
              step={0.1}
              value={[mixerState.transitionDuration]}
              onValueChange={(value) => updateMixerProperty("transitionDuration", value[0])}
            />
            <span className="text-sm w-8">{mixerState.transitionDuration.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div
        className={`grid ${mixerState.mixMode === "quad" ? "grid-cols-2" : "grid-cols-1"} gap-4 aspect-video`}
        data-mixer-container="true"
      >
        {mixerState.inputs.map((input, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden border-2 ${
              mixerState.activeInput === index ? "border-purple-500" : "border-gray-700"
            } ${mixerState.mixMode === "single" && mixerState.activeInput !== index ? "hidden" : ""} ${
              mixerState.mixMode === "split" && index > 1 ? "hidden" : ""
            }`}
            onClick={() => setActiveInput(index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
            data-input-index={index}
          >
            {input.shaderId ? (
              <div className="w-full h-full">
                <ShaderPreview
                  shaderId={input.shaderId}
                  inputIndex={index}
                  showDebug={false}
                  opacity={input.opacity}
                  blendMode={input.blendMode}
                  effects={input.effects}
                  isPlaying={mixerState.isPlaying}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-2">Drop Shader Here</p>
                <div className="text-xs text-gray-600 text-center">
                  <p>Supported formats:</p>
                  <p>.glsl, .frag, .shadertoy</p>
                  <p>ShaderToy URLs or JSON exports</p>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Input {index + 1}: {getShaderName(input.shaderId)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Opacity:</span>
                  <Slider
                    className="w-20"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[input.opacity]}
                    onValueChange={(value) => updateInputProperty(index, "opacity", value[0])}
                    disabled={!input.shaderId}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

