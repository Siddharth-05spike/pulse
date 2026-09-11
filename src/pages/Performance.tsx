import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  Layers3,
  MemoryStick,
  Timer,
  Zap,
} from "lucide-react";

import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";
import { calculatePerformanceScore } from "../features/telemetry/performance.score";
import { usePerformance } from "../hooks/usePerformance";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDashboardStore } from "../store/dashboard.store";
import type { RenderingMode } from "../types/telemetry";

interface PerformanceProps {
  onBack: () => void;
}

const RENDERING_MODES: {
  label: string;
  value: RenderingMode;
  description: string;
}[] = [
  {
    label: "Raw",
    value: "raw",
    description: "Fine-grained samples",
  },
  {
    label: "Adaptive",
    value: "adaptive",
    description: "Performance-aware sampling",
  },
  {
    label: "Aggregated",
    value: "aggregated",
    description: "Bucketed summaries",
  },
];

function formatScore(score: number, available: boolean) {
  return available ? score.toFixed(1) : "—";
}

function scoreLabel(
  status: "excellent" | "good" | "degraded" | "poor",
) {
  switch (status) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "degraded":
      return "Degraded";
    case "poor":
      return "Poor";
  }
}

export default function Performance({
  onBack,
}: PerformanceProps) {
  const {
    statistics,
    loading,
    error,
    generationTimeMs,
    selectedSize,
    generate,
  } = useTelemetry(DEFAULT_DATASET_SIZE);

  const performanceMetrics = usePerformance();

  const renderingMode = useDashboardStore(
    (state) => state.renderingMode,
  );

  const setRenderingMode = useDashboardStore(
    (state) => state.setRenderingMode,
  );

  const score = calculatePerformanceScore(
    performanceMetrics,
    statistics,
  );

  const metricsAvailable =
    statistics !== null &&
    performanceMetrics.fps > 0 &&
    performanceMetrics.frameTime > 0;

  const fpsHealthy =
    performanceMetrics.fps >= 55;

  const frameTimeHealthy =
    performanceMetrics.frameTime > 0 &&
    performanceMetrics.frameTime <= 16.67;

  const workloadFrameTime =
    statistics?.frameTime.average ?? 0;

  const workloadHealthy =
    workloadFrameTime > 0 &&
    workloadFrameTime <= 16.67;

  const selectedDatasetLabel =
    selectedSize >= 1_000_000
      ? `${selectedSize / 1_000_000}M`
      : `${selectedSize / 1_000}K`;

  const scoreStatus = scoreLabel(score.status);

  const statusMessage =
    score.status === "excellent"
      ? "Rendering pipeline is operating within an excellent performance range."
      : score.status === "good"
        ? "Rendering pipeline is performing well with healthy runtime characteristics."
        : score.status === "degraded"
          ? "Rendering performance is below the preferred target and may require optimization."
          : "Rendering performance is currently outside the target range.";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <section className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 flex items-center gap-2 text-[10px] font-medium text-zinc-600 transition hover:text-zinc-300"
          >
            <ArrowLeft
              size={13}
              strokeWidth={1.7}
            />
            Back to overview
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Runtime diagnostics
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                Performance Analysis
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Analyze rendering health, frame timing,
                workload behavior, and runtime performance.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-700">
                  Analysis status
                </p>

                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      loading
                        ? "animate-pulse bg-amber-400"
                        : error
                          ? "bg-red-400"
                          : "bg-emerald-400"
                    }`}
                  />

                  <span className="font-mono text-xs text-zinc-400">
                    {loading
                      ? "processing"
                      : error
                        ? "error"
                        : "ready"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Score overview */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Score */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Gauge
                  size={15}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Overall performance
                </h3>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Composite score from runtime and workload behavior.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-7">
                <span className="font-mono text-5xl font-semibold tracking-tight text-zinc-100">
                  {formatScore(
                    score.score,
                    metricsAvailable,
                  )}
                </span>

                <span className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-700">
                  / 100
                </span>

                <div className="mt-4 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      score.status === "excellent" ||
                      score.status === "good"
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />

                  <span
                    className={`text-[10px] font-medium ${
                      score.status === "excellent" ||
                      score.status === "good"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {metricsAvailable
                      ? scoreStatus
                      : "Measuring"}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    Performance index
                  </span>

                  <span className="font-mono text-xs text-zinc-400">
                    {formatScore(
                      score.score,
                      metricsAvailable,
                    )}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-zinc-300 transition-all duration-700"
                    style={{
                      width: `${
                        metricsAvailable
                          ? score.score
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-4 max-w-xl text-xs leading-6 text-zinc-500">
                  {statusMessage}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                      FPS contribution
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-300">
                      {metricsAvailable
                        ? `${score.fpsScore.toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                      Frame contribution
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-300">
                      {metricsAvailable
                        ? `${score.frameTimeScore.toFixed(
                            1,
                          )}%`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                      Workload
                    </p>

                    <p className="mt-1 font-mono text-sm text-zinc-300">
                      {metricsAvailable
                        ? `${score.workloadScore.toFixed(
                            1,
                          )}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Runtime summary */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Activity
                  size={15}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Runtime snapshot
                </h3>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Current browser rendering characteristics.
              </p>
            </div>

            <div className="divide-y divide-white/[0.05]">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Gauge
                    size={14}
                    strokeWidth={1.7}
                    className="text-zinc-700"
                  />

                  <span className="text-xs text-zinc-400">
                    Frame rate
                  </span>
                </div>

                <span className="font-mono text-xs text-zinc-300">
                  {performanceMetrics.fps > 0
                    ? `${performanceMetrics.fps.toFixed(
                        1,
                      )} FPS`
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Timer
                    size={14}
                    strokeWidth={1.7}
                    className="text-zinc-700"
                  />

                  <span className="text-xs text-zinc-400">
                    Frame time
                  </span>
                </div>

                <span className="font-mono text-xs text-zinc-300">
                  {performanceMetrics.frameTime > 0
                    ? `${performanceMetrics.frameTime.toFixed(
                        2,
                      )} ms`
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <MemoryStick
                    size={14}
                    strokeWidth={1.7}
                    className="text-zinc-700"
                  />

                  <span className="text-xs text-zinc-400">
                    JS heap
                  </span>
                </div>

                <span className="font-mono text-xs text-zinc-300">
                  {performanceMetrics.memoryUsedMb !==
                  null
                    ? `${performanceMetrics.memoryUsedMb.toFixed(
                        1,
                      )} MB`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Database
                    size={14}
                    strokeWidth={1.7}
                    className="text-zinc-700"
                  />

                  <span className="text-xs text-zinc-400">
                    Dataset
                  </span>
                </div>

                <span className="font-mono text-xs text-zinc-300">
                  {selectedDatasetLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Runtime diagnostics */}
        <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-2">
              <BarChart3
                size={15}
                strokeWidth={1.7}
                className="text-zinc-600"
              />

              <h3 className="text-sm font-medium text-zinc-200">
                Runtime diagnostics
              </h3>
            </div>

            <p className="mt-1 text-xs text-zinc-600">
              Compare live runtime behavior against the target
              rendering budget.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {/* FPS */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  FPS health
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    fpsHealthy
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
              </div>

              <p className="mt-3 font-mono text-2xl text-zinc-200">
                {performanceMetrics.fps > 0
                  ? performanceMetrics.fps.toFixed(1)
                  : "—"}
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Target ≥ 55 FPS
              </p>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      performanceMetrics.fps > 0
                        ? (performanceMetrics.fps /
                            60) *
                            100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Frame time */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Frame budget
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    frameTimeHealthy
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
              </div>

              <p className="mt-3 font-mono text-2xl text-zinc-200">
                {performanceMetrics.frameTime > 0
                  ? performanceMetrics.frameTime.toFixed(
                      2,
                    )
                  : "—"}
                <span className="ml-1 text-xs text-zinc-700">
                  ms
                </span>
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Target ≤ 16.67 ms
              </p>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      performanceMetrics.frameTime >
                        0
                        ? (performanceMetrics.frameTime /
                            16.67) *
                            100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Workload */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Workload timing
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    workloadHealthy
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
              </div>

              <p className="mt-3 font-mono text-2xl text-zinc-200">
                {workloadFrameTime > 0
                  ? workloadFrameTime.toFixed(2)
                  : "—"}
                <span className="ml-1 text-xs text-zinc-700">
                  ms
                </span>
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Dataset frame-time average
              </p>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-zinc-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      workloadFrameTime > 0
                        ? (workloadFrameTime /
                            16.67) *
                            100
                        : 0,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Workload analysis */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Telemetry workload */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Zap
                  size={15}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Workload analysis
                </h3>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Statistics derived from the active telemetry
                dataset.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
              <div className="bg-[#0d0d0f] p-5">
                <p className="text-[9px] uppercase tracking-[0.13em] text-zinc-700">
                  Avg throughput
                </p>

                <p className="mt-2 font-mono text-lg text-zinc-300">
                  {statistics
                    ? Math.round(
                        statistics.throughput.average,
                      ).toLocaleString()
                    : "—"}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  events / sec
                </p>
              </div>

              <div className="bg-[#0d0d0f] p-5">
                <p className="text-[9px] uppercase tracking-[0.13em] text-zinc-700">
                  Peak throughput
                </p>

                <p className="mt-2 font-mono text-lg text-zinc-300">
                  {statistics
                    ? Math.round(
                        statistics.throughput.peak,
                      ).toLocaleString()
                    : "—"}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  events / sec
                </p>
              </div>

              <div className="bg-[#0d0d0f] p-5">
                <p className="text-[9px] uppercase tracking-[0.13em] text-zinc-700">
                  P95 latency
                </p>

                <p className="mt-2 font-mono text-lg text-zinc-300">
                  {statistics
                    ? statistics.latency.p95.toFixed(
                        2,
                      )
                    : "—"}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  milliseconds
                </p>
              </div>

              <div className="bg-[#0d0d0f] p-5">
                <p className="text-[9px] uppercase tracking-[0.13em] text-zinc-700">
                  P99 latency
                </p>

                <p className="mt-2 font-mono text-lg text-zinc-300">
                  {statistics
                    ? statistics.latency.p99.toFixed(
                        2,
                      )
                    : "—"}
                </p>

                <p className="mt-1 text-[9px] text-zinc-700">
                  milliseconds
                </p>
              </div>
            </div>
          </div>

          {/* Rendering strategy */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Layers3
                  size={15}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Rendering strategy
                </h3>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Select the rendering strategy used by the telemetry
                visualization.
              </p>
            </div>

            <div className="space-y-2 p-5">
              {RENDERING_MODES.map((mode) => {
                const active =
                  renderingMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setRenderingMode(
                        mode.value,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-white/[0.12] bg-white/[0.05]"
                        : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.09] hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          active
                            ? "text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {mode.label}
                      </p>

                      <p className="mt-1 text-[9px] text-zinc-700">
                        {mode.description}
                      </p>
                    </div>

                    <span
                      className={`ml-4 h-2 w-2 shrink-0 rounded-full ${
                        active
                          ? "bg-zinc-300"
                          : "bg-zinc-800"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benchmark controls */}
        <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Database
                  size={15}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Workload benchmark
                </h3>

                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-zinc-600">
                  {selectedDatasetLabel}
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Regenerate the active workload to evaluate rendering
                behavior.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void generate(selectedSize)
              }
              className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-medium text-black transition hover:bg-zinc-200 ${
                loading
                  ? "cursor-wait opacity-60"
                  : ""
              }`}
            >
              <Zap size={14} />

              {loading
                ? "Generating..."
                : "Run benchmark"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
            <div className="bg-[#0d0d0f] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Dataset
              </p>

              <p className="mt-1 font-mono text-xs text-zinc-300">
                {selectedDatasetLabel}
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Generation
              </p>

              <p className="mt-1 font-mono text-xs text-zinc-300">
                {generationTimeMs !== null
                  ? `${generationTimeMs.toFixed(1)} ms`
                  : "—"}
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Rendering
              </p>

              <p className="mt-1 font-mono text-xs text-zinc-300">
                {renderingMode.toUpperCase()}
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
                Status
              </p>

              <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2
                  size={11}
                  strokeWidth={1.8}
                />
                {loading
                  ? "Processing"
                  : error
                    ? "Error"
                    : "Ready"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}