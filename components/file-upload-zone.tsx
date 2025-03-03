"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Button } from "@/components/ui/button"
import { Upload, FileCode, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const DEFAULT_SHADER_CODE = `// Simple gradient shader
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col,1.0);
}`

export default function FileUploadZone() {
  const { addCustomShader, setShaderToInput, mixerState } = useShaderMixer()
  const [isDragging, setIsDragging] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState({ title: "", message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showSuccessMessage = (shaderName: string) => {
    setDialogMessage({
      title: "Shader Loaded Successfully",
      message: `"${shaderName}" has been added to Input ${mixerState.activeInput + 1}.`,
    })
    setShowDialog(true)
  }

  const showErrorMessage = (title: string, message: string) => {
    setDialogMessage({ title, message })
    setShowDialog(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    } else {
      // Check if it's a URL from ShaderToy
      const text = e.dataTransfer.getData("text")
      if (text && text.includes("shadertoy.com")) {
        handleShaderToyUrl(text)
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith(".glsl") || fileName.endsWith(".frag") || fileName.endsWith(".shadertoy")) {
      try {
        const code = await file.text()
        const shaderId = addCustomShader({
          name: file.name.replace(/\.[^/.]+$/, ""),
          code,
          category: "custom",
          description: "Imported shader file",
        })
        setShaderToInput(shaderId, mixerState.activeInput)
        showSuccessMessage(file.name)
      } catch (error) {
        showErrorMessage("Invalid shader file", "The file could not be parsed as a valid shader.")
      }
    } else if (fileName.endsWith(".json")) {
      try {
        const content = await file.text()
        const json = JSON.parse(content)
        if (json.info && json.renderpass) {
          const shaderId = addCustomShader({
            name: json.info.name || file.name.replace(/\.[^/.]+$/, ""),
            code: json.renderpass[0].code,
            category: "shadertoy",
            description: json.info.description || "Imported ShaderToy shader",
          })
          setShaderToInput(shaderId, mixerState.activeInput)
          showSuccessMessage(json.info.name || file.name)
        } else {
          showErrorMessage("Invalid JSON format", "The JSON file does not appear to be a valid ShaderToy export.")
        }
      } catch (error) {
        showErrorMessage("Invalid JSON", "The file could not be parsed as valid JSON.")
      }
    } else {
      showErrorMessage(
        "Unsupported file format",
        "Please upload .glsl, .frag, .shadertoy, or ShaderToy JSON export files.",
      )
    }
  }

  const handleShaderToyUrl = async (url: string) => {
    const match = url.match(/view\/([a-zA-Z0-9]+)/)
    if (match && match[1]) {
      const shaderId = match[1]
      try {
        // In a real app, we would fetch the shader from ShaderToy's API
        // For this demo, we'll create a placeholder shader
        const newShaderId = addCustomShader({
          name: `ShaderToy: ${shaderId}`,
          code: DEFAULT_SHADER_CODE,
          category: "shadertoy",
          description: "Imported from ShaderToy",
        })
        setShaderToInput(newShaderId, mixerState.activeInput)
        showSuccessMessage(`ShaderToy: ${shaderId}`)
      } catch (error) {
        showErrorMessage("Error loading shader", "Could not load the shader from ShaderToy.")
      }
    } else {
      showErrorMessage("Invalid ShaderToy URL", "Could not extract shader ID from the URL.")
    }
  }

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? "border-purple-500 bg-purple-500/10" : "border-gray-700 hover:border-gray-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".glsl,.frag,.shadertoy,.json"
          onChange={handleFileInputChange}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-gray-800 rounded-full">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium">Upload Shader</h3>
          <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">.glsl</span>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">.frag</span>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">.shadertoy</span>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">ShaderToy URL</span>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMessage.title.includes("Error") || dialogMessage.title.includes("Invalid") ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <FileCode className="h-5 w-5 text-green-500" />
              )}
              {dialogMessage.title}
            </DialogTitle>
            <DialogDescription>{dialogMessage.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

