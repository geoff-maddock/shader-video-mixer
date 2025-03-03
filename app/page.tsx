import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ShaderLibrary from "@/components/shader-library"
import MixerInterface from "@/components/mixer-interface"
import OutputControls from "@/components/output-controls"
import MixingTools from "@/components/mixing-tools"
import FileUploadZone from "@/components/file-upload-zone"
import { ShaderMixerProvider } from "@/components/shader-mixer-context"
import ShaderCodeEditor from "@/components/shader-code-editor"

export default function Home() {
  return (
    <ShaderMixerProvider>
      <main className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-purple-400">ShaderToy Video Mixer</h1>
            <div className="flex items-center gap-4">
              <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium">
                New Project
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                Load Project
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium">
                Settings
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <MixerInterface />
            <MixingTools />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Tabs defaultValue="library" className="w-full">
              <TabsList className="w-full bg-gray-900">
                <TabsTrigger value="library" className="flex-1">
                  Shader Library
                </TabsTrigger>
                <TabsTrigger value="output" className="flex-1">
                  Output
                </TabsTrigger>
              </TabsList>
              <TabsContent value="library" className="bg-gray-900 rounded-b-md p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <FileUploadZone />
                    <ShaderCodeEditor />
                  </div>
                  <ShaderLibrary />
                </div>
              </TabsContent>
              <TabsContent value="output" className="bg-gray-900 rounded-b-md p-4">
                <OutputControls />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </ShaderMixerProvider>
  )
}

