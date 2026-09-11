import { useEffect } from "react";

import { useDashboardStore } from "../store/dashboard.store";

import type {
  DatasetSize,
} from "../types/telemetry";

export function useTelemetry(
  initialSize: DatasetSize,
) {
  const data = useDashboardStore(
    (state) => state.data,
  );

  const statistics =
    useDashboardStore(
      (state) => state.statistics,
    );

  const loading = useDashboardStore(
    (state) => state.loading,
  );

  const error = useDashboardStore(
    (state) => state.error,
  );

  const generationTimeMs =
    useDashboardStore(
      (state) => state.generationTimeMs,
    );

  const selectedSize =
    useDashboardStore(
      (state) => state.selectedSize,
    );

  const initialize =
    useDashboardStore(
      (state) => state.initialize,
    );

  const generate =
    useDashboardStore(
      (state) => state.generate,
    );

  useEffect(() => {
    initialize(initialSize);
  }, [
    initialize,
    initialSize,
  ]);

  return {
    data,
    statistics,
    loading,
    error,
    generationTimeMs,
    selectedSize,
    generate,
  };
}