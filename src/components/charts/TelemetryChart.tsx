import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import type {
  RenderingMode,
  TelemetryBuffer,
  TelemetryMetric,
} from "../../types/telemetry";

interface TelemetryChartProps {
  data: TelemetryBuffer | null;
  metric: TelemetryMetric;
  renderingMode?: RenderingMode;
  loading?: boolean;
}

const METRIC_CONFIG: Record<
  TelemetryMetric,
  {
    label: string;
    unit: string;
    color: string;
  }
> = {
  cpu: {
    label: "CPU utilization",
    unit: "%",
    color: "#d4d4d8",
  },

  memory: {
    label: "Memory",
    unit: "MB",
    color: "#a1a1aa",
  },

  latency: {
    label: "Latency",
    unit: "ms",
    color: "#f4f4f5",
  },

  throughput: {
    label: "Throughput",
    unit: "events/s",
    color: "#71717a",
  },

  frameTime: {
    label: "Frame time",
    unit: "ms",
    color: "#e4e4e7",
  },
};

function getMetricValue(
  data: TelemetryBuffer,
  metric: TelemetryMetric,
  index: number,
): number {
  return data[metric][index];
}

/**
 * RAW
 *
 * Keeps a limited representation of the source
 * dataset for fine-grained inspection.
 *
 * IMPORTANT:
 * Even "raw" mode never attempts to push millions
 * of points into ECharts.
 */
function createRawSeries(
  data: TelemetryBuffer,
  metric: TelemetryMetric,
): [number, number][] {
  const targetPoints = 5_000;

  if (data.length <= targetPoints) {
    const result: [number, number][] =
      new Array(data.length);

    for (
      let index = 0;
      index < data.length;
      index++
    ) {
      result[index] = [
        data.timestamps[index],
        getMetricValue(
          data,
          metric,
          index,
        ),
      ];
    }

    return result;
  }

  const step = Math.ceil(
    data.length / targetPoints,
  );

  const result: [number, number][] = [];

  for (
    let index = 0;
    index < data.length;
    index += step
  ) {
    result.push([
      data.timestamps[index],
      getMetricValue(
        data,
        metric,
        index,
      ),
    ]);
  }

  return result;
}

/**
 * ADAPTIVE
 *
 * Uses min/max envelope sampling.
 *
 * Instead of simply taking every Nth point,
 * each bucket preserves both the local minimum
 * and local maximum. This retains spikes and
 * drops while keeping the number of chart points
 * very small.
 */
function createAdaptiveSeries(
  data: TelemetryBuffer,
  metric: TelemetryMetric,
): [number, number][] {
  let targetBuckets = 2_000;

  if (data.length >= 5_000_000) {
    targetBuckets = 2_500;
  } else if (data.length >= 1_000_000) {
    targetBuckets = 2_200;
  } else if (data.length >= 500_000) {
    targetBuckets = 2_600;
  }

  if (
    data.length <= targetBuckets
  ) {
    return createRawSeries(
      data,
      metric,
    );
  }

  const bucketSize =
    data.length / targetBuckets;

  /*
   * Maximum visual points are approximately
   * 2 × targetBuckets.
   *
   * For 5M rows:
   *
   *   5,000,000 source points
   *          ↓
   *      2,500 buckets
   *          ↓
   *   ~5,000 visual points
   */
  const result: [number, number][] =
    new Array(
      targetBuckets * 2,
    );

  let resultIndex = 0;

  for (
    let bucket = 0;
    bucket < targetBuckets;
    bucket++
  ) {
    const start = Math.floor(
      bucket * bucketSize,
    );

    const end = Math.min(
      data.length,
      Math.floor(
        (bucket + 1) *
          bucketSize,
      ),
    );

    if (start >= end) {
      continue;
    }

    let minIndex = start;
    let maxIndex = start;

    let minValue =
      getMetricValue(
        data,
        metric,
        start,
      );

    let maxValue = minValue;

    for (
      let index = start + 1;
      index < end;
      index++
    ) {
      const value =
        getMetricValue(
          data,
          metric,
          index,
        );

      if (value < minValue) {
        minValue = value;
        minIndex = index;
      }

      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    }

    if (
      minIndex === maxIndex
    ) {
      result[resultIndex++] = [
        data.timestamps[minIndex],
        minValue,
      ];

      continue;
    }

    if (
      minIndex < maxIndex
    ) {
      result[resultIndex++] = [
        data.timestamps[minIndex],
        minValue,
      ];

      result[resultIndex++] = [
        data.timestamps[maxIndex],
        maxValue,
      ];
    } else {
      result[resultIndex++] = [
        data.timestamps[maxIndex],
        maxValue,
      ];

      result[resultIndex++] = [
        data.timestamps[minIndex],
        minValue,
      ];
    }
  }

  result.length = resultIndex;

  return result;
}

/**
 * AGGREGATED
 *
 * Reduces the entire dataset into a fixed number
 * of averaged time buckets.
 */
function createAggregatedSeries(
  data: TelemetryBuffer,
  metric: TelemetryMetric,
): [number, number][] {
  const targetBuckets = 500;

  if (
    data.length <= targetBuckets
  ) {
    return createRawSeries(
      data,
      metric,
    );
  }

  const bucketSize =
    data.length /
    targetBuckets;

  const result: [number, number][] =
    new Array(
      targetBuckets,
    );

  let resultIndex = 0;

  for (
    let bucket = 0;
    bucket < targetBuckets;
    bucket++
  ) {
    const start = Math.floor(
      bucket * bucketSize,
    );

    const end = Math.min(
      data.length,
      Math.floor(
        (bucket + 1) *
          bucketSize,
      ),
    );

    if (start >= end) {
      continue;
    }

    let sum = 0;

    for (
      let index = start;
      index < end;
      index++
    ) {
      sum +=
        getMetricValue(
          data,
          metric,
          index,
        );
    }

    const average =
      sum / (end - start);

    const middleIndex =
      start +
      Math.floor(
        (end - start) / 2,
      );

    result[resultIndex++] = [
      data.timestamps[
        middleIndex
      ],
      average,
    ];
  }

  result.length = resultIndex;

  return result;
}

function buildSeries(
  data: TelemetryBuffer | null,
  metric: TelemetryMetric,
  renderingMode: RenderingMode,
): [number, number][] {
  if (
    !data ||
    data.length === 0
  ) {
    return [];
  }

  switch (renderingMode) {
    case "raw":
      return createRawSeries(
        data,
        metric,
      );

    case "adaptive":
      return createAdaptiveSeries(
        data,
        metric,
      );

    case "aggregated":
      return createAggregatedSeries(
        data,
        metric,
      );

    default:
      return createAdaptiveSeries(
        data,
        metric,
      );
  }
}

export default function TelemetryChart({
  data,
  metric,
  renderingMode = "adaptive",
  loading = false,
}: TelemetryChartProps) {
  const config =
    METRIC_CONFIG[metric];

  /*
   * IMPORTANT:
   *
   * The expensive downsampling operation is memoized.
   *
   * It only runs again when the actual dataset,
   * selected metric, or rendering mode changes.
   *
   * This prevents unrelated React renders from
   * repeatedly scanning millions of telemetry rows.
   */
  const chartData =
    useMemo(
      () =>
        buildSeries(
          data,
          metric,
          renderingMode,
        ),
      [
        data,
        metric,
        renderingMode,
      ],
    );

  const option: EChartsOption =
    useMemo(
      () => ({
        animation: false,

        backgroundColor:
          "transparent",

        grid: {
          top: 20,
          right: 20,
          bottom: 45,
          left: 55,
        },

        tooltip: {
          trigger: "axis",

          backgroundColor:
            "#111113",

          borderColor:
            "rgba(255,255,255,0.08)",

          textStyle: {
            color: "#d4d4d8",
            fontSize: 11,
          },

          axisPointer: {
            type: "line",
          },

          formatter: (
            params: unknown,
          ) => {
            const items =
              params as Array<{
                value:
                  | [number, number]
                  | undefined;
              }>;

            if (
              !items.length ||
              !items[0].value
            ) {
              return "";
            }

            const [
              timestamp,
              value,
            ] =
              items[0].value;

            return `
              <div style="font-size:10px;color:#71717a">
                ${new Date(
                  timestamp,
                ).toLocaleTimeString()}
              </div>
              <div style="margin-top:4px;font-family:monospace;color:#f4f4f5">
                ${value.toFixed(2)} ${config.unit}
              </div>
            `;
          },
        },

        xAxis: {
          type: "time",

          boundaryGap: [
            0,
            0,
          ],

          axisLine: {
            lineStyle: {
              color:
                "rgba(255,255,255,0.06)",
            },
          },

          axisTick: {
            show: false,
          },

          axisLabel: {
            color: "#52525b",
            fontSize: 9,
          },

          splitLine: {
            show: false,
          },
        },

        yAxis: {
          type: "value",

          scale: true,

          name: config.unit,

          nameTextStyle: {
            color: "#52525b",
            fontSize: 9,
          },

          axisLine: {
            show: false,
          },

          axisTick: {
            show: false,
          },

          axisLabel: {
            color: "#52525b",
            fontSize: 9,
          },

          splitLine: {
            lineStyle: {
              color:
                "rgba(255,255,255,0.035)",
            },
          },
        },

        series: [
          {
            type: "line",

            data: chartData,

            showSymbol: false,

            smooth: false,

            /*
             * The data has already been reduced
             * before reaching ECharts.
             *
             * Additional LTTB sampling would
             * therefore perform redundant work.
             */
            sampling: undefined,

            progressive: 1000,

            progressiveThreshold: 3000,

            lineStyle: {
              width: 1.5,
              color: config.color,
            },

            areaStyle: {
              opacity: 0.04,
            },

            emphasis: {
              disabled: true,
            },
          },
        ],
      }),
      [
        chartData,
        config.unit,
        config.color,
      ],
    );

  return (
    <div className="relative h-full w-full">
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0f]/60 backdrop-blur-[1px]">
          <div className="rounded-lg border border-white/[0.07] bg-[#101012]/95 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />

              <div>
                <p className="text-xs font-medium text-zinc-300">
                  Processing telemetry...
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Rendering{" "}
                  {renderingMode}{" "}
                  workload
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}