"use client"

import { useShaderMixer } from "./shader-mixer-context"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Layers, Maximize2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OutputTransportControls() {
    const { mixerState, updateInputProperty, updateMixerProperty, setActiveInput } = useShaderMixer()

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

        // Then set it as active
        setActiveInput(inputIndex)
        updateMixerProperty("mixMode", "single")
    }

    // Enable blending mode for all inputs with content
    const enableBlending = () => {
        // Make sure at least the active input is visible
        if (mixerState.activeInput >= 0 && mixerState.inputs[mixerState.activeInput].opacity === 0) {
            updateInputProperty(mixerState.activeInput, "opacity", 1)
        }
        updateMixerProperty("mixMode", "stack")
    }

    // Check if an input is valid and has content
    const isValidInput = (index: number) => {
        return mixerState.inputs[index] &&
            mixerState.inputs[index].shaderId &&
            mixerState.inputs[index].initialized !== false
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

            <div className="space-y-2">
                {mixerState.inputs.map((input, index) => (
                    isValidInput(index) && (
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
                                >
                                    {input.opacity > 0 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-gray-800 border-gray-700 h-7 px-2"
                                    onClick={() => switchToInput(index)}
                                    title="Switch to this input"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )
                ))}
            </div>

            <div className="pt-2 border-t border-gray-800">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "bg-gray-800 border-gray-700",
                            mixerState.mixMode === "stack" && "bg-purple-900 border-purple-700"
                        )}
                        onClick={enableBlending}
                    >
                        <Layers className="h-4 w-4 mr-1" />
                        Blend All
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "bg-gray-800 border-gray-700",
                            mixerState.mixMode === "single" && "bg-purple-900 border-purple-700"
                        )}
                        onClick={() => {
                            // Make sure active input is visible before switching to single mode
                            if (mixerState.activeInput >= 0) {
                                updateInputProperty(mixerState.activeInput, "opacity", 1)
                                updateMixerProperty("mixMode", "single")
                            }
                        }}
                    >
                        <Maximize2 className="h-4 w-4 mr-1" />
                        Solo
                    </Button>
                </div>
            </div>

            <div className="text-xs text-gray-500">
                Transitions: {mixerState.transitionType}, {mixerState.transitionDuration.toFixed(1)}s
            </div>
        </div>
    )
}