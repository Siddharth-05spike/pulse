import {
  ArrowLeft,
  Database,
} from "lucide-react";

import DataExplorer from "../components/explorer/DataExplorer";
import { useTelemetry } from "../hooks/useTelemetry";
import { DEFAULT_DATASET_SIZE } from "../features/datasets/dataset.config";

interface DataExplorerPageProps {
  onBack: () => void;
}

export default function DataExplorerPage({
  onBack,
}: DataExplorerPageProps) {
  const {
    data,
    loading,
    error,
  } = useTelemetry(
    DEFAULT_DATASET_SIZE,
  );

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <section className="mb-6">
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Database
                  size={14}
                  strokeWidth={1.7}
                  className="text-zinc-600"
                />

                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Dataset explorer
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
                Telemetry Explorer
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Inspect the active telemetry dataset through a
                virtualized high-volume data interface.
              </p>
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-700">
                Explorer status
              </p>

              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                {loading
                  ? "processing..."
                  : error
                    ? "error"
                    : "ready"}
              </p>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && !loading && (
          <div className="mb-4 rounded-xl border border-red-500/10 bg-red-500/[0.03] px-5 py-4">
            <p className="text-xs text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && !data ? (
          <div className="flex h-[500px] items-center justify-center rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
            <div className="text-center">
              <span className="mx-auto block h-2 w-2 animate-pulse rounded-full bg-amber-400" />

              <p className="mt-3 text-xs text-zinc-400">
                Preparing telemetry explorer...
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Loading dataset into the shared worker-backed buffer
              </p>
            </div>
          </div>
        ) : (
          <DataExplorer data={data} />
        )}
      </div>
    </div>
  );
}