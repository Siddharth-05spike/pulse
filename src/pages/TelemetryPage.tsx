import {
  Activity,
  Database,
  Eye,
  Zap,
} from "lucide-react";

import LazyTelemetryChart from "../components/charts/LazyTelemetryChart";
import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDashboardStore } from "../store/dashboard.store";

import type {
  DatasetSize,
  RenderingMode,
  TelemetryMetric,
} from "../types/telemetry";

interface TelemetryPageProps {
  onOpenExplorer: () => void;
}

const METRICS: {
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

const MODES: {
  label: string;
  value: RenderingMode;
  description: string;
}[] = [
  {
    label: "Raw",
    value: "raw",
    description:
      "Fine-grained samples",
  },
  {
    label: "Adaptive",
    value: "adaptive",
    description:
      "Performance-aware sampling",
  },
  {
    label: "Aggregated",
    value: "aggregated",
    description:
      "Bucketed summaries",
  },
];

const DATASETS: {
  label: string;
  size: DatasetSize;
}[] = [
  {
    label: "100K",
    size: 100_000,
  },
  {
    label: "500K",
    size: 500_000,
  },
  {
    label: "1M",
    size: 1_000_000,
  },
  {
    label: "5M",
    size: 5_000_000,
  },
];

export default function TelemetryPage({
  onOpenExplorer,
}: TelemetryPageProps) {
  const {
    data,
    loading,
    error,
    generationTimeMs,
    selectedSize,
    generate,
  } = useTelemetry(
    DEFAULT_DATASET_SIZE,
  );

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

  const datasetLabel =
    selectedSize >= 1_000_000
      ? `${selectedSize / 1_000_000}M`
      : `${selectedSize / 1_000}K`;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
              Live telemetry
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                Telemetry
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Explore high-volume telemetry streams with
                performance-aware rendering and worker-backed
                dataset generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                  Dataset
                </p>

                <p className="mt-0.5 font-mono text-xs text-zinc-400">
                  {datasetLabel}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.025] px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-700">
                  Pipeline
                </p>

                <p className="mt-0.5 text-xs text-emerald-400">
                  {loading
                    ? "Processing"
                    : "Live"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main chart */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity
                    size={15}
                    strokeWidth={1.6}
                    className="text-zinc-600"
                  />

                  <h2 className="text-sm font-medium text-zinc-200">
                    Telemetry stream
                  </h2>

                  <span className="rounded-md border border-emerald-500/10 bg-emerald-500/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  {activeMetric.toUpperCase()} signal across the
                  active workload
                </p>
              </div>

              <div className="flex overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
                {METRICS.map((metric) => (
                  <button
                    key={metric.value}
                    type="button"
                    onClick={() =>
                      setActiveMetric(
                        metric.value,
                      )
                    }
                    className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] font-medium transition ${
                      activeMetric ===
                      metric.value
                        ? "bg-white/[0.08] text-zinc-200"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-[420px] sm:h-[500px]">
            <LazyTelemetryChart
              data={data}
              metric={activeMetric}
              renderingMode={renderingMode}
              loading={loading}
            />

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg border border-red-500/10 bg-[#101012] px-5 py-4">
                  <p className="text-xs text-red-400">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-600">
              <span>
                <strong className="font-mono text-zinc-400">
                  {data
                    ? data.length.toLocaleString()
                    : "0"}
                </strong>{" "}
                points
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
              onClick={onOpenExplorer}
              className="text-[10px] font-medium text-zinc-500 transition hover:text-zinc-300"
            >
              Inspect dataset →
            </button>
          </div>
        </section>

        {/* Controls */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Dataset */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f] p-5">
            <div className="flex items-center gap-2">
              <Database
                size={15}
                strokeWidth={1.6}
                className="text-zinc-600"
              />

              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Dataset workload
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  Generate a new telemetry workload
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {DATASETS.map((dataset) => (
                <button
                  key={dataset.label}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void generate(
                      dataset.size,
                    )
                  }
                  className={`rounded-lg border px-4 py-2 text-[10px] font-mono transition ${
                    selectedSize ===
                    dataset.size
                      ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                      : "border-white/[0.06] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
                  } ${
                    loading
                      ? "cursor-wait opacity-50"
                      : ""
                  }`}
                >
                  {dataset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rendering */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d0f] p-5">
            <div className="flex items-center gap-2">
              <Eye
                size={15}
                strokeWidth={1.6}
                className="text-zinc-600"
              />

              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Rendering strategy
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  Control how high-volume telemetry is visualized
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  title={mode.description}
                  onClick={() =>
                    setRenderingMode(
                      mode.value,
                    )
                  }
                  className={`rounded-lg border px-4 py-2 text-[10px] transition ${
                    renderingMode ===
                    mode.value
                      ? "border-white/[0.15] bg-white/[0.08] text-zinc-200"
                      : "border-white/[0.06] text-zinc-600 hover:border-white/[0.1] hover:text-zinc-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[9px] text-zinc-700">
              <Zap
                size={11}
                strokeWidth={1.6}
              />

              {MODES.find(
                (mode) =>
                  mode.value ===
                  renderingMode,
              )?.description}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}