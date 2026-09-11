import {
  Suspense,
  lazy,
} from "react";

import type {
  RenderingMode,
  TelemetryBuffer,
  TelemetryMetric,
} from "../../types/telemetry";

const TelemetryChart = lazy(
  () => import("./TelemetryChart"),
);

interface LazyTelemetryChartProps {
  data: TelemetryBuffer | null;
  metric: TelemetryMetric;
  renderingMode: RenderingMode;
  loading: boolean;
}

function ChartLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <span className="mx-auto block h-2 w-2 animate-pulse rounded-full bg-zinc-400" />

        <p className="mt-3 text-xs text-zinc-500">
          Initializing visualization...
        </p>

        <p className="mt-1 text-[10px] text-zinc-700">
          Loading chart engine
        </p>
      </div>
    </div>
  );
}

export default function LazyTelemetryChart(
  props: LazyTelemetryChartProps,
) {
  return (
    <Suspense fallback={<ChartLoadingState />}>
      <TelemetryChart {...props} />
    </Suspense>
  );
}