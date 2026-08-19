/**
 * Simple IOU (Intersection over Union) tracker.
 * Assigns a stable, unique ID to each detected object across frames by
 * matching new detections to existing tracks with the highest box overlap.
 * This is the lightweight, browser-friendly alternative to Deep SORT.
 */

export interface Detection {
  /** [x, y, width, height] in pixels of the source video */
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export interface Track extends Detection {
  id: number;
  /** frames since this track was last matched to a detection */
  age: number;
}

/** Intersection over union of two [x,y,w,h] boxes. */
function iou(a: [number, number, number, number], b: [number, number, number, number]) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const x1 = Math.max(ax, bx);
  const y1 = Math.max(ay, by);
  const x2 = Math.min(ax + aw, bx + bw);
  const y2 = Math.min(ay + ah, by + bh);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = aw * ah + bw * bh - inter;
  return union <= 0 ? 0 : inter / union;
}

export class IouTracker {
  private tracks: Track[] = [];
  private nextId = 1;
  /** total unique objects ever seen (used for the "total detected" stat) */
  private totalSeen = 0;
  /** running count per class label, keyed by class name */
  private classCounts = new Map<string, number>();

  constructor(
    private iouThreshold = 0.3,
    /** how many frames a track survives without a match */
    private maxAge = 12,
  ) {}

  /** Feed the detections of a single frame, get back tracked objects. */
  update(detections: Detection[]): Track[] {
    const unmatched = new Set(detections.map((_, i) => i));

    // 1. Try to extend existing tracks with the best-overlapping detection.
    for (const track of this.tracks) {
      let bestIdx = -1;
      let bestIou = this.iouThreshold;
      for (const i of unmatched) {
        const det = detections[i]!;
        if (det.class !== track.class) continue;
        const score = iou(track.bbox, det.bbox);
        if (score > bestIou) {
          bestIou = score;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const det = detections[bestIdx]!;
        track.bbox = det.bbox;
        track.score = det.score;
        track.age = 0;
        unmatched.delete(bestIdx);
      } else {
        track.age += 1;
      }
    }

    // 2. Spawn new tracks for detections nothing matched.
    for (const i of unmatched) {
      const det = detections[i]!;
      this.tracks.push({ ...det, id: this.nextId++, age: 0 });
      this.totalSeen += 1;
      this.classCounts.set(det.class, (this.classCounts.get(det.class) ?? 0) + 1);
    }

    // 3. Drop stale tracks.
    this.tracks = this.tracks.filter((t) => t.age <= this.maxAge);

    return this.tracks.filter((t) => t.age === 0);
  }

  get total() {
    return this.totalSeen;
  }

  /** Cumulative unique-object count per class, sorted descending. */
  get counts(): Array<{ label: string; count: number }> {
    return [...this.classCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  reset() {
    this.tracks = [];
    this.nextId = 1;
    this.totalSeen = 0;
    this.classCounts.clear();
  }
}