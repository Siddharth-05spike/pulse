import type { PerformanceMetrics } from "../../types/performance";
import type { TelemetryStatistics } from "./telemetry.statistics";

export interface PerformanceScore {
  score: number;
  fpsScore: number;
  frameTimeScore: number;
  workloadScore: number;
  status: "excellent" | "good" | "degraded" | "poor";
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

/**
 * Calculates a frontend runtime performance score.
 *
 * The score deliberately uses measured runtime behavior instead
 * of dataset size. A large dataset should only reduce the score
 * when it actually causes rendering degradation.
 */
export function calculatePerformanceScore(
  runtime: PerformanceMetrics,
  statistics: TelemetryStatistics | null,
): PerformanceScore {
  /*
   * FPS:
   *
   * 60 FPS is treated as the healthy target.
   * Anything at or above 60 receives the full score.
   */
  const fpsScore =
    runtime.fps > 0
      ? clamp(
          (runtime.fps / 60) * 100,
          0,
          100,
        )
      : 0;

  /*
   * Runtime frame time:
   *
   * 16.67ms represents the 60 FPS frame budget.
   * Lower is better.
   */
  const frameTimeScore =
    runtime.frameTime > 0
      ? clamp(
          (16.67 /
            runtime.frameTime) *
            100,
          0,
          100,
        )
      : 0;

  /*
   * Telemetry workload frame time:
   *
   * This represents the generated workload rather than
   * the browser's actual rendering frame time.
   */
  const workloadFrameTime =
    statistics?.frameTime.average ??
    0;

  const workloadScore =
    workloadFrameTime > 0
      ? clamp(
          (16.67 /
            workloadFrameTime) *
            100,
          0,
          100,
        )
      : 0;

  /*
   * If runtime measurements are not ready yet, don't pretend
   * that the application has a meaningful performance score.
   */
  if (
    runtime.fps <= 0 ||
    runtime.frameTime <= 0 ||
    !statistics
  ) {
    return {
      score: 0,
      fpsScore,
      frameTimeScore,
      workloadScore,
      status: "poor",
    };
  }

  /*
   * Weighted score:
   *
   * Runtime FPS       45%
   * Runtime frame     35%
   * Workload frame    20%
   */
  const rawScore =
    fpsScore * 0.45 +
    frameTimeScore * 0.35 +
    workloadScore * 0.2;

  const score = Number(
    clamp(
      rawScore,
      0,
      100,
    ).toFixed(1),
  );

  let status:
    | "excellent"
    | "good"
    | "degraded"
    | "poor";

  if (score >= 95) {
    status = "excellent";
  } else if (score >= 85) {
    status = "good";
  } else if (score >= 70) {
    status = "degraded";
  } else {
    status = "poor";
  }

  return {
    score,
    fpsScore,
    frameTimeScore,
    workloadScore,
    status,
  };
}