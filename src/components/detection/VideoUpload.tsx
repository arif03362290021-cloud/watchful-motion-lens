import { useCallback, useRef, useState } from "react";
import { Download, Pause, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { detectFrame, drawTracks, loadModel, type ModelId } from "@/lib/detector";
import { IouTracker } from "@/lib/tracker";
import { StatsPanel } from "./StatsPanel";

/**
 * Uploaded-video detection. Each frame is composited (video + boxes) onto a
 * canvas, which is recorded with MediaRecorder so the annotated result can be
 * downloaded as a WebM file.
 */
export function VideoUpload({ model }: { model: ModelId }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef(new IouTracker());
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [hasVideo, setHasVideo] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fps, setFps] = useState(0);
  const [live, setLive] = useState(0);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Array<{ label: string; count: number }>>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const onFile = useCallback((file: File) => {
    const video = videoRef.current!;
    video.src = URL.createObjectURL(file);
    video.load();
    trackerRef.current.reset();
    setCounts([]);
    setTotal(0);
    setDownloadUrl(null);
    setHasVideo(true);
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setProcessing(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    videoRef.current?.pause();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    try {
      setLoading(true);
      const net = await loadModel(model);
      setLoading(false);

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d")!;

      // Record the annotated canvas so the user can download the result.
      chunksRef.current = [];
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setDownloadUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      recorderRef.current = recorder;

      await video.play();
      runningRef.current = true;
      setProcessing(true);

      let last = performance.now();
      const loop = async () => {
        if (!runningRef.current) return;
        if (video.ended) {
          stop();
          toast.success("Processing finished — video ready to download");
          return;
        }
        // Draw the current frame, then overlay tracked boxes on top.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dets = await detectFrame(net, video, 0.5);
        const tracks = trackerRef.current.update(dets);
        drawTracks(ctx, tracks, canvas.width / video.videoWidth, canvas.height / video.videoHeight);

        const now = performance.now();
        setFps(1000 / Math.max(1, now - last));
        last = now;
        setLive(tracks.length);
        setTotal(trackerRef.current.total);
        setCounts(trackerRef.current.counts);

        rafRef.current = requestAnimationFrame(() => void loop());
      };
      void loop();
    } catch (err) {
      setLoading(false);
      console.error(err);
      toast.error("Could not process this video", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }, [model, stop]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="surface-panel glow relative aspect-video overflow-hidden">
          {/* Source video stays hidden while processing: the canvas shows frame + boxes. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 size-full object-contain"
            style={{ opacity: processing ? 0 : 1 }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 size-full object-contain"
            style={{ opacity: processing ? 1 : 0 }}
          />
          {!hasVideo ? (
            <div className="absolute inset-0 grid place-content-center gap-2 text-center">
              <Upload className="mx-auto size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload an MP4, WebM or MOV file</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="size-4" /> Upload Video
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                }}
              />
            </label>
          </Button>

          {processing ? (
            <Button variant="destructive" onClick={stop}>
              <Pause className="size-4" /> Stop
            </Button>
          ) : (
            <Button onClick={() => void start()} disabled={!hasVideo || loading}>
              <Play className="size-4" /> {loading ? "Loading model…" : "Detect & Track"}
            </Button>
          )}

          {downloadUrl ? (
            <Button variant="secondary" asChild>
              <a href={downloadUrl} download="processed-detection.webm">
                <Download className="size-4" /> Download Processed Video
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <StatsPanel
        fps={fps}
        total={total}
        live={live}
        counts={counts}
        loading={loading}
        status={processing ? "Processing frames…" : hasVideo ? "Video ready" : "No video loaded"}
      />
    </div>
  );
}