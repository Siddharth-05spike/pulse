import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  description: string;
}

export default function MetricCard({
  label,
  value,
  unit,
  change,
  trend,
  icon: Icon,
  description,
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d0d0f] p-5 transition-colors hover:border-white/[0.12]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
            {label}
          </p>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              {value}
            </span>

            {unit && (
              <span className="text-xs font-medium text-zinc-600">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-500">
          <Icon size={16} strokeWidth={1.7} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div
          className={`flex items-center gap-1 text-[11px] font-medium ${
            trend === "up" ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          <TrendIcon size={13} />
          {change}
        </div>

        <span className="text-[10px] text-zinc-700">
          {description}
        </span>
      </div>
    </div>
  );
}