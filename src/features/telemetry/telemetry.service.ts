import type {
  DatasetSize,
  TelemetryBuffer,
} from "../../types/telemetry";

import type {
  TelemetryStatistics,
} from "./telemetry.statistics";

export interface TelemetryGenerationResult {
  data: TelemetryBuffer;
  statistics: TelemetryStatistics;
  totalTimeMs: number;
}

export interface TelemetrySearchResult {
  indices: Uint32Array;
  totalMatches: number;
  totalTimeMs: number;
}

export interface TelemetrySortResult {
  indices: Uint32Array;
  totalTimeMs: number;
}

interface WorkerDataResponse {
  type: "DATA_READY";
  requestId: number;
  data: TelemetryBuffer;
  statistics: TelemetryStatistics;
}

interface WorkerSortResponse {
  type: "SORT_READY";
  requestId: number;
  indices: Uint32Array;
}

interface WorkerErrorResponse {
  type: "DATA_ERROR";
  requestId: number;
  message: string;
}

type WorkerResponse =
  | WorkerDataResponse
  | WorkerSortResponse
  | WorkerErrorResponse;

interface PendingGeneration {
  operation: "generate";
  resolve: (
    result: TelemetryGenerationResult,
  ) => void;
  reject: (
    error: Error,
  ) => void;
  startTime: number;
}

interface PendingSort {
  operation: "sort";
  resolve: (
    result: TelemetrySortResult,
  ) => void;
  reject: (
    error: Error,
  ) => void;
  startTime: number;
}

type PendingRequest =
  | PendingGeneration
  | PendingSort;

const SEARCH_CHUNK_SIZE = 100_000;

function formatTimestamp(
  timestamp: number,
): string {
  return new Date(
    timestamp,
  )
    .toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      },
    )
    .toLowerCase();
}

function matchesValue(
  value: number,
  query: string,
): boolean {
  return String(value).includes(
    query,
  );
}

function rowMatchesQuery(
  data: TelemetryBuffer,
  index: number,
  query: string,
): boolean {
  if (
    formatTimestamp(
      data.timestamps[index],
    ).includes(query)
  ) {
    return true;
  }

  if (
    matchesValue(
      data.cpu[index],
      query,
    )
  ) {
    return true;
  }

  if (
    matchesValue(
      data.memory[index],
      query,
    )
  ) {
    return true;
  }

  if (
    matchesValue(
      data.latency[index],
      query,
    )
  ) {
    return true;
  }

  if (
    matchesValue(
      data.throughput[index],
      query,
    )
  ) {
    return true;
  }

  if (
    matchesValue(
      data.frameTime[index],
      query,
    )
  ) {
    return true;
  }

  return false;
}

async function searchDataset(
  data: TelemetryBuffer,
  query: string,
): Promise<
  TelemetrySearchResult
> {
  const startTime =
    performance.now();

  const normalizedQuery =
    query.trim().toLowerCase();

  if (!normalizedQuery) {
    const indices =
      new Uint32Array(
        data.length,
      );

    for (
      let index = 0;
      index < data.length;
      index++
    ) {
      indices[index] =
        index;
    }

    return {
      indices,
      totalMatches:
        data.length,
      totalTimeMs:
        performance.now() -
        startTime,
    };
  }

  /*
   * Search is deliberately performed
   * without copying the telemetry buffers.
   *
   * The previous implementation cloned:
   *
   *   timestamps
   *   cpu
   *   memory
   *   latency
   *   throughput
   *   frameTime
   *
   * For a 5M dataset that creates roughly
   * 140 MB of temporary typed-array data.
   *
   * This implementation scans the existing
   * columnar dataset in small chunks and yields
   * to the browser between chunks so the UI
   * remains responsive.
   */

  const matches =
    new Uint32Array(
      data.length,
    );

  let matchCount = 0;

  for (
    let chunkStart = 0;
    chunkStart < data.length;
    chunkStart +=
      SEARCH_CHUNK_SIZE
  ) {
    const chunkEnd =
      Math.min(
        chunkStart +
          SEARCH_CHUNK_SIZE,
        data.length,
      );

    for (
      let index = chunkStart;
      index < chunkEnd;
      index++
    ) {
      if (
        rowMatchesQuery(
          data,
          index,
          normalizedQuery,
        )
      ) {
        matches[matchCount] =
          index;

        matchCount++;
      }
    }

    /*
     * Give the browser a chance to
     * process rendering/input events.
     *
     * This avoids blocking the main
     * thread for the entire 5M scan.
     */
    if (chunkEnd < data.length) {
      await new Promise<void>(
        (resolve) => {
          setTimeout(
            resolve,
            0,
          );
        },
      );
    }
  }

  const indices =
    matches.slice(
      0,
      matchCount,
    );

  return {
    indices,
    totalMatches:
      matchCount,
    totalTimeMs:
      performance.now() -
      startTime,
  };
}

class TelemetryWorkerService {
  private worker: Worker | null =
    null;

  private requestId = 0;

  private pendingRequests =
    new Map<
      number,
      PendingRequest
    >();

  private getWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    console.log(
      "[TelemetryService] Creating worker",
    );

    const worker =
      new Worker(
        new URL(
          "../../workers/data.worker.ts",
          import.meta.url,
        ),
        {
          type: "module",
        },
      );

    worker.onmessage = (
      event: MessageEvent<WorkerResponse>,
    ) => {
      const response =
        event.data;

      

      const pending =
        this.pendingRequests.get(
          response.requestId,
        );

      if (!pending) {
        console.warn(
          "[TelemetryService] No pending request found:",
          response.requestId,
        );

        return;
      }

      this.pendingRequests.delete(
        response.requestId,
      );

      if (
        response.type ===
        "DATA_ERROR"
      ) {
        pending.reject(
          new Error(
            response.message,
          ),
        );

        return;
      }

      if (
        response.type ===
        "DATA_READY"
      ) {
        if (
          pending.operation !==
          "generate"
        ) {
          pending.reject(
            new Error(
              "Unexpected DATA_READY response.",
            ),
          );

          return;
        }

        const totalTimeMs =
          performance.now() -
          pending.startTime;

        pending.resolve({
          data:
            response.data,
          statistics:
            response.statistics,
          totalTimeMs,
        });

        return;
      }

      if (
        response.type ===
        "SORT_READY"
      ) {
        if (
          pending.operation !==
          "sort"
        ) {
          pending.reject(
            new Error(
              "Unexpected SORT_READY response.",
            ),
          );

          return;
        }

        const totalTimeMs =
          performance.now() -
          pending.startTime;

        pending.resolve({
          indices:
            response.indices,
          totalTimeMs,
        });
      }
    };

    worker.onerror = (
      event,
    ) => {
      console.error(
        "[TelemetryService] Worker error:",
        event,
      );

      const error =
        event.error instanceof Error
          ? event.error
          : new Error(
              "Telemetry worker failed.",
            );

      for (const pending of this
        .pendingRequests.values()) {
        pending.reject(error);
      }

      this.pendingRequests.clear();

      this.worker?.terminate();

      this.worker = null;
    };

    this.worker =
      worker;

    console.log(
      "[TelemetryService] Worker created successfully",
    );

    return worker;
  }

  generate(
    size: DatasetSize,
  ): Promise<TelemetryGenerationResult> {
    return new Promise(
      (
        resolve,
        reject,
      ) => {
        const requestId =
          ++this.requestId;

        const startTime =
          performance.now();

        this.pendingRequests.set(
          requestId,
          {
            operation:
              "generate",
            resolve,
            reject,
            startTime,
          },
        );

        try {
          this.getWorker().postMessage(
            {
              type:
                "GENERATE_DATA",
              requestId,
              size,
            },
          );
        } catch (error) {
          this.pendingRequests.delete(
            requestId,
          );

          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Failed to send telemetry request.",
                ),
          );
        }
      },
    );
  }

  sort(
    indices: Uint32Array,
    values:
      | Float32Array
      | Float64Array,
    direction:
      | "asc"
      | "desc",
  ): Promise<TelemetrySortResult> {
    return new Promise(
      (
        resolve,
        reject,
      ) => {
        const requestId =
          ++this.requestId;

        const startTime =
          performance.now();

        this.pendingRequests.set(
          requestId,
          {
            operation: "sort",
            resolve,
            reject,
            startTime,
          },
        );

        try {
          /*
           * Sorting still uses the worker.
           *
           * Only the selected value column
           * and index array are copied.
           *
           * This is substantially smaller than
           * copying the complete 5M dataset.
           */
          const indexCopy =
            indices.slice();

          const valueCopy =
            values.slice();

          this.getWorker().postMessage(
            {
              type:
                "SORT_INDICES",
              requestId,
              indices:
                indexCopy,
              values:
                valueCopy,
              direction,
            },
            {
              transfer: [
                indexCopy.buffer,
                valueCopy.buffer,
              ],
            },
          );
        } catch (error) {
          this.pendingRequests.delete(
            requestId,
          );

          reject(
            error instanceof Error
              ? error
              : new Error(
                  "Failed to send sort request.",
                ),
          );
        }
      },
    );
  }

  search(
    data: TelemetryBuffer,
    query: string,
  ): Promise<TelemetrySearchResult> {
    /*
     * IMPORTANT:
     *
     * Search no longer sends the dataset
     * to the worker.
     *
     * This prevents the previous implementation
     * from creating ~140 MB of temporary copies
     * for a 5M dataset.
     */
    return searchDataset(
      data,
      query,
    );
  }

  dispose(): void {
    console.log(
      "[TelemetryService] Disposing worker",
    );

    this.worker?.terminate();

    this.worker = null;

    for (const pending of this
      .pendingRequests.values()) {
      pending.reject(
        new Error(
          "Telemetry worker was disposed.",
        ),
      );
    }

    this.pendingRequests.clear();
  }
}

export const telemetryWorker =
  new TelemetryWorkerService();