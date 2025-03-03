"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface ShaderDebugPanelProps {
  debugInfo?: {
    fps: number
    frameTime: number
    uniformValues: Record<string, any>
  }
  errors?: string[]
  isCompiled: boolean
}

export default function ShaderDebugPanel({ debugInfo, errors = [], isCompiled }: ShaderDebugPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [fpsHistory, setFpsHistory] = useState<number[]>([])

  useEffect(() => {
    if (debugInfo?.fps) {
      setFpsHistory((prev) => [...prev.slice(-50), debugInfo.fps])
    }
  }, [debugInfo?.fps])

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-gray-900 border-gray-800 text-white shadow-xl">
      <div
        className="p-3 border-b border-gray-800 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Shader Debug</h3>
          {isCompiled ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compiled
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gray-800">
            {debugInfo?.fps.toFixed(1) || 0} FPS
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-4">
          {/* Performance Metrics */}
          <div>
            <Label className="text-xs text-gray-400">Performance</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">Frame Time</div>
                <div className="text-sm font-mono">{debugInfo?.frameTime.toFixed(2) || 0} ms</div>
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">FPS</div>
                <div className="text-sm font-mono">{debugInfo?.fps.toFixed(1) || 0}</div>
              </div>
            </div>
          </div>

          {/* FPS Graph */}
          <div>
            <Label className="text-xs text-gray-400">FPS History</Label>
            <div className="h-20 mt-1 bg-gray-800 rounded-md p-2">
              <div className="relative w-full h-full">
                {fpsHistory.map((fps, i) => {
                  const height = Math.min((fps / 60) * 100, 100)
                  return (
                    <div
                      key={i}
                      className="absolute bottom-0 bg-purple-500"
                      style={{
                        left: `${(i / 50) * 100}%`,
                        width: "2px",
                        height: `${height}%`,
                        opacity: i / 50,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Uniforms */}
          <div>
            <Label className="text-xs text-gray-400">Uniforms</Label>
            <ScrollArea className="h-32 mt-1">
              <div className="space-y-1">
                {Object.entries(debugInfo?.uniformValues || {}).map(([name, value]) => (
                  <div key={name} className="bg-gray-800 p-2 rounded-md">
                    <div className="text-xs font-mono text-purple-400">{name}</div>
                    <div className="text-xs font-mono truncate">
                      {Array.isArray(value) ? `[${value.join(", ")}]` : value.toString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div>
              <Label className="text-xs text-gray-400">Errors</Label>
              <ScrollArea className="h-32 mt-1">
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="bg-red-900/30 border border-red-900/50 p-2 rounded-md">
                      <div className="text-xs font-mono text-red-400">{error}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

