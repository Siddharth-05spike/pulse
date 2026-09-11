import type {
  DatasetSize,
  TelemetryBuffer,
} from "../../types/telemetry";

/**
 * Generates a high-volume telemetry dataset using typed arrays.
 *
 * Columnar storage keeps each metric in its own contiguous memory block,
 * which is considerably more memory-efficient than millions of JS objects.
 */
export function generateTelemetryData(size: DatasetSize): TelemetryBuffer {
  const startTime = performance.now();

  const timestamps = new Float64Array(size);
  const cpu = new Float32Array(size);
  const memory = new Float32Array(size);
  const latency = new Float32Array(size);
  const throughput = new Float32Array(size);
  const frameTime = new Float32Array(size);

  const baseTimestamp = Date.now();
  const interval = 1000 / 60;

  for (let i = 0; i < size; i++) {
    const time = i * interval;
    const wave = Math.sin(i * 0.018);
    const secondaryWave = Math.sin(i * 0.0047);

    timestamps[i] = baseTimestamp + time;

    cpu[i] =
      45 +
      wave * 12 +
      secondaryWave * 7 +
      Math.random() * 4;

    memory[i] =
      32 +
      Math.sin(i * 0.006) * 3 +
      Math.random() * 1.5;

    latency[i] =
      12 +
      Math.abs(Math.sin(i * 0.012)) * 14 +
      Math.random() * 3;

    throughput[i] =
      7500 +
      Math.sin(i * 0.01) * 900 +
      Math.random() * 500;

    frameTime[i] =
      16.67 +
      Math.sin(i * 0.02) * 1.8 +
      Math.random() * 0.8;
  }

  const generationTimeMs = performance.now() - startTime;

  return {
    timestamps,
    cpu,
    memory,
    latency,
    throughput,
    frameTime,
    length: size,
    generationTimeMs,
  };
}