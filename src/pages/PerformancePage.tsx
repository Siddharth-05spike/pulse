import {
  Activity,
  Gauge,
  HardDrive,
  Timer,
  Zap,
} from "lucide-react";

import MetricCard from "../components/metrics/MetricCard";
import { usePerformance } from "../hooks/usePerformance";
import { useTelemetry } from "../hooks/useTelemetry";
import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";
import { calculatePerformanceScore } from "../features/telemetry/performance.score";

export default function PerformancePage() {
  const {
    data,
    statistics,
    loading,
    generationTimeMs,
  } = useTelemetry(
    DEFAULT_DATASET_SIZE,
  );

  const runtime =
    usePerformance();

  const score =
    calculatePerformanceScore(
      runtime,
      statistics,
    );

  const fpsHealthy =
    runtime.fps >= 55;

  const frameTimeHealthy =
    runtime.frameTime > 0 &&
    runtime.frameTime <= 16.67;

  const datasetLabel = data
    ? data.length >= 1_000_000
      ? `${(
          data.length /
          1_000_000
        ).toFixed(2)}M`
      : `${(
          data.length /
          1_000
        ).toFixed(0)}K`
    : "—";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                fpsHealthy
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              Runtime diagnostics
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            Performance Analysis
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Evaluate rendering health, frame timing, workload
            efficiency, and dataset processing performance.
          </p>
        </section>

        {/* Score */}
        <section className="mb-4 rounded-xl border border-white/[0.07] bg-[#0d0d0f] p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                Overall performance score
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold tracking-tight text-zinc-100">
                  {statistics
                    ? score.score.toFixed(
                        1,
                      )
                    : "—"}
                </span>

                <span className="text-xs text-zinc-600">
                  / 100
                </span>
              </div>

              <p className="mt-2 text-xs text-zinc-600">
                {statistics
                  ? `${score.status} runtime profile`
                  : "Waiting for telemetry statistics"}
              </p>
            </div>

            <div className="w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                  Score composition
                </span>

                <span className="font-mono text-[10px] text-zinc-500">
                  {statistics
                    ? `${score.score.toFixed(1)}%`
                    : "—"}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-zinc-300 transition-all"
                  style={{
                    width: `${score.score}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-[9px] text-zinc-700">
                <span>Runtime FPS</span>
                <span>Frame timing</span>
                <span>Workload</span>
              </div>
            </div>
          </div>
        </section>

        {/* Runtime metrics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Frame rate"
            value={
              runtime.fps > 0
                ? runtime.fps.toFixed(
                    1,
                  )
                : "—"
            }
            unit="FPS"
            change={
              runtime.fps > 0
                ? fpsHealthy
                  ? "healthy"
                  : "degraded"
                : "measuring"
            }
            trend={
              fpsHealthy
                ? "up"
                : "down"
            }
            icon={Gauge}
            description="runtime"
          />

          <MetricCard
            label="Frame time"
            value={
              runtime.frameTime >
              0
                ? runtime.frameTime.toFixed(
                    2,
                  )
                : "—"
            }
            unit="ms"
            change={
              frameTimeHealthy
                ? "within budget"
                : runtime.frameTime >
                    0
                  ? "over budget"
                  : "measuring"
            }
            trend={
              frameTimeHealthy
                ? "up"
                : "down"
            }
            icon={Activity}
            description="16.67 ms target"
          />

          <MetricCard
            label="Memory"
            value={
              runtime.memoryUsedMb !==
              null
                ? runtime.memoryUsedMb.toFixed(
                    1,
                  )
                : "—"
            }
            unit={
              runtime.memoryUsedMb !==
              null
                ? "MB"
                : undefined
            }
            change={
              runtime.memoryUsedMb !==
              null
                ? "observed"
                : "unsupported"
            }
            trend="up"
            icon={HardDrive}
            description="JS heap"
          />

          <MetricCard
            label="Generation"
            value={
              generationTimeMs !==
              null
                ? generationTimeMs.toFixed(
                    1,
                  )
                : "—"
            }
            unit="ms"
            change={
              loading
                ? "processing"
                : "worker complete"
            }
            trend="up"
            icon={Timer}
            description="dataset generation"
          />
        </section>

        {/* Diagnostics */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <h2 className="text-sm font-medium text-zinc-200">
                Runtime diagnostics
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Browser rendering measurements
              </p>
            </div>

            <div className="divide-y divide-white/[0.05]">
              <DiagnosticRow
                label="Frame rate"
                value={
                  runtime.fps > 0
                    ? `${runtime.fps.toFixed(1)} FPS`
                    : "Measuring"
                }
                healthy={
                  fpsHealthy
                }
              />

              <DiagnosticRow
                label="Frame budget"
                value={
                  runtime.frameTime >
                  0
                    ? `${runtime.frameTime.toFixed(2)} ms`
                    : "Measuring"
                }
                healthy={
                  frameTimeHealthy
                }
              />

              <DiagnosticRow
                label="Dataset"
                value={datasetLabel}
                healthy={
                  Boolean(data)
                }
              />

              <DiagnosticRow
                label="Processing"
                value={
                  loading
                    ? "Worker processing"
                    : "Worker ready"
                }
                healthy={
                  !loading
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Zap
                  size={15}
                  strokeWidth={1.6}
                  className="text-zinc-600"
                />

                <h2 className="text-sm font-medium text-zinc-200">
                  Performance model
                </h2>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Score contribution breakdown
              </p>
            </div>

            <div className="space-y-5 p-5">
              <ScoreRow
                label="Runtime FPS"
                value={
                  score.fpsScore
                }
                weight="45%"
              />

              <ScoreRow
                label="Runtime frame time"
                value={
                  score.frameTimeScore
                }
                weight="35%"
              />

              <ScoreRow
                label="Workload frame time"
                value={
                  score.workloadScore
                }
                weight="20%"
              />
            </div>
          </div>
        </section>

        {/* Technical information */}
        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <InfoCard
            label="Dataset"
            value={datasetLabel}
          />

          <InfoCard
            label="Generation"
            value={
              generationTimeMs !==
              null
                ? `${generationTimeMs.toFixed(1)} ms`
                : "—"
            }
          />

          <InfoCard
            label="FPS target"
            value="60 FPS"
          />

          <InfoCard
            label="Frame budget"
            value="16.67 ms"
          />
        </section>
      </div>
    </div>
  );
}

function DiagnosticRow({
  label,
  value,
  healthy,
}: {
  label: string;
  value: string;
  healthy: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-xs text-zinc-500">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            healthy
              ? "bg-emerald-400"
              : "bg-amber-400"
          }`}
        />

        <span className="font-mono text-[10px] text-zinc-400">
          {value}
        </span>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {label}
        </span>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-300">
            {value.toFixed(1)}
          </span>

          <span className="text-[9px] text-zinc-700">
            {weight}
          </span>
        </div>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-zinc-500"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
      <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 font-mono text-xs text-zinc-400">
        {value}
      </p>
    </div>
  );
}