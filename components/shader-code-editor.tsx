"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useShaderMixer } from "./shader-mixer-context"
import { FileCode, Copy, Check } from "lucide-react"
import { DEFAULT_SHADER_CODE } from "@/lib/constants"

export default function ShaderCodeEditor() {
  const { addCustomShader, setShaderToInput, mixerState } = useShaderMixer()
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState(DEFAULT_SHADER_CODE)
  const [name, setName] = useState("My Custom Shader")
  const [copied, setCopied] = useState(false)

  const handleSubmit = () => {
    const shaderId = addCustomShader({
      name,
      code,
      category: "custom",
      description: "Custom GLSL shader code",
    })
    setShaderToInput(shaderId, mixerState.activeInput)
    setIsOpen(false)
    // Reset form
    setCode(DEFAULT_SHADER_CODE)
    setName("My Custom Shader")
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
        onClick={() => setIsOpen(true)}
      >
        <FileCode className="w-4 h-4 mr-2" />
        Paste Shader Code
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create Custom Shader</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shader Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="code">GLSL Code</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-gray-400 hover:text-white"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="relative">
                <textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-[300px] font-mono text-sm bg-gray-800 border-gray-700 rounded-md p-4"
                  spellCheck="false"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
              Add to Input {mixerState.activeInput + 1}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

