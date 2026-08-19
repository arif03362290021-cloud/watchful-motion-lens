import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { detectFrame, drawTracks, loadModel, type ModelId } from "@/lib/detector";
import { IouTracker } from "@/lib/tracker";
import { StatsPanel } from "./StatsPanel";

/** Live webcam detection + IOU tracking, all client side. */
export function LiveCamera({ model }: { model: ModelId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef(new IouTracker());
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(0);
  const [live, setLive] = useState(0);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Array<{ label: string; count: number }>>([]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }, []);

  // Always release the camera when leaving the tab/page.
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const net = await loadModel(model);
      trackerRef.current.reset();
      setTotal(0);
      setCounts([]);
      setLoading(false);
      runningRef.current = true;
      setRunning(true);

      let last = performance.now();
      const loop = async () => {
        if (!runningRef.current) return;
        const canvas = canvasRef.current!;
        if (video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const dets = await detectFrame(net, video, 0.5);
          const tracks = trackerRef.current.update(dets);
          const ctx = canvas.getContext("2d")!;
          drawTracks(ctx, tracks);

          const now = performance.now();
          setFps(1000 / Math.max(1, now - last));
          last = now;
          setLive(tracks.length);
          setTotal(trackerRef.current.total);
          setCounts(trackerRef.current.counts);
        }
        rafRef.current = requestAnimationFrame(() => void loop());
      };
      void loop();
    } catch (err) {
      setLoading(false);
      console.error(err);
      toast.error("Camera unavailable", {
        description: err instanceof Error ? err.message : "Please allow webcam access and retry.",
      });
    }
  }, [model]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="surface-panel glow relative aspect-video overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 size-full object-contain"
          />
          <canvas ref={canvasRef} className="absolute inset-0 size-full object-contain" />
          {!running && !loading ? (
            <div className="absolute inset-0 grid place-content-center gap-2 text-center">
              <Camera className="mx-auto size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Camera is off</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {running ? (
            <Button variant="destructive" onClick={stop}>
              <CameraOff className="size-4" /> Stop Camera
            </Button>
          ) : (
            <Button onClick={() => void start()} disabled={loading}>
              <Camera className="size-4" /> {loading ? "Loading model…" : "Start Camera"}
            </Button>
          )}
        </div>
      </div>
      <StatsPanel
        fps={fps}
        total={total}
        live={live}
        counts={counts}
        loading={loading}
        status={running ? "Detecting in real time" : "Idle"}
      />
    </div>
  );
}