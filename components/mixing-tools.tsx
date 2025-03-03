"use client"

import { useState } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Sliders, Layers, Wand2, Clock, Trash2, Plus } from "lucide-react"

export default function MixingTools() {
  const { mixerState, updateInputProperty, addEffect, removeEffect } = useShaderMixer()
  const [newEffect, setNewEffect] = useState("")

  const activeInput = mixerState.inputs[mixerState.activeInput]
  const hasActiveShader = !!activeInput.shaderId

  const blendModes = [
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
  ]

  const availableEffects = [
    "blur",
    "sharpen",
    "noise",
    "pixelate",
    "edge-detection",
    "bloom",
    "chromatic-aberration",
    "vignette",
    "color-shift",
    "invert",
    "grayscale",
    "sepia",
  ]

  return (
    <div className="bg-gray-900 rounded-md border border-gray-800">
      <Tabs defaultValue="blend" className="w-full">
        <TabsList className="w-full bg-gray-800 rounded-t-md">
          <TabsTrigger value="blend" className="flex-1">
            <Layers className="h-4 w-4 mr-2" />
            Blend
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex-1">
            <Wand2 className="h-4 w-4 mr-2" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="params" className="flex-1">
            <Sliders className="h-4 w-4 mr-2" />
            Parameters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blend" className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-1 block">Blend Mode</label>
              <Select
                value={activeInput.blendMode}
                onValueChange={(value) => updateInputProperty(mixerState.activeInput, "blendMode", value)}
                disabled={!hasActiveShader}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select blend mode" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {blendModes.map((mode) => (
                    <SelectItem key={mode} value={mode} className="capitalize">
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-1 block">Opacity</label>
              <div className="flex items-center gap-2">
                <Slider
                  className="flex-1"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[activeInput.opacity]}
                  onValueChange={(value) => updateInputProperty(mixerState.activeInput, "opacity", value[0])}
                  disabled={!hasActiveShader}
                />
                <span className="text-sm w-10">{(activeInput.opacity * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {blendModes.map((mode) => (
              <Button
                key={mode}
                variant="outline"
                size="sm"
                className={`capitalize ${activeInput.blendMode === mode ? "bg-purple-900 border-purple-500" : "bg-gray-800 border-gray-700"}`}
                onClick={() => updateInputProperty(mixerState.activeInput, "blendMode", mode)}
                disabled={!hasActiveShader}
              >
                {mode}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="effects" className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Select value={newEffect} onValueChange={setNewEffect} disabled={!hasActiveShader}>
              <SelectTrigger className="flex-1 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select effect" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {availableEffects
                  .filter((effect) => !activeInput.effects.includes(effect))
                  .map((effect) => (
                    <SelectItem key={effect} value={effect} className="capitalize">
                      {effect.replace("-", " ")}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="bg-purple-900 hover:bg-purple-800 border-purple-700"
              onClick={() => {
                if (newEffect) {
                  addEffect(mixerState.activeInput, newEffect)
                  setNewEffect("")
                }
              }}
              disabled={!newEffect || !hasActiveShader}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {activeInput.effects.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No effects applied</p>
            )}

            {activeInput.effects.map((effect) => (
              <div key={effect} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                <span className="capitalize text-sm">{effect.replace("-", " ")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => removeEffect(mixerState.activeInput, effect)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timing" className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Speed</label>
              <div className="flex items-center gap-2">
                <Slider
                  className="flex-1"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={[1.0]}
                  onValueChange={() => {}}
                  disabled={!hasActiveShader}
                />
                <span className="text-sm w-10">1.0x</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Time Offset</label>
              <div className="flex items-center gap-2">
                <Slider
                  className="flex-1"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[0]}
                  onValueChange={() => {}}
                  disabled={!hasActiveShader}
                />
                <span className="text-sm w-10">0.0s</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Loop Duration</label>
            <div className="flex items-center gap-2">
              <Slider
                className="flex-1"
                min={1}
                max={60}
                step={1}
                value={[10]}
                onValueChange={() => {}}
                disabled={!hasActiveShader}
              />
              <span className="text-sm w-10">10s</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="params" className="p-4 space-y-4">
          <p className="text-sm text-gray-400 mb-2">Shader-specific parameters</p>

          {!hasActiveShader ? (
            <p className="text-sm text-gray-500 text-center py-4">No shader selected</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Parameter 1</label>
                <div className="flex items-center gap-2">
                  <Slider className="flex-1" min={0} max={1} step={0.01} value={[0.5]} onValueChange={() => {}} />
                  <span className="text-sm w-10">0.50</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Parameter 2</label>
                <div className="flex items-center gap-2">
                  <Slider className="flex-1" min={0} max={1} step={0.01} value={[0.3]} onValueChange={() => {}} />
                  <span className="text-sm w-10">0.30</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Parameter 3</label>
                <div className="flex items-center gap-2">
                  <Slider className="flex-1" min={0} max={1} step={0.01} value={[0.7]} onValueChange={() => {}} />
                  <span className="text-sm w-10">0.70</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

