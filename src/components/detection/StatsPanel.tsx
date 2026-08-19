import { Activity, Gauge, Layers, Loader2 } from "lucide-react";

export interface StatsPanelProps {
  fps: number;
  total: number;
  live: number;
  counts: Array<{ label: string; count: number }>;
  loading?: boolean;
  status?: string;
}

/** Sidebar with FPS, totals and a per-class breakdown of detected objects. */
export function StatsPanel({ fps, total, live, counts, loading, status }: StatsPanelProps) {
  return (
    <aside className="surface-panel flex h-full flex-col gap-5 p-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Gauge className="size-4" />} label="FPS" value={fps.toFixed(1)} />
        <Stat icon={<Layers className="size-4" />} label="Total" value={String(total)} />
        <Stat icon={<Activity className="size-4" />} label="Live" value={String(live)} />
      </div>

      <div className="flex-1">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Detected objects
        </h3>
        {counts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading detection model…" : "Nothing detected yet. Start a source to begin."}
          </p>
        ) : (
          <ul className="space-y-2">
            {counts.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-sm"
              >
                <span className="capitalize">{c.label}</span>
                <span className="font-mono text-primary">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {loading ? <Loader2 className="size-3 animate-spin" /> : null}
          {status}
        </p>
      ) : null}
    </aside>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 font-mono text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}