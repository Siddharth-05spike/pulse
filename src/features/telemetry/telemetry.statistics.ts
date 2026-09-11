import type { TelemetryBuffer } from "../../types/telemetry";

export interface MetricStatistics {
  average: number;
  min: number;
  max: number;
}

export interface LatencyStatistics {
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputStatistics {
  average: number;
  peak: number;
}

export interface FrameTimeStatistics {
  average: number;
  worst: number;
  budget: number;
}

export interface TelemetryStatistics {
  cpu: MetricStatistics;
  memory: MetricStatistics;
  latency: LatencyStatistics;
  throughput: ThroughputStatistics;
  frameTime: FrameTimeStatistics;
}

/**
 * Calculates an order statistic without creating a sorted copy
 * of the complete telemetry column.
 *
 * This is an in-place quickselect implementation.
 */
function quickSelect(
  values: Float32Array,
  target: number,
): number {
  let left = 0;
  let right = values.length - 1;

  while (left <= right) {
    if (left === right) {
      return values[left];
    }

    const pivotIndex =
      left +
      Math.floor(
        Math.random() *
          (right - left + 1),
      );

    const pivot =
      values[pivotIndex];

    const finalIndex =
      partition(
        values,
        left,
        right,
        pivot,
      );

    if (finalIndex === target) {
      return values[finalIndex];
    }

    if (target < finalIndex) {
      right =
        finalIndex - 1;
    } else {
      left =
        finalIndex + 1;
    }
  }

  return values[target];
}

function partition(
  values: Float32Array,
  left: number,
  right: number,
  pivot: number,
): number {
  let storeIndex = left;

  for (
    let index = left;
    index < right;
    index++
  ) {
    if (
      values[index] < pivot
    ) {
      const temporary =
        values[storeIndex];

      values[storeIndex] =
        values[index];

      values[index] =
        temporary;

      storeIndex++;
    }
  }

  const temporary =
    values[storeIndex];

  values[storeIndex] =
    values[right];

  values[right] =
    temporary;

  return storeIndex;
}

function calculateMetricStatistics(
  values: Float32Array,
): MetricStatistics {
  let sum = 0;
  let minimum =
    Number.POSITIVE_INFINITY;
  let maximum =
    Number.NEGATIVE_INFINITY;

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    const value =
      values[index];

    sum += value;

    if (value < minimum) {
      minimum = value;
    }

    if (value > maximum) {
      maximum = value;
    }
  }

  return {
    average:
      values.length > 0
        ? sum / values.length
        : 0,
    min:
      values.length > 0
        ? minimum
        : 0,
    max:
      values.length > 0
        ? maximum
        : 0,
  };
}

function calculateLatencyStatistics(
  values: Float32Array,
): LatencyStatistics {
  if (values.length === 0) {
    return {
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  /*
   * Only latency needs ordering for the dashboard.
   *
   * We clone ONE column rather than creating copies of
   * every telemetry metric.
   *
   * For 5M rows this is ~20 MB instead of hundreds of MB.
   */
  const working =
    values.slice();

  const p50Index =
    Math.floor(
      (working.length - 1) *
        0.5,
    );

  const p95Index =
    Math.floor(
      (working.length - 1) *
        0.95,
    );

  const p99Index =
    Math.floor(
      (working.length - 1) *
        0.99,
    );

  const p50 =
    quickSelect(
      working,
      p50Index,
    );

  const p95 =
    quickSelect(
      working,
      p95Index,
    );

  const p99 =
    quickSelect(
      working,
      p99Index,
    );

  return {
    p50,
    p95,
    p99,
  };
}

function calculateThroughputStatistics(
  values: Float32Array,
): ThroughputStatistics {
  let sum = 0;
  let peak =
    Number.NEGATIVE_INFINITY;

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    const value =
      values[index];

    sum += value;

    if (value > peak) {
      peak = value;
    }
  }

  return {
    average:
      values.length > 0
        ? sum / values.length
        : 0,
    peak:
      values.length > 0
        ? peak
        : 0,
  };
}

function calculateFrameTimeStatistics(
  values: Float32Array,
): FrameTimeStatistics {
  let sum = 0;
  let worst =
    Number.NEGATIVE_INFINITY;

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    const value =
      values[index];

    sum += value;

    if (value > worst) {
      worst = value;
    }
  }

  return {
    average:
      values.length > 0
        ? sum / values.length
        : 0,
    worst:
      values.length > 0
        ? worst
        : 0,
    budget: 16.67,
  };
}

export function calculateTelemetryStatistics(
  data: TelemetryBuffer,
): TelemetryStatistics {
  return {
    cpu:
      calculateMetricStatistics(
        data.cpu,
      ),

    memory:
      calculateMetricStatistics(
        data.memory,
      ),

    latency:
      calculateLatencyStatistics(
        data.latency,
      ),

    throughput:
      calculateThroughputStatistics(
        data.throughput,
      ),

    frameTime:
      calculateFrameTimeStatistics(
        data.frameTime,
      ),
  };
}