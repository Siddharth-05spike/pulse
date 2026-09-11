export interface TelemetryPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  latency: number;
  throughput: number;
  frameTime: number;
}

export interface TelemetryBuffer {
  timestamps: Float64Array;
  cpu: Float32Array;
  memory: Float32Array;
  latency: Float32Array;
  throughput: Float32Array;
  frameTime: Float32Array;
  length: number;
  generationTimeMs: number;
}

export interface TelemetryDataset {
  data: TelemetryBuffer;
  generatedAt: number;
  generationTimeMs: number;
}

export type DatasetSize =
  | 100_000
  | 500_000
  | 1_000_000
  | 5_000_000;

export type TelemetryMetric =
  | "cpu"
  | "memory"
  | "latency"
  | "throughput"
  | "frameTime";

export type RenderingMode =
  | "raw"
  | "adaptive"
  | "aggregated";