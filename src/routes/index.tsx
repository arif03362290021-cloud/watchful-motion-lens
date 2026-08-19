import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScanEye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveCamera } from "@/components/detection/LiveCamera";
import { VideoUpload } from "@/components/detection/VideoUpload";
import { MODEL_OPTIONS, type ModelId } from "@/lib/detector";

const title = "Real-Time Object Detection & Tracking System";
const description =
  "Browser-based AI that detects and tracks objects from webcam or uploaded video with bounding boxes, confidence scores and unique tracking IDs.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Real-Time Object Detection & Tracking | In-Browser AI" },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [model, setModel] = useState<ModelId>("lite_mobilenet_v2");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              CodeAlpha AI Internship · Task 4
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-4xl">
              <ScanEye className="size-7 text-primary" />
              Object Detection &amp; Tracking
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              100% in-browser inference with TensorFlow.js COCO-SSD and an IOU tracker — no server,
              no Python. Your video never leaves this device.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
              <SelectTrigger className="w-[220px]">
                {/* Explicit label keeps the trigger readable on first paint */}
                <SelectValue placeholder="Detection model">
                  {MODEL_OPTIONS.find((m) => m.id === model)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex flex-col">
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.hint}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </header>

        <Tabs defaultValue="live">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="live" className="flex-1 sm:flex-none">
              Live Camera
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 sm:flex-none">
              Upload Video
            </TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="mt-6">
            <LiveCamera model={model} />
          </TabsContent>
          <TabsContent value="upload" className="mt-6">
            <VideoUpload model={model} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
