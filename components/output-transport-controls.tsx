"use client"

import { useShaderMixer } from "./shader-mixer-context"
import { Button } from "@/components/ui/button"
import {
    Eye, EyeOff, Layers, Maximize2, ArrowRight, Play, Pause,
    Square, CircleDot, Disc, Grid2X2, Grid, SlidersHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OutputTransportControls() {
    const {
        mixerState,
        updateInputProperty,
        updateMixerProperty,
        setActiveInput,
        togglePlayback,
        toggleRecording
    } = useShaderMixer()

    // Toggle input visibility (on/off)
    const toggleInputVisibility = (inputIndex: number) => {
        const currentOpacity = mixerState.inputs[inputIndex].opacity
        updateInputProperty(inputIndex, "opacity", currentOpacity > 0 ? 0 : 1)
    }

    // Switch to single input
    const switchToInput = (inputIndex: number) => {
        // First ensure the input is visible (opacity > 0)
        if (mixerState.inputs[inputIndex].opacity === 0) {
            updateInputProperty(inputIndex, "opacity", 1)
        }

        // Then set it as active and switch to single display mode
        setActiveInput(inputIndex)
        updateMixerProperty("mixMode", "single")
    }

    // Enable blending/stacking mode for all inputs with content
    const enableBlending = () => {
        // Make sure at least the active input is visible
        if (mixerState.activeInput >= 0 && mixerState.inputs[mixerState.activeInput].opacity === 0) {
            updateInputProperty(mixerState.activeInput, "opacity", 1)
        }
        updateMixerProperty("mixMode", "stack")
    }

    // Enable quad view (2x2 grid)
    const enableQuadView = () => {
        updateMixerProperty("mixMode", "quad")
    }

    // Enable split view
    const enableSplitView = () => {
        updateMixerProperty("mixMode", "split")
    }

    // Check if an input is valid and has content
    const isValidInput = (index: number) => {
        return mixerState.inputs[index] &&
            mixerState.inputs[index].shaderId
    }

    // Get shader name for the input
    const getInputName = (inputIndex: number) => {
        const input = mixerState.inputs[inputIndex]
        return input.shaderId ? `Input ${inputIndex + 1}` : `Empty ${inputIndex + 1}`
    }

    return (
        <div className="space-y-3 border border-gray-800 rounded-md p-3 bg-gray-900">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center">
                    <Layers className="h-4 w-4 mr-1" />
                    Transport Controls
                </h3>
            </div>

            {/* View Mode Selection */}
            <div className="flex gap-2 mb-3">
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "bg-gray-800 border-gray-700 flex-1",
                        mixerState.mixMode === "stack" && "bg-purple-900 border-purple-700"
                    )}
                    onClick={enableBlending}
                    title="Blend all visible inputs"
                >
                    <Layers className="h-4 w-4 mr-1" />
                    Blend
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "bg-gray-800 border-gray-700 flex-1",
                        mixerState.mixMode === "quad" && "bg-purple-900 border-purple-700"
                    )}
                    onClick={enableQuadView}
                    title="Show 4 inputs in a grid"
                >
                    <Grid2X2 className="h-4 w-4 mr-1" />
                    Quad
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "bg-gray-800 border-gray-700 flex-1",
                        mixerState.mixMode === "split" && "bg-purple-900 border-purple-700"
                    )}
                    onClick={enableSplitView}
                    title="Split screen view"
                >
                    <Grid className="h-4 w-4 mr-1" />
                    Split
                </Button>
            </div>

            {/* Transition Controls */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Transition:</span>
                    <Select
                        value={mixerState.transitionType || "cut"}
                        onValueChange={(value) => updateMixerProperty("transitionType", value)}
                    >
                        <SelectTrigger className="h-7 text-xs bg-gray-800 border-gray-700 flex-1">
                            <SelectValue placeholder="Transition Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="cut">Cut</SelectItem>
                            <SelectItem value="dissolve">Dissolve</SelectItem>
                            <SelectItem value="wipe">Wipe</SelectItem>
                            <SelectItem value="slide">Slide</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Input Controls */}
            <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-1">Input Controls:</div>
                {mixerState.inputs.map((input, index) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">{getInputName(index)}</span>

                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "bg-gray-800 border-gray-700 h-7 px-2",
                                    input.opacity > 0 && "bg-purple-900 border-purple-700"
                                )}
                                onClick={() => toggleInputVisibility(index)}
                                title={input.opacity > 0 ? "Hide input" : "Show input"}
                                disabled={!isValidInput(index)}
                            >
                                {input.opacity > 0 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "bg-gray-800 border-gray-700 h-7 px-2",
                                    mixerState.mixMode === "single" && mixerState.activeInput === index && "bg-purple-900 border-purple-700"
                                )}
                                onClick={() => switchToInput(index)}
                                title="Switch to this input"
                                disabled={!isValidInput(index)}
                            >
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Playback and Recording Controls */}
            <div className="pt-2 border-t border-gray-800 flex justify-between">
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "bg-gray-800 border-gray-700 h-8",
                            mixerState.isPlaying && "bg-green-900 border-green-700"
                        )}
                        onClick={togglePlayback}
                    >
                        {mixerState.isPlaying ? (
                            <Pause className="h-4 w-4 mr-1" />
                        ) : (
                            <Play className="h-4 w-4 mr-1" />
                        )}
                        {mixerState.isPlaying ? "Pause" : "Play"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 h-8"
                    >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                    </Button>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "bg-gray-800 border-gray-700 h-8",
                        mixerState.isRecording && "bg-red-900 border-red-700 text-red-400"
                    )}
                    onClick={toggleRecording}
                >
                    {mixerState.isRecording ? (
                        <>
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                        </>
                    ) : (
                        <>
                            <CircleDot className="h-4 w-4 mr-1" />
                            Record
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}