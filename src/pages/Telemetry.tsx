import {
  Activity,
  ArrowLeft,
  Database,
  Gauge,
  Layers3,
  MemoryStick,
  Radio,
  Zap,
} from "lucide-react";

import TelemetryChart from "../components/charts/TelemetryChart";
import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";
import { usePerformance } from "../hooks/usePerformance";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDashboardStore } from "../store/dashboard.store";
import type {
  DatasetSize,
  RenderingMode,
  TelemetryMetric,
} from "../types/telemetry";

interface TelemetryProps {
  onBack: () => void;
}

const METRIC_OPTIONS: {
  label: string;
  value: TelemetryMetric;
  description: string;
}[] = [
  {
    label: "CPU",
    value: "cpu",
    description: "Processor utilization",
  },
  {
    label: "Memory",
    value: "memory",
    description: "Memory utilization",
  },
  {
    label: "Latency",
    value: "latency",
    description: "Response latency",
  },
  {
    label: "Throughput",
    value: "throughput",
    description: "Events per second",
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

const DATASET_OPTIONS: {
  label: string;
  size: DatasetSize;
  description: string;
}[] = [
  {
    label: "100K",
    size: 100_000,
    description: "Quick workload",
  },
  {
    label: "500K",
    size: 500_000,
    description: "Medium workload",
  },
  {
    label: "1M",
    size: 1_000_000,
    description: "Large workload",
  },
  {
    label: "5M",
    size: 5_000_000,
    description: "Stress workload",
  },
];

export default function Telemetry({
  onBack,
}: TelemetryProps) {
  const {
    data,
    loading,
    error,
    generationTimeMs,
    selectedSize,
    generate,
  } = useTelemetry(DEFAULT_DATASET_SIZE);

  const performanceMetrics = usePerformance();

  const activeMetric = useDashboardStore(
    (state) => state.activeMetric,
  );

  const setActiveMetric = useDashboardStore(
    (state) => state.setActiveMetric,
  );

  const renderingMode = useDashboardStore(
    (state) => state.renderingMode,
  );

  const setRenderingMode = useDashboardStore(
    (state) => state.setRenderingMode,
  );

  const selectedDataset = DATASET_OPTIONS.find(
    (option) => option.size === selectedSize,
  );

  const selectedMetric = METRIC_OPTIONS.find(
    (metric) => metric.value === activeMetric,
  );

  const selectedMode = RENDERING_MODES.find(
    (mode) => mode.value === renderingMode,
  );

  const fpsHealthy =
    performanceMetrics.fps >= 55;

  const frameTimeHealthy =
    performanceMetrics.frameTime > 0 &&
    performanceMetrics.frameTime <= 16.67;

  const dataPointLabel = data
    ? data.length >= 1_000_000
      ? `${(data.length / 1_000_000).toFixed(2)}M`
      : `${(data.length / 1_000).toFixed(0)}K`
    : "—";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Page header */}
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
                  Visualization workspace
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                Telemetry
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Explore high-volume telemetry streams with
                adaptive rendering and performance-aware
                visualization.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-700">
                  Stream
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
                        : "live"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Control workspace */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Layers3
                  size={14}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  Visualization controls
                </h3>
              </div>

              <p className="text-xs text-zinc-600">
                Configure the active telemetry stream and
                rendering strategy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-white/[0.05] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {/* Metric */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Metric
                </p>

                <span className="font-mono text-[9px] text-zinc-700">
                  {selectedMetric?.value ?? "—"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {METRIC_OPTIONS.map((metric) => {
                  const active =
                    activeMetric === metric.value;

                  return (
                    <button
                      key={metric.value}
                      type="button"
                      title={metric.description}
                      onClick={() =>
                        setActiveMetric(
                          metric.value,
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-[10px] font-medium transition ${
                        active
                          ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                          : "border-white/[0.06] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
                      }`}
                    >
                      {metric.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[9px] text-zinc-700">
                {selectedMetric?.description}
              </p>
            </div>

            {/* Rendering mode */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Rendering mode
                </p>

                <span className="font-mono text-[9px] text-zinc-700">
                  {renderingMode}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {RENDERING_MODES.map((mode) => {
                  const active =
                    renderingMode === mode.value;

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      title={mode.description}
                      onClick={() =>
                        setRenderingMode(
                          mode.value,
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-[10px] font-medium transition ${
                        active
                          ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                          : "border-white/[0.06] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[9px] text-zinc-700">
                {selectedMode?.description}
              </p>
            </div>

            {/* Dataset */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Dataset
                </p>

                <Database
                  size={13}
                  strokeWidth={1.7}
                  className="text-zinc-700"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {DATASET_OPTIONS.map((option) => {
                  const active =
                    selectedSize === option.size;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      title={option.description}
                      disabled={loading}
                      onClick={() =>
                        void generate(
                          option.size,
                        )
                      }
                      className={`rounded-md border px-3 py-2 text-[10px] font-mono transition ${
                        active
                          ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                          : "border-white/[0.06] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
                      } ${
                        loading
                          ? "cursor-wait opacity-60"
                          : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-[9px] text-zinc-700">
                {selectedDataset?.description}
              </p>
            </div>
          </div>
        </section>

        {/* Main telemetry workspace */}
        <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Activity
                  size={15}
                  strokeWidth={1.7}
                  className="shrink-0 text-zinc-600"
                />

                <h3 className="text-sm font-medium text-zinc-200">
                  {selectedMetric?.label ?? "Telemetry"} stream
                </h3>

                <span className="rounded-md border border-emerald-500/10 bg-emerald-500/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                  LIVE
                </span>
              </div>

              <p className="mt-1 truncate text-xs text-zinc-600">
                {selectedMetric?.description} ·{" "}
                {selectedDataset?.label ?? "dataset"} ·{" "}
                {selectedMode?.label ?? "rendering"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void generate(selectedSize)
              }
              disabled={loading}
              className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-medium text-black transition hover:bg-zinc-200 ${
                loading
                  ? "cursor-wait opacity-60"
                  : ""
              }`}
            >
              <Zap
                size={14}
                strokeWidth={2}
              />

              {loading
                ? "Generating..."
                : "Regenerate dataset"}
            </button>
          </div>

          <div className="relative h-[360px] sm:h-[480px] lg:h-[560px]">
            <TelemetryChart
              data={data}
              metric={activeMetric}
              renderingMode={renderingMode}
              loading={loading}
            />

            {error && !loading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg border border-red-500/10 bg-red-500/[0.04] px-5 py-4">
                  <p className="text-xs text-red-400">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-zinc-600">
              <span>
                <strong className="font-mono text-zinc-400">
                  {dataPointLabel}
                </strong>{" "}
                points
              </span>

              <span>
                <strong className="font-mono text-zinc-400">
                  {renderingMode.toUpperCase()}
                </strong>{" "}
                mode
              </span>

              {generationTimeMs !== null && (
                <span>
                  <strong className="font-mono text-zinc-400">
                    {generationTimeMs.toFixed(1)}
                  </strong>{" "}
                  ms generation
                </span>
              )}
            </div>

            <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Worker pipeline
            </span>
          </div>
        </section>

        {/* Runtime telemetry */}
        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                Runtime FPS
              </p>

              <Gauge
                size={14}
                strokeWidth={1.7}
                className="text-zinc-700"
              />
            </div>

            <p className="mt-2 font-mono text-lg text-zinc-300">
              {performanceMetrics.fps > 0
                ? performanceMetrics.fps.toFixed(1)
                : "—"}
              <span className="ml-1 text-[10px] text-zinc-700">
                FPS
              </span>
            </p>

            <p
              className={`mt-1 text-[9px] ${
                fpsHealthy
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {performanceMetrics.fps > 0
                ? fpsHealthy
                  ? "Within target"
                  : "Rendering degraded"
                : "Measuring"}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                Frame time
              </p>

              <Activity
                size={14}
                strokeWidth={1.7}
                className="text-zinc-700"
              />
            </div>

            <p className="mt-2 font-mono text-lg text-zinc-300">
              {performanceMetrics.frameTime > 0
                ? performanceMetrics.frameTime.toFixed(2)
                : "—"}
              <span className="ml-1 text-[10px] text-zinc-700">
                ms
              </span>
            </p>

            <p
              className={`mt-1 text-[9px] ${
                frameTimeHealthy
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {performanceMetrics.frameTime > 0
                ? frameTimeHealthy
                  ? "Within 16.67 ms budget"
                  : "Over frame budget"
                : "Measuring"}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                Data volume
              </p>

              <Database
                size={14}
                strokeWidth={1.7}
                className="text-zinc-700"
              />
            </div>

            <p className="mt-2 font-mono text-lg text-zinc-300">
              {dataPointLabel}
            </p>

            <p className="mt-1 text-[9px] text-zinc-700">
              Active telemetry points
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                Memory
              </p>

              <MemoryStick
                size={14}
                strokeWidth={1.7}
                className="text-zinc-700"
              />
            </div>

            <p className="mt-2 font-mono text-lg text-zinc-300">
              {performanceMetrics.memoryUsedMb !==
              null
                ? performanceMetrics.memoryUsedMb.toFixed(
                    1,
                  )
                : "—"}
              {performanceMetrics.memoryUsedMb !==
                null && (
                <span className="ml-1 text-[10px] text-zinc-700">
                  MB
                </span>
              )}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-[9px] text-zinc-700">
              <Radio
                size={10}
                strokeWidth={1.7}
              />
              JS heap
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}