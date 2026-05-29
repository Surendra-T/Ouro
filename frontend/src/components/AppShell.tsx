import { Outlet } from "react-router-dom";

import { AuroraBackground } from "./AuroraBackground";
import { TopBar } from "./TopBar";
import { DevModePanel } from "./DevModePanel";
import { useAppStore } from "../store/useAppStore";

export const AppShell = () => {
  const devMode = useAppStore((state) => state.devMode);
  const agentState = useAppStore((state) => state.agentState);
  const backgroundState = devMode
    ? "dev"
    : agentState === "synthesizing"
    ? "active"
    : "idle";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      data-devmode={devMode ? "true" : "false"}
    >
      <AuroraBackground state={backgroundState} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar />
        <main className="mx-auto flex-1 w-full max-w-[1200px] px-8 pb-12 pt-6">
          <Outlet />
        </main>
        <footer className="print-hidden px-8 pb-6 text-xs text-muted-foreground">
          All rights reserved. Copyright © 2026 Surendra Tripathi.
        </footer>
      </div>
      <DevModePanel open={devMode} />
    </div>
  );
};
