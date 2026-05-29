import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  History,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { LogoMark } from "./LogoMark";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../utils/cn";

export const TopBar = () => {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const signOut = useAppStore((state) => state.signOut);
  const devMode = useAppStore((state) => state.devMode);
  const toggleDevMode = useAppStore((state) => state.toggleDevMode);
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OU";

  const handleSignOut = () => {
    signOut();
    navigate("/welcome");
  };

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/workspace", label: "Workspace", icon: LayoutGrid },
    { to: "/history", label: "History", icon: History },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="print-hidden sticky top-0 z-30 border-b border-line/60 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <LogoMark className="h-9 w-9" />
          <div className="leading-tight">
            <p className="text-sm font-medium">Ouro</p>
            <p className="text-xs text-muted-foreground">
              Ingest. Retrieve. Research.
            </p>
          </div>
        </NavLink>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-xs transition",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleDevMode}
            className={cn(
              "flex items-center gap-2 rounded-full border border-line/70 px-3 py-2 text-xs",
              devMode ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Dev Mode
          </button>

          <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-line/70 bg-background/80 px-2 py-1 text-xs text-muted-foreground"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                {initials}
              </span>
            )}
            <ChevronDown className="h-4 w-4" />
          </button>
          {open ? (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-line/70 bg-card p-3 text-xs shadow-lux">
              <div className="flex items-center gap-2 border-b border-line/60 pb-3">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user?.name ?? "Local User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>
              <NavLink
                to="/settings"
                className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </NavLink>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-rose-500 hover:bg-muted"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
