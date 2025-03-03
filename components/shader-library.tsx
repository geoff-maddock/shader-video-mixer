"use client"

import type React from "react"

import { useState } from "react"
import { useShaderMixer } from "./shader-mixer-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ShaderPreview from "./shader-preview"

export default function ShaderLibrary() {
  const { shaders, setShaderToInput, mixerState } = useShaderMixer()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [previewShaderId, setPreviewShaderId] = useState<string | null>(null)

  const categories = ["all", ...new Set(shaders.map((shader) => shader.category))]

  const filteredShaders = shaders.filter((shader) => {
    const matchesSearch =
      shader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shader.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || shader.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDragStart = (e: React.DragEvent, shaderId: string) => {
    e.dataTransfer.setData("shaderId", shaderId)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search shaders..."
            className="pl-8 bg-gray-800 border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredShaders.map((shader) => (
          <div
            key={shader.id}
            className="bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:border-purple-500 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, shader.id)}
          >
            <div className="relative aspect-video bg-gray-900 overflow-hidden">
              <img
                src={shader.thumbnail || "/placeholder.svg"}
                alt={shader.name}
                className="w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewShaderId(shader.id)
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-2">
              <h3 className="font-medium text-sm">{shader.name}</h3>
              <p className="text-xs text-gray-400 truncate">{shader.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full capitalize">{shader.category}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-purple-900 hover:text-purple-200"
                  onClick={() => setShaderToInput(shader.id, mixerState.activeInput)}
                >
                  Add to Input {mixerState.activeInput + 1}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!previewShaderId} onOpenChange={(open) => !open && setPreviewShaderId(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white">
              {previewShaderId && shaders.find((s) => s.id === previewShaderId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video">
            {previewShaderId && <ShaderPreview shaderId={previewShaderId} inputIndex={-1} />}
          </div>
          <div className="p-4 bg-gray-900">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                if (previewShaderId) {
                  setShaderToInput(previewShaderId, mixerState.activeInput)
                  setPreviewShaderId(null)
                }
              }}
            >
              Add to Input {mixerState.activeInput + 1}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

