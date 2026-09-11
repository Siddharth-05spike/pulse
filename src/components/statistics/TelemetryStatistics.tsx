import {
  Activity,
  Cpu,
  Gauge,
  MemoryStick,
  Timer,
  Zap,
} from "lucide-react";

import type {
  TelemetryStatistics as TelemetryStatisticsData,
} from "../../features/telemetry/telemetry.statistics";

interface TelemetryStatisticsProps {
  statistics:
    | TelemetryStatisticsData
    | null;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({
  label,
  value,
}: StatItemProps) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 font-mono text-xs text-zinc-300">
        {value}
      </p>
    </div>
  );
}

interface StatisticsCardProps {
  title: string;
  description: string;
  icon: typeof Cpu;
  children: React.ReactNode;
}

function StatisticsCard({
  title,
  description,
  icon: Icon,
  children,
}: StatisticsCardProps) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon
              size={14}
              strokeWidth={1.6}
              className="text-zinc-600"
            />

            <p className="text-xs font-medium text-zinc-300">
              {title}
            </p>
          </div>

          <p className="mt-1 text-[9px] text-zinc-700">
            {description}
          </p>
        </div>

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

function formatNumber(
  value: number,
  digits = 2,
): string {
  return value.toFixed(digits);
}

function formatThroughput(
  value: number,
): string {
  return Math.round(
    value,
  ).toLocaleString();
}

export default function TelemetryStatistics({
  statistics,
}: TelemetryStatisticsProps) {
  if (!statistics) {
    return (
      <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
        <div className="border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-2">
            <Activity
              size={15}
              strokeWidth={1.6}
              className="text-zinc-600"
            />

            <h3 className="text-sm font-medium text-zinc-200">
              Telemetry statistics
            </h3>
          </div>

          <p className="mt-1 text-xs text-zinc-600">
            Statistical analysis of the active telemetry buffer
          </p>
        </div>

        <div className="flex h-32 items-center justify-center">
          <p className="text-[10px] text-zinc-700">
            Generate a dataset to calculate statistics.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f]">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity
              size={15}
              strokeWidth={1.6}
              className="text-zinc-600"
            />

            <h3 className="text-sm font-medium text-zinc-200">
              Telemetry statistics
            </h3>

            <span className="rounded-md border border-emerald-500/10 bg-emerald-500/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              COMPUTED
            </span>
          </div>

          <p className="mt-1 text-xs text-zinc-600">
            Statistical analysis of the active telemetry buffer
          </p>
        </div>

        <div className="flex items-center gap-2 text-[9px] text-zinc-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Calculated in Web Worker
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        {/* CPU */}
        <StatisticsCard
          title="CPU"
          description="Utilization distribution"
          icon={Cpu}
        >
          <StatItem
            label="Average"
            value={`${formatNumber(
              statistics.cpu.average,
            )}%`}
          />

          <StatItem
            label="Min"
            value={`${formatNumber(
              statistics.cpu.min,
            )}%`}
          />

          <StatItem
            label="Max"
            value={`${formatNumber(
              statistics.cpu.max,
            )}%`}
          />
        </StatisticsCard>

        {/* Memory */}
        <StatisticsCard
          title="Memory"
          description="Telemetry memory signal"
          icon={MemoryStick}
        >
          <StatItem
            label="Average"
            value={`${formatNumber(
              statistics.memory.average,
            )} MB`}
          />

          <StatItem
            label="Min"
            value={`${formatNumber(
              statistics.memory.min,
            )} MB`}
          />

          <StatItem
            label="Max"
            value={`${formatNumber(
              statistics.memory.max,
            )} MB`}
          />
        </StatisticsCard>

        {/* Latency */}
        <StatisticsCard
          title="Latency"
          description="Response-time percentiles"
          icon={Timer}
        >
          <StatItem
            label="P50"
            value={`${formatNumber(
              statistics.latency.p50,
            )} ms`}
          />

          <StatItem
            label="P95"
            value={`${formatNumber(
              statistics.latency.p95,
            )} ms`}
          />

          <StatItem
            label="P99"
            value={`${formatNumber(
              statistics.latency.p99,
            )} ms`}
          />
        </StatisticsCard>

        {/* Throughput */}
        <StatisticsCard
          title="Throughput"
          description="Event processing rate"
          icon={Zap}
        >
          <StatItem
            label="Average"
            value={`${formatThroughput(
              statistics.throughput.average,
            )}`}
          />

          <StatItem
            label="Peak"
            value={`${formatThroughput(
              statistics.throughput.peak,
            )}`}
          />

          <StatItem
            label="Unit"
            value="events/s"
          />
        </StatisticsCard>

        {/* Frame time */}
        <StatisticsCard
          title="Frame time"
          description="Rendering timing"
          icon={Gauge}
        >
          <StatItem
            label="Average"
            value={`${formatNumber(
              statistics.frameTime.average,
            )} ms`}
          />

          <StatItem
            label="Worst"
            value={`${formatNumber(
              statistics.frameTime.worst,
            )} ms`}
          />

          <StatItem
            label="Budget"
            value="16.67 ms"
          />
        </StatisticsCard>
      </div>
    </section>
  );
}