import { useEffect, useRef, useState } from "react";
import type { PerformanceMetrics } from "../types/performance";

const SAMPLE_INTERVAL_MS = 1000;

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  memoryUsedMb: null,
  memoryLimitMb: null,
};

interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

export function usePerformance(): PerformanceMetrics {
  const [metrics, setMetrics] =
    useState<PerformanceMetrics>(EMPTY_METRICS);

  const frameCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const performanceWithMemory =
      performance as PerformanceWithMemory;

    const updateMetrics = (now: number) => {
      if (!mounted) {
        return;
      }

      frameCountRef.current += 1;

      if (lastFrameRef.current !== null) {
        const frameTime =
          now - lastFrameRef.current;

        if (frameTime > 0 && frameTime < 1000) {
          frameTimesRef.current.push(frameTime);

          if (frameTimesRef.current.length > 120) {
            frameTimesRef.current.shift();
          }
        }
      }

      lastFrameRef.current = now;

      if (lastSampleRef.current === null) {
        lastSampleRef.current = now;
      }

      elapsedRef.current =
        now - lastSampleRef.current;

      if (elapsedRef.current >= SAMPLE_INTERVAL_MS) {
        const fps =
          (frameCountRef.current /
            elapsedRef.current) *
          1000;

        const frameTimes =
          frameTimesRef.current;

        const averageFrameTime =
          frameTimes.length > 0
            ? frameTimes.reduce(
                (sum, value) => sum + value,
                0,
              ) / frameTimes.length
            : 0;

        const memory = performanceWithMemory.memory;

        setMetrics({
          fps: Math.min(120, Math.max(0, fps)),
          frameTime: averageFrameTime,
          memoryUsedMb: memory
            ? memory.usedJSHeapSize /
              (1024 * 1024)
            : null,
          memoryLimitMb: memory
            ? memory.jsHeapSizeLimit /
              (1024 * 1024)
            : null,
        });

        frameCountRef.current = 0;
        lastSampleRef.current = now;
      }

      animationFrameRef.current =
        requestAnimationFrame(updateMetrics);
    };

    animationFrameRef.current =
      requestAnimationFrame(updateMetrics);

    return () => {
      mounted = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );
      }
    };
  }, []);

  return metrics;
}