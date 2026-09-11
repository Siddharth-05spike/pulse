import type { ReactNode } from "react";

import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";

import type { AppPage } from "../App";

interface AppShellProps {
  children: ReactNode;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export default function AppShell({
  children,
  activePage,
  onNavigate,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar activePage={activePage} />

        <main className="min-w-0 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}