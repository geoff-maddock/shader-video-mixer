"use client"

import { useEffect, useRef, useState } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Button } from "@/components/ui/button"
import { RepeatIcon as Record, StopCircle, Download } from "lucide-react"

export default function OutputPreview() {
  const { mixerState, shaders } = useShaderMixer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingStartTimeRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationRef = useRef<number>(0)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)

  // Set up canvas and animation loop
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set initial canvas size
    canvas.width = 1280
    canvas.height = 720

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get all visible input canvases
      const inputCanvases = document.querySelectorAll("[data-input-index]")

      if (inputCanvases.length === 0) {
        // Draw placeholder
        ctx.fillStyle = "#1f2937"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#9333ea"
        ctx.font = "16px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Add shaders to inputs to see preview", canvas.width / 2, canvas.height / 2)
      } else {
        // Reset composite operation
        ctx.globalCompositeOperation = "source-over"

        // Mix shaders based on mix mode
        switch (mixerState.mixMode) {
          case "quad":
            // Draw 4 inputs in a grid
            inputCanvases.forEach((inputElement) => {
              const inputIndex = Number.parseInt(inputElement.getAttribute("data-input-index") || "0")
              const inputCanvas = inputElement.querySelector("canvas")
              if (!inputCanvas || inputCanvas.width <= 0 || inputCanvas.height <= 0) return

              // Calculate position based on index
              const x = (inputIndex % 2) * (canvas.width / 2)
              const y = Math.floor(inputIndex / 2) * (canvas.height / 2)
              const width = canvas.width / 2
              const height = canvas.height / 2

              // Draw with opacity
              ctx.globalAlpha = mixerState.inputs[inputIndex].opacity
              ctx.drawImage(inputCanvas, x, y, width, height)
            })
            break

          case "stack":
            // First draw the bottom layer with normal blending
            const firstInput = inputCanvases[0]
            if (firstInput) {
              const inputCanvas = firstInput.querySelector("canvas")
              if (inputCanvas && inputCanvas.width > 0 && inputCanvas.height > 0) {
                ctx.globalAlpha = mixerState.inputs[0].opacity
                ctx.drawImage(inputCanvas, 0, 0, canvas.width, canvas.height)
              }
            }

            // Then stack other inputs with their blend modes
            for (let i = 1; i < inputCanvases.length; i++) {
              const inputElement = inputCanvases[i]
              const inputIndex = Number.parseInt(inputElement.getAttribute("data-input-index") || "0")
              const inputCanvas = inputElement.querySelector("canvas")
              if (!inputCanvas || inputCanvas.width <= 0 || inputCanvas.height <= 0) {
                console.warn(`Skipping input ${inputIndex} - canvas not ready`)
                continue
              }

              // Set blend mode
              ctx.globalCompositeOperation = getCompositeOperation(mixerState.inputs[inputIndex].blendMode)

              // Draw with opacity
              ctx.globalAlpha = mixerState.inputs[inputIndex].opacity
              if (inputCanvas && inputCanvas.width > 0 && inputCanvas.height > 0) {
                ctx.drawImage(inputCanvas, 0, 0, canvas.width, canvas.height)
              } else {
                console.warn(`Skipping input ${inputIndex} - canvas not ready`)
              }
            }
            break

          case "split":
            // Split screen between first two inputs
            for (let i = 0; i < 2; i++) {
              const inputElement = inputCanvases[i]
              if (!inputElement) continue

              const inputCanvas = inputElement.querySelector("canvas")
              if (!inputCanvas || inputCanvas.width <= 0 || inputCanvas.height <= 0) continue

              // Calculate position based on index
              const x = i * (canvas.width / 2)
              const width = canvas.width / 2

              // Draw with opacity
              ctx.globalAlpha = mixerState.inputs[i].opacity
              ctx.drawImage(inputCanvas, x, 0, width, canvas.height)
            }
            break

          case "single":
            // Show only active input
            const activeInput = document.querySelector(`[data-input-index="${mixerState.activeInput}"]`)
            if (activeInput) {
              const inputCanvas = activeInput.querySelector("canvas")
              if (inputCanvas && inputCanvas.width > 0 && inputCanvas.height > 0) {
                ctx.globalAlpha = mixerState.inputs[mixerState.activeInput].opacity
                ctx.drawImage(inputCanvas, 0, 0, canvas.width, canvas.height)
              } else {
                // Draw a placeholder if canvas isn't ready
                ctx.fillStyle = "#1f2937"
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = "#9333ea"
                ctx.font = "16px sans-serif"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(`Input ${mixerState.activeInput + 1} is loading...`, canvas.width / 2, canvas.height / 2)
              }
            }
            break
        }
      }

      // Reset composite operation and alpha
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1.0

      // Update recording time if recording
      if (isRecording) {
        const currentTime = Date.now()
        const elapsed = (currentTime - recordingStartTimeRef.current) / 1000
        setRecordingTime(elapsed)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [mixerState, isRecording])

  // Helper function to convert blend mode to canvas composite operation
  const getCompositeOperation = (blendMode: string): GlobalCompositeOperation => {
    switch (blendMode) {
      case "normal":
        return "source-over"
      case "multiply":
        return "multiply"
      case "screen":
        return "screen"
      case "overlay":
        return "overlay"
      case "darken":
        return "darken"
      case "lighten":
        return "lighten"
      case "color-dodge":
        return "color-dodge"
      case "color-burn":
        return "color-burn"
      case "hard-light":
        return "hard-light"
      case "soft-light":
        return "soft-light"
      case "difference":
        return "difference"
      case "exclusion":
        return "exclusion"
      default:
        return "source-over"
    }
  }

  // Start recording
  const startRecording = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const stream = canvas.captureStream(mixerState.outputFps)

    // Create media recorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: getVideoBitrate(mixerState.outputQuality),
    })

    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      setRecordedVideoUrl(url)
    }

    // Start recording
    recordingStartTimeRef.current = Date.now()
    mediaRecorder.start(100) // Collect data every 100ms
    setIsRecording(true)
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  // Download recorded video
  const downloadVideo = () => {
    if (!recordedVideoUrl) return

    const a = document.createElement("a")
    a.href = recordedVideoUrl
    a.download = `shader-mix-${new Date().toISOString()}.webm`
    a.click()
  }

  // Helper function to get bitrate based on quality
  const getVideoBitrate = (quality: string): number => {
    switch (quality) {
      case "low":
        return 1000000 // 1 Mbps
      case "medium":
        return 2500000 // 2.5 Mbps
      case "high":
        return 5000000 // 5 Mbps
      case "ultra":
        return 8000000 // 8 Mbps
      default:
        return 2500000
    }
  }

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gray-800 rounded-md border border-gray-700 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" width={1280} height={720} />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button variant="destructive" size="sm" onClick={stopRecording}>
              <StopCircle className="h-4 w-4 mr-1" />
              Stop Recording
            </Button>
          ) : (
            <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700" onClick={startRecording}>
              <Record className="h-4 w-4 mr-1" />
              Start Recording
            </Button>
          )}

          {recordedVideoUrl && (
            <Button variant="outline" size="sm" onClick={downloadVideo}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

