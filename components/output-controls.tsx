"use client"

import { useShaderMixer } from "./shader-mixer-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Settings, Clock, Film } from "lucide-react"
import OutputPreview from "./output-preview"

export default function OutputControls() {
  const { mixerState, updateMixerProperty } = useShaderMixer()

  return (
    <div className="space-y-4">
      <OutputPreview />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <Settings className="h-4 w-4 mr-1" />
            Output Settings
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Format</label>
            <Select
              value={mixerState.outputFormat}
              onValueChange={(value) => updateMixerProperty("outputFormat", value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                <Film className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                <SelectItem value="webm">WebM (VP9)</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="mov">QuickTime (ProRes)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Quality</label>
            <Select
              value={mixerState.outputQuality}
              onValueChange={(value) => updateMixerProperty("outputQuality", value)}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="low">Low (720p)</SelectItem>
                <SelectItem value="medium">Medium (1080p)</SelectItem>
                <SelectItem value="high">High (1440p)</SelectItem>
                <SelectItem value="ultra">Ultra (4K)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Frame Rate (FPS)
          </label>
          <div className="flex items-center gap-2">
            <Slider
              className="flex-1"
              min={15}
              max={60}
              step={1}
              value={[mixerState.outputFps]}
              onValueChange={(value) => updateMixerProperty("outputFps", value[0])}
            />
            <span className="text-sm w-10">{mixerState.outputFps} fps</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Output Filename</label>
          <div className="flex gap-2">
            <Input placeholder="shader_mix_output" className="flex-1 bg-gray-800 border-gray-700" />
          </div>
        </div>
      </div>
    </div>
  )
}

