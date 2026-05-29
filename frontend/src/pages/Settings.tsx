import React from "react";
import {
  User,
  Sun,
  Moon,
  Cpu,
  Sliders,
  Database,
  Sparkles,
  Pencil,
  Check,
  X,
  RefreshCw,
  Download,
} from "lucide-react";

import { Page } from "../components/Page";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAppStore } from "../store/useAppStore";
import { downloadJson } from "../utils/storage";
import { useStats, useHealthReady } from "../api/hooks";

const sections = [
  { label: "Profile", icon: User },
  { label: "Appearance", icon: Sun },
  { label: "Model Selection", icon: Cpu },
  { label: "Retrieval & Output", icon: Sliders },
  { label: "Storage & Index", icon: Database },
  { label: "Advanced", icon: Sparkles },
];

export const Settings = () => {
  const [active, setActive] = React.useState(sections[0].label);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const outputFont = useAppStore((state) => state.settings.outputFont);
  const setOutputFont = useAppStore((state) => state.setOutputFont);
  const defaultK = useAppStore((state) => state.settings.defaultK);
  const setDefaultK = useAppStore((state) => state.setDefaultK);
  const devMode = useAppStore((state) => state.devMode);
  const toggleDevMode = useAppStore((state) => state.toggleDevMode);
  const sessions = useAppStore((state) => state.sessions);
  const documents = useAppStore((state) => state.documents);

  const stats = useStats();
  const ready = useHealthReady();

  const statValue = (value: string | number | undefined) => {
    if (stats.isSuccess) {
      return value ?? "Not available";
    }
    if (stats.isError) {
      return "Unavailable";
    }
    return "Loading";
  };

  const [editing, setEditing] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const saveProfile = () => {
    if (!profileDraft.name || !profileDraft.email) {
      return;
    }
    setUser({
      name: profileDraft.name,
      email: profileDraft.email,
      provider: user?.provider ?? "email",
    });
    setEditing(false);
  };

  const exportData = () => {
    downloadJson("ouro-local-export.json", {
      user,
      sessions,
      documents,
      settings: {
        theme,
        outputFont,
        defaultK,
      },
    });
  };

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tailor Ouro to your research workflow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.label}
              type="button"
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                active === section.label ? "bg-muted" : "text-muted-foreground"
              }`}
              onClick={() => setActive(section.label)}
            >
              <span className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                {section.label}
              </span>
            </button>
          ))}
        </div>

        <Card className="p-6">
          {active === "Profile" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Profile</h2>
              {!editing ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={profileDraft.name}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    value={profileDraft.email}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveProfile}>
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {active === "Appearance" ? (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Appearance</h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Theme</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={theme === "light" ? "primary" : "secondary"}
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === "dark" ? "primary" : "secondary"}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Reading Typeface</p>
                <div className="flex flex-wrap gap-2">
                  {(["serif", "sans", "mono"] as const).map((font) => (
                    <Button
                      key={font}
                      size="sm"
                      variant={outputFont === font ? "primary" : "secondary"}
                      onClick={() => setOutputFont(font)}
                    >
                      {font.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {active === "Model Selection" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Model Selection</h2>
              <p className="text-sm text-muted-foreground">
                Ouro uses local Ollama models for synthesis and critique.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Ready: {ready.isSuccess ? "Yes" : ready.isError ? "No" : "Checking"}
                </p>
                <p>Embedding: {statValue(stats.data?.embedding_model)}</p>
                <p>Device: {statValue(stats.data?.embedding_device)}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => stats.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh model status
              </Button>
            </div>
          ) : null}

          {active === "Retrieval & Output" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Retrieval & Output</h2>
              <p className="text-sm text-muted-foreground">
                Control how many chunks Ouro retrieves for each research query.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Retrieval k</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={defaultK}
                  onChange={(event) => setDefaultK(Number(event.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">k = {defaultK}</p>
              </div>
            </div>
          ) : null}

          {active === "Storage & Index" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Storage & Index</h2>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Collection: {statValue(stats.data?.collection_name)}</p>
                <p>Documents indexed: {statValue(stats.data?.document_count)}</p>
                <p>Chunk size: {statValue(stats.data?.chunk_size)}</p>
                <p>Overlap: {statValue(stats.data?.chunk_overlap)}</p>
                <p>Storage path: {statValue(stats.data?.persist_directory)}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Local Data (JSON)
              </Button>
            </div>
          ) : null}

          {active === "Advanced" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Advanced</h2>
              <p className="text-sm text-muted-foreground">
                Enable dev diagnostics and tracing surfaces.
              </p>
              <Button
                variant={devMode ? "primary" : "secondary"}
                size="sm"
                onClick={toggleDevMode}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {devMode ? "Dev Mode Enabled" : "Enable Dev Mode"}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </Page>
  );
};
