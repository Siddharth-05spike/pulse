import {
  Activity,
  BarChart3,
  Database,
  Gauge,
} from "lucide-react";

import type { AppPage } from "../../App";

interface TopBarProps {
  activePage: AppPage;
}

const PAGE_META: Record<
  AppPage,
  {
    label: string;
    icon: typeof Gauge;
  }
> = {
  overview: {
    label: "Performance Overview",
    icon: Gauge,
  },

  telemetry: {
    label: "Telemetry",
    icon: Activity,
  },

  explorer: {
    label: "Data Explorer",
    icon: Database,
  },

  performance: {
    label: "Performance Analysis",
    icon: BarChart3,
  },
};

export default function TopBar({
  activePage,
}: TopBarProps) {
  const page = PAGE_META[activePage];
  const Icon = page.icon;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/95 px-4 pl-16 backdrop-blur-xl sm:min-h-20 sm:px-7 sm:pl-20 lg:pl-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] sm:flex">
          <Icon
            size={14}
            strokeWidth={1.6}
            className="text-zinc-500"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-zinc-700">
            Workspace
          </p>

          <p className="mt-0.5 truncate text-sm font-medium text-zinc-300">
            {page.label}
          </p>
        </div>
      </div>

      <div className="ml-4 flex shrink-0 items-center">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2 sm:px-3">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

          <span className="hidden text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600 sm:inline">
            System online
          </span>

          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-emerald-400 sm:hidden">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}