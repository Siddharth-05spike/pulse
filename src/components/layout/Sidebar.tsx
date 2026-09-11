import {
  Activity,
  BarChart3,
  Database,
  Gauge,
  Menu,
  Radio,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import type { AppPage } from "../../App";

interface SidebarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const NAVIGATION: {
  label: string;
  page: AppPage;
  description: string;
  icon: typeof Activity;
}[] = [
  {
    label: "Overview",
    page: "overview",
    description: "System summary",
    icon: Gauge,
  },
  {
    label: "Telemetry",
    page: "telemetry",
    description: "Live visualization",
    icon: Activity,
  },
  {
    label: "Data Explorer",
    page: "explorer",
    description: "Dataset inspection",
    icon: Database,
  },
  {
    label: "Performance",
    page: "performance",
    description: "Runtime analysis",
    icon: BarChart3,
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
        <Zap size={20} strokeWidth={2.2} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-zinc-100">
          PULSE
        </p>

        <p className="mt-0.5 truncate text-[10px] text-zinc-600">
          Performance Intelligence
        </p>
      </div>
    </div>
  );
}

function Navigation({
  activePage,
  onNavigate,
  onClose,
}: SidebarProps & {
  onClose?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAVIGATION.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.page;

        return (
          <button
            key={item.page}
            type="button"
            onClick={() => {
              onNavigate(item.page);
              onClose?.();
            }}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
              active
                ? "bg-white/[0.08] text-zinc-100"
                : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zinc-300" />
            )}

            <Icon
              size={18}
              strokeWidth={1.6}
              className={
                active
                  ? "text-zinc-200"
                  : "text-zinc-600 transition group-hover:text-zinc-400"
              }
            />

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  active
                    ? "font-medium text-zinc-100"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {item.label}
              </p>

              <p
                className={`mt-0.5 text-[9px] ${
                  active ? "text-zinc-600" : "text-zinc-700"
                }`}
              >
                {item.description}
              </p>
            </div>

            {item.page === "telemetry" && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active
                      ? "animate-pulse bg-emerald-400"
                      : "bg-emerald-400"
                  }`}
                />
              </span>
            )}

            {item.page === "explorer" && (
              <span className="shrink-0 font-mono text-[8px] text-zinc-700">
                5M
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function SystemStatus() {
  return (
    <div className="border-t border-white/[0.06] p-4">
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              size={13}
              strokeWidth={1.6}
              className="text-zinc-600"
            />

            <span className="text-[10px] text-zinc-600">
              Pipeline
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-medium text-emerald-400">
              ONLINE
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[9px]">
          <span className="text-zinc-700">
            Processing
          </span>

          <span className="font-mono text-zinc-500">
            Worker
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-white/[0.06] bg-[#09090b] lg:flex xl:w-[326px]">
        <div className="flex h-20 shrink-0 items-center border-b border-white/[0.06] px-5">
          <Brand />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-7">
          <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-700">
            Workspace
          </p>

          <Navigation
            activePage={activePage}
            onNavigate={onNavigate}
          />
        </div>

        <SystemStatus />
      </aside>

      {/* Mobile / tablet trigger */}
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-[#101012]/95 text-zinc-400 shadow-xl backdrop-blur-xl transition hover:border-white/[0.14] hover:text-zinc-200 lg:hidden"
      >
        <Menu size={17} strokeWidth={1.7} />
      </button>

      {/* Mobile / tablet navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <aside className="relative flex h-full w-[min(86vw,340px)] flex-col border-r border-white/[0.07] bg-[#09090b] shadow-2xl">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
              <Brand />

              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
              >
                <X size={16} strokeWidth={1.7} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-7">
              <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-700">
                Workspace
              </p>

              <Navigation
                activePage={activePage}
                onNavigate={onNavigate}
                onClose={() => setMobileOpen(false)}
              />
            </div>

            <SystemStatus />
          </aside>
        </div>
      )}
    </>
  );
}