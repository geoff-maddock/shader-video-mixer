// components/shader-thumbnail-generator.tsx
"use client"

import { useEffect, useRef } from "react"
import { ShaderProgram } from "@/utils/webgl"
import { wrapShaderToyCode } from "@/lib/shader-utils"

interface ShaderThumbnailGeneratorProps {
    code: string
    onThumbnailGenerated: (dataUrl: string) => void
    width?: number
    height?: number
}

export default function ShaderThumbnailGenerator({
    code,
    onThumbnailGenerated,
    width = 200,
    height = 112, // 16:9 aspect ratio
}: ShaderThumbnailGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true })
        if (!gl) return

        try {
            // Use the shader code to create a shader program
            const shaderProgram = new ShaderProgram(gl, code)

            // Set uniforms for a static snapshot
            const resolution = [width, height]
            const time = Math.random() * 10 // Random time for visual variety
            const mouse = [0, 0, 0, 0]
            const frame = 0

            // Render the shader
            shaderProgram.render({ resolution, time, frame, mouse })

            // Capture the rendered image
            const dataUrl = canvas.toDataURL("image/png")
            onThumbnailGenerated(dataUrl)

            // Clean up
            shaderProgram.dispose()
        } catch (error) {
            console.error("Failed to generate thumbnail:", error)
        }
    }, [code, width, height, onThumbnailGenerated])

    return <canvas ref={canvasRef} width={width} height={height} className="hidden" />
}