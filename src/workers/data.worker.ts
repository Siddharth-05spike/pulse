import { generateTelemetryData } from "../features/datasets/dataset.generator";
import { calculateTelemetryStatistics } from "../features/telemetry/telemetry.statistics";

import type {
  DatasetSize,
  TelemetryBuffer,
} from "../types/telemetry";

import type {
  TelemetryStatistics,
} from "../features/telemetry/telemetry.statistics";

interface GenerateRequest {
  type: "GENERATE_DATA";
  requestId: number;
  size: DatasetSize;
}

interface SortRequest {
  type: "SORT_INDICES";
  requestId: number;
  indices: Uint32Array;
  values: Float32Array | Float64Array;
  direction: "asc" | "desc";
}

interface SearchRequest {
  type: "SEARCH_DATA";
  requestId: number;
  query: string;
  timestamps: Float64Array;
  cpu: Float32Array;
  memory: Float32Array;
  latency: Float32Array;
  throughput: Float32Array;
  frameTime: Float32Array;
}

type WorkerRequest =
  | GenerateRequest
  | SortRequest
  | SearchRequest;

interface GenerateResponse {
  type: "DATA_READY";
  requestId: number;
  data: TelemetryBuffer;
  statistics: TelemetryStatistics;
}

interface SortResponse {
  type: "SORT_READY";
  requestId: number;
  indices: Uint32Array;
}

interface SearchResponse {
  type: "SEARCH_READY";
  requestId: number;
  indices: Uint32Array;
  totalMatches: number;
}

interface WorkerErrorResponse {
  type: "DATA_ERROR";
  requestId: number;
  message: string;
}

function compareNumbers(
  a: number,
  b: number,
  direction: "asc" | "desc",
): number {
  if (a === b) {
    return 0;
  }

  const result =
    a < b ? -1 : 1;

  return direction === "asc"
    ? result
    : -result;
}

function sortIndices(
  indices: Uint32Array,
  values:
    | Float32Array
    | Float64Array,
  direction: "asc" | "desc",
): Uint32Array {
  const length =
    indices.length;

  let source =
    indices.slice();

  let target =
    new Uint32Array(length);

  for (
    let width = 1;
    width < length;
    width *= 2
  ) {
    for (
      let left = 0;
      left < length;
      left += width * 2
    ) {
      const middle =
        Math.min(
          left + width,
          length,
        );

      const right =
        Math.min(
          left + width * 2,
          length,
        );

      let i = left;
      let j = middle;
      let k = left;

      while (
        i < middle &&
        j < right
      ) {
        const leftIndex =
          source[i];

        const rightIndex =
          source[j];

        const comparison =
          compareNumbers(
            values[leftIndex],
            values[rightIndex],
            direction,
          );

        if (
          comparison <= 0
        ) {
          target[k++] =
            leftIndex;
          i++;
        } else {
          target[k++] =
            rightIndex;
          j++;
        }
      }

      while (i < middle) {
        target[k++] =
          source[i++];
      }

      while (j < right) {
        target[k++] =
          source[j++];
      }
    }

    const swap =
      source;

    source =
      target;

    target =
      swap;
  }

  return source;
}

function matchesNumber(
  value: number,
  query: string,
): boolean {
  return String(
    value,
  ).includes(query);
}

/*
 * Converts a timestamp into the same human-readable
 * time structure shown by the Data Explorer:
 *
 * HH:mm:ss.SSS AM/PM
 *
 * We deliberately avoid Date + toLocaleTimeString()
 * for every row because that is extremely expensive
 * for million-row searches.
 *
 * The timezone offset is calculated once for the
 * search operation and then applied arithmetically.
 */
function createTimestampMatcher(
  sampleTimestamp: number,
): (timestamp: number, query: string) => boolean {
  const sampleDate =
    new Date(sampleTimestamp);

  const timezoneOffsetMs =
    sampleDate.getTimezoneOffset() *
    60_000;

  return (
    timestamp: number,
    query: string,
  ): boolean => {
    /*
     * Convert UTC timestamp into local wall-clock
     * milliseconds using the already-known offset.
     */
    const localTimestamp =
      timestamp -
      timezoneOffsetMs;

    const milliseconds =
      ((localTimestamp % 1000) +
        1000) %
      1000;

    const totalSeconds =
      Math.floor(
        localTimestamp / 1000,
      );

    const seconds =
      ((totalSeconds % 60) +
        60) %
      60;

    const totalMinutes =
      Math.floor(
        totalSeconds / 60,
      );

    const minutes =
      ((totalMinutes % 60) +
        60) %
      60;

    const totalHours =
      Math.floor(
        totalMinutes / 60,
      );

    const hours24 =
      ((totalHours % 24) +
        24) %
      24;

    /*
     * Match the 12-hour clock style used by the
     * Data Explorer UI.
     */
    const hours12 =
      hours24 % 12 || 12;

    const period =
      hours24 >= 12
        ? "PM"
        : "AM";

    const timestampText =
      `${hours12
        .toString()
        .padStart(2, "0")}:` +
      `${minutes
        .toString()
        .padStart(2, "0")}:` +
      `${seconds
        .toString()
        .padStart(2, "0")}.` +
      `${milliseconds
        .toString()
        .padStart(3, "0")} ` +
      period;

    return timestampText
      .toLowerCase()
      .includes(query);
  };
}

function searchTelemetry(
  request: SearchRequest,
): Uint32Array {
  const {
    query,
    timestamps,
    cpu,
    memory,
    latency,
    throughput,
    frameTime,
  } = request;

  const normalizedQuery =
    query.trim().toLowerCase();

  if (!normalizedQuery) {
    const indices =
      new Uint32Array(
        timestamps.length,
      );

    for (
      let i = 0;
      i < indices.length;
      i++
    ) {
      indices[i] = i;
    }

    return indices;
  }

  /*
   * Determine the timezone offset once.
   *
   * The generated dataset represents a continuous
   * telemetry stream around the current time, so using
   * the dataset's first timestamp as the timezone
   * reference avoids creating Date objects for every row.
   */
  const matchesTimestamp =
    createTimestampMatcher(
      timestamps[0],
    );

  const matches =
    new Uint32Array(
      timestamps.length,
    );

  let matchCount = 0;

  for (
    let i = 0;
    i < timestamps.length;
    i++
  ) {
    if (
      matchesTimestamp(
        timestamps[i],
        normalizedQuery,
      ) ||
      matchesNumber(
        cpu[i],
        normalizedQuery,
      ) ||
      matchesNumber(
        memory[i],
        normalizedQuery,
      ) ||
      matchesNumber(
        latency[i],
        normalizedQuery,
      ) ||
      matchesNumber(
        throughput[i],
        normalizedQuery,
      ) ||
      matchesNumber(
        frameTime[i],
        normalizedQuery,
      )
    ) {
      matches[
        matchCount++
      ] = i;
    }
  }

  return matches.slice(
    0,
    matchCount,
  );
}

self.onmessage = (
  event: MessageEvent<WorkerRequest>,
) => {
  const request =
    event.data;

  const operationStart =
    performance.now();

  try {
    if (
      request.type ===
      "GENERATE_DATA"
    ) {
      console.log(
        "[Worker] Generating telemetry dataset:",
        request.size,
      );

      const data =
        generateTelemetryData(
          request.size,
        );

      console.log(
        "[Worker] Dataset generated:",
        data.length,
        "points",
      );

      console.log(
        "[Worker] Calculating telemetry statistics...",
      );

      const statistics =
        calculateTelemetryStatistics(
          data,
        );

      console.log(
        "[Worker] Statistics calculated:",
        statistics,
      );

      const response:
        GenerateResponse = {
        type: "DATA_READY",
        requestId:
          request.requestId,
        data,
        statistics,
      };

      self.postMessage(
        response,
        {
          transfer: [
            data.timestamps
              .buffer as ArrayBuffer,

            data.cpu.buffer as ArrayBuffer,

            data.memory.buffer as ArrayBuffer,

            data.latency.buffer as ArrayBuffer,

            data.throughput.buffer as ArrayBuffer,

            data.frameTime.buffer as ArrayBuffer,
          ],
        },
      );

      console.log(
        "[Worker] DATA_READY sent successfully:",
        request.requestId,
      );

      return;
    }

    if (
      request.type ===
      "SORT_INDICES"
    ) {
      console.log(
        "[Worker] Sorting indices:",
        {
          requestId:
            request.requestId,
          count:
            request.indices.length,
          direction:
            request.direction,
        },
      );

      const indices =
        sortIndices(
          request.indices,
          request.values,
          request.direction,
        );

      const response:
        SortResponse = {
        type: "SORT_READY",
        requestId:
          request.requestId,
        indices,
      };

      self.postMessage(
        response,
        {
          transfer: [
            indices.buffer,
          ],
        },
      );

      console.log(
        "[Worker] Sort complete:",
        {
          requestId:
            request.requestId,
          count:
            indices.length,
          totalTimeMs:
            (
              performance.now() -
              operationStart
            ).toFixed(2),
        },
      );

      return;
    }

    if (
      request.type ===
      "SEARCH_DATA"
    ) {
      console.log(
        "[Worker] Searching telemetry dataset:",
        {
          requestId:
            request.requestId,
          query:
            request.query,
          rows:
            request.timestamps
              .length,
        },
      );

      const indices =
        searchTelemetry(
          request,
        );

      const totalTimeMs =
        performance.now() -
        operationStart;

      const response:
        SearchResponse = {
        type: "SEARCH_READY",
        requestId:
          request.requestId,
        indices,
        totalMatches:
          indices.length,
      };

      self.postMessage(
        response,
        {
          transfer: [
            indices.buffer,
          ],
        },
      );

      console.log(
        "[Worker] Search complete:",
        {
          requestId:
            request.requestId,
          matches:
            indices.length,
          workerTimeMs:
            totalTimeMs.toFixed(2),
        },
      );

      return;
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Telemetry worker operation failed.";

    console.error(
      "[Worker] Operation failed:",
      error,
    );

    const response:
      WorkerErrorResponse = {
      type: "DATA_ERROR",
      requestId:
        request.requestId,
      message,
    };

    self.postMessage(
      response,
    );
  }
};

export {};