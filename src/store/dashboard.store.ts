import { create } from "zustand";

import { telemetryWorker } from "../features/telemetry/telemetry.service";

import type {
  DatasetSize,
  RenderingMode,
  TelemetryBuffer,
  TelemetryMetric,
} from "../types/telemetry";

import type {
  TelemetryStatistics,
} from "../features/telemetry/telemetry.statistics";

interface DashboardState {
  selectedSize: DatasetSize;
  activeMetric: TelemetryMetric;
  renderingMode: RenderingMode;

  data: TelemetryBuffer | null;

  statistics:
    | TelemetryStatistics
    | null;

  loading: boolean;
  error: string | null;
  generationTimeMs: number | null;

  initialized: boolean;

  setSelectedSize: (
    size: DatasetSize,
  ) => void;

  setActiveMetric: (
    metric: TelemetryMetric,
  ) => void;

  setRenderingMode: (
    mode: RenderingMode,
  ) => void;

  initialize: (
    size: DatasetSize,
  ) => void;

  generate: (
    size: DatasetSize,
  ) => Promise<void>;
}

let latestRequestId = 0;

export const useDashboardStore =
  create<DashboardState>((set, get) => ({
    selectedSize: 1_000_000,

    activeMetric: "cpu",

    renderingMode: "adaptive",

    data: null,

    statistics: null,

    loading: false,

    error: null,

    generationTimeMs: null,

    initialized: false,

    setSelectedSize: (size) => {
      set({
        selectedSize: size,
      });
    },

    setActiveMetric: (metric) => {
      set({
        activeMetric: metric,
      });
    },

    setRenderingMode: (mode) => {
      

      set({
        renderingMode: mode,
      });
    },

    initialize: (size) => {
      const state = get();

      if (state.initialized) {
        return;
      }

      set({
        initialized: true,
        selectedSize: size,
      });

      void get().generate(size);
    },

    generate: async (size) => {
      const requestId =
        ++latestRequestId;

      console.log(
        "[DashboardStore] GENERATE START:",
        requestId,
        size,
      );

      /*
       * IMPORTANT:
       *
       * Release the currently referenced dataset
       * before requesting a new large dataset.
       *
       * Without this, switching from 1M → 5M can
       * temporarily keep the old dataset alive while
       * the worker allocates the new one.
       *
       * For large workloads this creates a significant
       * memory peak.
       */
      set({
        selectedSize: size,

        data: null,

        statistics: null,

        loading: true,

        error: null,

        generationTimeMs: null,
      });

      /*
       * The previous dataset is no longer referenced
       * by the Zustand store.
       *
       * This gives the browser's garbage collector an
       * opportunity to reclaim the old typed-array
       * buffers before the new dataset arrives.
       */

      try {
        console.log(
          "[DashboardStore] Awaiting worker:",
          requestId,
        );

        const result =
          await telemetryWorker.generate(
            size,
          );

        console.log(
          "[DashboardStore] WORKER PROMISE RESOLVED:",
          requestId,
          result.data.length,
          "points",
        );

        /*
         * A newer generation request may have started
         * while this request was running.
         *
         * Never allow an older dataset to replace a
         * newer dataset.
         */
        if (
          requestId !==
          latestRequestId
        ) {
          console.log(
            "[DashboardStore] Ignoring stale request:",
            requestId,
          );

          return;
        }

        set({
          data: result.data,

          statistics:
            result.statistics,

          loading: false,

          error: null,

          generationTimeMs:
            result.totalTimeMs,
        });

        console.log(
          "[DashboardStore] DATA + STATISTICS APPLIED:",
          {
            requestId,

            points:
              result.data.length,

            loading: false,

            generationTimeMs:
              result.totalTimeMs,

            statistics:
              result.statistics,
          },
        );
      } catch (error) {
        console.error(
          "[DashboardStore] GENERATION ERROR:",
          error,
        );

        if (
          requestId !==
          latestRequestId
        ) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate telemetry data.";

        set({
          data: null,

          statistics: null,

          loading: false,

          error: message,

          generationTimeMs: null,
        });
      }
    },
  }));