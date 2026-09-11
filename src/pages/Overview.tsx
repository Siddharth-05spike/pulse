import {
  Activity,
  Cpu,
  Database,
  Gauge,
  MemoryStick,
  Radio,
  Zap,
} from "lucide-react";

import MetricCard from "../components/metrics/MetricCard";
import LazyTelemetryChart from "../components/charts/LazyTelemetryChart";
import TelemetryStatistics from "../components/statistics/TelemetryStatistics";
import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";
import { usePerformance } from "../hooks/usePerformance";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDashboardStore } from "../store/dashboard.store";
import { calculatePerformanceScore } from "../features/telemetry/performance.score";
import type {
  DatasetSize,
  RenderingMode,
  TelemetryMetric,
} from "../types/telemetry";

interface OverviewProps {
  onOpenExplorer: () => void;
}

const METRIC_OPTIONS: {
  label: string;
  value: TelemetryMetric;
}[] = [
  {
    label: "CPU",
    value: "cpu",
  },
  {
    label: "Memory",
    value: "memory",
  },
  {
    label: "Latency",
    value: "latency",
  },
  {
    label: "Throughput",
    value: "throughput",
  },
];

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

export default function Overview({
  onOpenExplorer,
}: OverviewProps) {
  const {
    data,
    statistics,
    loading,
    error,
    generationTimeMs,
    selectedSize,
    generate,
  } = useTelemetry(DEFAULT_DATASET_SIZE);

  const performanceMetrics = usePerformance();

  /*
   * Dashboard controls are managed by Zustand.
   *
   * This keeps metric selection and rendering
   * mode independent from local component state.
   */
  const activeMetric =
    useDashboardStore(
      (state) => state.activeMetric,
    );

  const setActiveMetric =
    useDashboardStore(
      (state) => state.setActiveMetric,
    );

  const renderingMode =
    useDashboardStore(
      (state) => state.renderingMode,
    );

  const setRenderingMode =
    useDashboardStore(
      (state) => state.setRenderingMode,
    );

  const selectedDatasetLabel =
    selectedSize >= 1_000_000
      ? `${selectedSize / 1_000_000}M`
      : `${selectedSize / 1_000}K`;

  const dataPointLabel = data
    ? data.length >= 1_000_000
      ? `${(
          data.length / 1_000_000
        ).toFixed(2)}M`
      : `${(
          data.length / 1_000
        ).toFixed(0)}K`
    : "—";

  const fpsHealthy =
    performanceMetrics.fps >= 55;

  const frameTimeHealthy =
    performanceMetrics.frameTime > 0 &&
    performanceMetrics.frameTime <= 16.67;

  /*
   * Performance score is calculated from
   * actual runtime metrics and workload
   * statistics.
   */
  const performanceScore =
    calculatePerformanceScore(
      performanceMetrics,
      statistics,
    );

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Page header */}
        <section className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                System monitoring
              </span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Performance Overview
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Monitor rendering performance, data throughput,
              and visualization health in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-700">
                Runtime status
              </p>

              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                {loading
                  ? "processing..."
                  : error
                    ? "error"
                    : "live"}
              </p>
            </div>
          </div>
        </section>

        {/* Runtime metrics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Frame rate"
            value={
              performanceMetrics.fps > 0
                ? performanceMetrics.fps.toFixed(1)
                : "—"
            }
            unit="FPS"
            change={
              performanceMetrics.fps > 0
                ? fpsHealthy
                  ? "stable"
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
              performanceMetrics.frameTime > 0
                ? performanceMetrics.frameTime.toFixed(2)
                : "—"
            }
            unit="ms"
            change={
              performanceMetrics.frameTime > 0
                ? frameTimeHealthy
                  ? "within budget"
                  : "over budget"
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
            label="Data points"
            value={dataPointLabel}
            change={
              loading
                ? "processing"
                : data
                  ? "loaded"
                  : "waiting"
            }
            trend="up"
            icon={Database}
            description="active dataset"
          />

          <MetricCard
            label="Memory"
            value={
              performanceMetrics.memoryUsedMb !==
              null
                ? performanceMetrics.memoryUsedMb.toFixed(
                    1,
                  )
                : "N/A"
            }
            unit={
              performanceMetrics.memoryUsedMb !==
              null
                ? "MB"
                : undefined
            }
            change={
              performanceMetrics.memoryUsedMb !==
              null
                ? "live"
                : "unsupported"
            }
            trend="up"
            icon={MemoryStick}
            description="JS heap"
          />
        </section>

        {/* Main workspace */}
        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Visualization */}
          <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Telemetry stream
                  </h3>

                  <span className="rounded-md border border-emerald-500/10 bg-emerald-500/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Real-time rendering workload
                </p>
              </div>

              {/* Metric selector */}
              <div className="flex w-full overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:w-auto">
                {METRIC_OPTIONS.map(
                  (metric) => {
                    const isActive =
                      activeMetric ===
                      metric.value;

                    return (
                      <button
                        key={metric.value}
                        type="button"
                        onClick={() =>
                          setActiveMetric(
                            metric.value,
                          )
                        }
                        className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${
                          isActive
                            ? "bg-white/[0.08] text-zinc-200"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        {metric.label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* Lazy-loaded ECharts visualization */}
            <div className="relative h-[320px] sm:h-[380px]">
              <LazyTelemetryChart
                data={data}
                metric={activeMetric}
                renderingMode={renderingMode}
                loading={loading}
              />

              {error && !loading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg border border-red-500/10 bg-red-500/[0.03] px-4 py-3">
                    <p className="text-xs text-red-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chart footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-600">
                <span>
                  <strong className="font-mono text-zinc-400">
                    {dataPointLabel}
                  </strong>{" "}
                  points
                </span>

                <span>
                  <strong className="font-mono text-zinc-400">
                    {statistics
                      ? Math.round(
                          statistics.throughput.average,
                        ).toLocaleString()
                      : "—"}
                  </strong>{" "}
                  events/s
                </span>

                <span>
                  <strong className="font-mono text-zinc-400">
                    {renderingMode.toUpperCase()}
                  </strong>{" "}
                  mode
                </span>

                {generationTimeMs !==
                  null && (
                  <span>
                    <strong className="font-mono text-zinc-400">
                      {generationTimeMs.toFixed(
                        1,
                      )}
                    </strong>{" "}
                    ms generation
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={
                  onOpenExplorer
                }
                className="text-[10px] font-medium text-zinc-500 transition hover:text-zinc-300"
              >
                Open explorer →
              </button>
            </div>
          </div>

          {/* Health */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="border-b border-white/[0.06] p-5">
              <h3 className="text-sm font-medium text-zinc-200">
                System health
              </h3>

              <p className="mt-1 text-xs text-zinc-600">
                Visualization pipeline status
              </p>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {[
                [
                  "Rendering engine",
                  fpsHealthy
                    ? "Healthy"
                    : "Degraded",
                  Cpu,
                ],
                [
                  "Data processing",
                  loading
                    ? "Processing"
                    : "Healthy",
                  Zap,
                ],
                [
                  "Stream connection",
                  loading
                    ? "Processing"
                    : "Connected",
                  Radio,
                ],
                [
                  "Memory manager",
                  performanceMetrics.memoryUsedMb !==
                  null
                    ? "Healthy"
                    : "Limited",
                  MemoryStick,
                ],
              ].map(
                ([label, status, Icon]) => (
                  <div
                    key={label as string}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={15}
                        strokeWidth={1.7}
                        className="text-zinc-600"
                      />

                      <span className="text-xs text-zinc-400">
                        {label as string}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          loading
                            ? "animate-pulse bg-amber-400"
                            : fpsHealthy
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                        }`}
                      />

                      <span
                        className={`text-[10px] font-medium ${
                          loading
                            ? "text-amber-400"
                            : fpsHealthy
                              ? "text-emerald-400"
                              : "text-amber-400"
                        }`}
                      >
                        {status as string}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Performance score */}
            <div className="m-4 rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Performance score
                </span>

                <span className="font-mono text-sm text-zinc-300">
                  {statistics &&
                  performanceMetrics.fps > 0 &&
                  performanceMetrics.frameTime > 0
                    ? performanceScore.score.toFixed(
                        1,
                      )
                    : "—"}
                </span>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-zinc-300 transition-all duration-500"
                  style={{
                    width: `${
                      statistics &&
                      performanceMetrics.fps > 0 &&
                      performanceMetrics.frameTime > 0
                        ? performanceScore.score
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[9px] text-zinc-700">
                Based on runtime rendering health and workload
                timing
              </p>
            </div>
          </div>
        </section>

        {/* Performance engine */}
        <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-zinc-200">
                  Performance engine
                </h3>

                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-zinc-600">
                  BENCHMARK
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                Configure the workload and observe rendering behavior.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void generate(
                  selectedSize,
                )
              }
              disabled={loading}
              className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-medium text-black transition hover:bg-zinc-200 ${
                loading
                  ? "cursor-wait opacity-60"
                  : ""
              }`}
            >
              <Zap size={14} />

              {loading
                ? "Generating..."
                : "Run stress test"}
            </button>
          </div>

          <div className="grid grid-cols-1 divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {/* Dataset */}
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Dataset
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  {
                    label: "100K",
                    size: 100_000 as DatasetSize,
                  },
                  {
                    label: "500K",
                    size: 500_000 as DatasetSize,
                  },
                  {
                    label: "1M",
                    size: 1_000_000 as DatasetSize,
                  },
                  {
                    label: "5M",
                    size: 5_000_000 as DatasetSize,
                  },
                ].map(
                  (option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        void generate(
                          option.size,
                        )
                      }
                      disabled={loading}
                      className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono transition ${
                        selectedSize ===
                        option.size
                          ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                          : "border-white/[0.06] text-zinc-600 hover:text-zinc-300"
                      } ${
                        loading
                          ? "cursor-wait opacity-60"
                          : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Rendering mode */}
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Rendering mode
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {RENDERING_MODES.map(
                  (mode) => {
                    const isActive =
                      renderingMode ===
                      mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() =>
                          setRenderingMode(
                            mode.value,
                          )
                        }
                        className={`group relative rounded-md border px-2.5 py-1.5 text-[10px] transition ${
                          isActive
                            ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                            : "border-white/[0.06] text-zinc-600 hover:text-zinc-300"
                        }`}
                        title={
                          mode.description
                        }
                      >
                        {mode.label}
                      </button>
                    );
                  },
                )}
              </div>

              <p className="mt-2 text-[9px] text-zinc-700">
                {
                  RENDERING_MODES.find(
                    (mode) =>
                      mode.value ===
                      renderingMode,
                  )?.description
                }
              </p>
            </div>

            {/* Dataset engine */}
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Dataset engine
              </p>

              {loading ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />

                  <div>
                    <p className="text-xs text-zinc-400">
                      Generating{" "}
                      {
                        selectedDatasetLabel
                      }{" "}
                      points
                    </p>

                    <p className="mt-0.5 text-[9px] text-zinc-700">
                      Running in Web Worker
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="mt-3">
                  <span className="text-xs text-red-400">
                    {error}
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div>
                    <span className="font-mono text-xs text-zinc-300">
                      {data?.length.toLocaleString() ??
                        "0"}
                    </span>

                    <span className="ml-1 text-[10px] text-zinc-700">
                      points
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-xs text-zinc-300">
                      {generationTimeMs?.toFixed(
                        1,
                      ) ?? "—"}{" "}
                      ms
                    </span>

                    <span className="ml-1 text-[10px] text-zinc-700">
                      generation
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    WORKER
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Technical telemetry footer */}
        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {/* Active workload */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
              Active workload
            </p>

            <p className="mt-1 font-mono text-xs text-zinc-400">
              {selectedDatasetLabel}
            </p>
          </div>

          {/* Generation */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
              Generation
            </p>

            <p className="mt-1 font-mono text-xs text-zinc-400">
              {generationTimeMs !==
              null
                ? `${generationTimeMs.toFixed(
                    1,
                  )} ms`
                : "—"}
            </p>
          </div>

          {/* Runtime FPS */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
              Runtime FPS
            </p>

            <p className="mt-1 font-mono text-xs text-zinc-400">
              {performanceMetrics.fps >
              0
                ? `${performanceMetrics.fps.toFixed(
                    1,
                  )} FPS`
                : "—"}
            </p>
          </div>

          {/* Processing */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
              Processing
            </p>

            <p className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Worker thread
            </p>
          </div>

          {/* Dataset state */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
              Dataset state
            </p>

            <p className="mt-1 font-mono text-xs text-zinc-400">
              {loading
                ? "GENERATING"
                : error
                  ? "ERROR"
                  : "READY"}
            </p>
          </div>
        </section>

        {/* Telemetry statistics */}
        {statistics && (
          <section className="mt-4">
            <TelemetryStatistics
              statistics={statistics}
            />
          </section>
        )}
      </div>
    </div>
  );
}