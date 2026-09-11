export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsedMb: number | null;
  memoryLimitMb: number | null;
}