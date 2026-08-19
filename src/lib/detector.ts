/**
 * Browser-only detection engine wrapper.
 * TensorFlow.js is imported dynamically so it never runs during SSR.
 */
import type { Detection } from "./tracker";

export type ModelId = "lite_mobilenet_v2" | "mobilenet_v2";

export const MODEL_OPTIONS: Array<{ id: ModelId; label: string; hint: string }> = [
  { id: "lite_mobilenet_v2", label: "COCO-SSD Lite", hint: "Fastest — best for live webcam" },
  { id: "mobilenet_v2", label: "COCO-SSD MobileNet v2", hint: "More accurate — heavier" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CocoModel = { detect: (input: HTMLVideoElement | HTMLCanvasElement, max?: number) => Promise<any[]> };

const cache = new Map<ModelId, Promise<CocoModel>>();

/** Load (and memoise) a COCO-SSD model with the requested backbone. */
export function loadModel(base: ModelId): Promise<CocoModel> {
  const cached = cache.get(base);
  if (cached) return cached;
  const promise = (async () => {
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    return (await cocoSsd.load({ base })) as unknown as CocoModel;
  })();
  cache.set(base, promise);
  return promise;
}

/** Run one detection pass and normalise the output shape. */
export async function detectFrame(
  model: CocoModel,
  source: HTMLVideoElement | HTMLCanvasElement,
  minScore: number,
): Promise<Detection[]> {
  const raw = await model.detect(source, 20);
  return raw
    .filter((d) => d.score >= minScore)
    .map((d) => ({
      bbox: d.bbox as [number, number, number, number],
      class: d.class as string,
      score: d.score as number,
    }));
}

/** Deterministic colour per tracking ID so boxes stay visually stable. */
export function colorForId(id: number) {
  const hue = (id * 47) % 360;
  return `hsl(${hue} 90% 60%)`;
}

/** Draw tracked boxes, labels, confidence and IDs onto the overlay canvas. */
export function drawTracks(
  ctx: CanvasRenderingContext2D,
  tracks: Array<Detection & { id: number }>,
  scaleX = 1,
  scaleY = 1,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 3;
  ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "top";

  for (const t of tracks) {
    const [x, y, w, h] = [t.bbox[0] * scaleX, t.bbox[1] * scaleY, t.bbox[2] * scaleX, t.bbox[3] * scaleY];
    const color = colorForId(t.id);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, w, h);

    const label = `#${t.id} ${t.class} ${(t.score * 100).toFixed(0)}%`;
    const textWidth = ctx.measureText(label).width;
    const boxY = Math.max(0, y - 22);
    ctx.fillStyle = color;
    ctx.fillRect(x - 1.5, boxY, textWidth + 12, 22);
    ctx.fillStyle = "#0b0fial".slice(0, 7);
    ctx.fillStyle = "#080b12";
    ctx.fillText(label, x + 4.5, boxY + 4);
  }
}