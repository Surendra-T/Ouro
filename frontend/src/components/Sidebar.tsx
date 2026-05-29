import { NavLink } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  History,
  Settings,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

import { LogoMark } from "./LogoMark";
import { UploadButton } from "./UploadButton";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../utils/cn";

const navLinkBase =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition";

export const Sidebar = () => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const devMode = useAppStore((state) => state.devMode);
  const toggleDevMode = useAppStore((state) => state.toggleDevMode);
  return (
    <aside className="print-hidden hidden w-64 flex-shrink-0 border-r border-line/60 bg-card p-5 backdrop-blur-xl md:flex md:flex-col">
      <div className="flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="text-sm font-medium">Ouro</p>
          <p className="text-xs text-muted-foreground">Ingest. Retrieve. Research.</p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Menu
        </p>
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              navLinkBase,
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>
        <NavLink
          to="/workspace"
          className={({ isActive }) =>
            cn(
              navLinkBase,
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )
          }
        >
          <LayoutGrid className="h-4 w-4" />
          Workspace
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            cn(
              navLinkBase,
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )
          }
        >
          <History className="h-4 w-4" />
          History
        </NavLink>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Sources
        </p>
        <UploadButton
          label="Upload PDF"
          variant="secondary"
          size="sm"
          className="w-full"
        />
      </div>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={toggleDevMode}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
            devMode
              ? "border-foreground text-foreground"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Dev Mode
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              navLinkBase,
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};
