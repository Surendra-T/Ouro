import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserProfile = {
  name: string;
  email: string;
  provider: "email" | "google";
  avatarUrl?: string;
};

export type DocumentSource = {
  id: string;
  filename: string;
  filePath: string;
  sizeBytes: number;
  ingestedAt: string;
  pagesIndexed: number;
  chunksIndexed: number;
};

export type RetrievedChunk = {
  content: string;
  metadata: Record<string, unknown>;
};

export type ResearchSession = {
  id: string;
  title: string;
  query: string;
  source: string;
  createdAt: string;
  synthesis: string;
  critique: string;
  supported: boolean;
  retrievedChunks: RetrievedChunk[];
  requestId?: string;
  durationMs?: number;
  tokenEstimate?: number;
};

export type TraceResult = {
  query: string;
  source: string;
  createdAt: string;
  results: RetrievedChunk[];
};

export type SettingsState = {
  defaultK: number;
  outputFont: "serif" | "sans" | "mono";
};

export type AgentState = "idle" | "synthesizing" | "error";

type AppState = {
  user: UserProfile | null;
  theme: "light" | "dark";
  devMode: boolean;
  agentState: AgentState;
  documents: DocumentSource[];
  activeSource: string | null;
  sessions: ResearchSession[];
  activeSessionId: string | null;
  settings: SettingsState;
  trace: TraceResult | null;
  setUser: (user: UserProfile) => void;
  signOut: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleDevMode: () => void;
  setAgentState: (state: AgentState) => void;
  addDocument: (doc: DocumentSource) => void;
  removeDocument: (id: string) => void;
  setActiveSource: (source: string | null) => void;
  addSession: (session: ResearchSession) => void;
  updateSession: (session: ResearchSession) => void;
  setActiveSessionId: (id: string | null) => void;
  removeSession: (id: string) => void;
  setOutputFont: (font: SettingsState["outputFont"]) => void;
  setDefaultK: (value: number) => void;
  setTrace: (trace: TraceResult | null) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      theme: "light",
      devMode: false,
      agentState: "idle",
      documents: [],
      activeSource: null,
      sessions: [],
      activeSessionId: null,
      settings: {
        defaultK: 5,
        outputFont: "serif",
      },
      trace: null,
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null, activeSessionId: null }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      toggleDevMode: () => set({ devMode: !get().devMode }),
      setAgentState: (state) => set({ agentState: state }),
      addDocument: (doc) =>
        set((state) => {
          const documents = [doc, ...state.documents.filter((item) => item.id !== doc.id)];
          return {
            documents,
            activeSource: state.activeSource ?? doc.filePath,
          };
        }),
      removeDocument: (id) =>
        set((state) => {
          const documents = state.documents.filter((doc) => doc.id !== id);
          const activeSource =
            state.activeSource &&
            documents.some((doc) => doc.filePath === state.activeSource)
              ? state.activeSource
              : documents[0]?.filePath ?? null;
          return { documents, activeSource };
        }),
      setActiveSource: (source) => set({ activeSource: source }),
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
          activeSessionId: session.id,
        })),
      updateSession: (session) =>
        set((state) => ({
          sessions: state.sessions.map((item) => (item.id === session.id ? session : item)),
        })),
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),
      setOutputFont: (font) =>
        set((state) => ({
          settings: { ...state.settings, outputFont: font },
        })),
      setDefaultK: (value) =>
        set((state) => ({
          settings: { ...state.settings, defaultK: value },
        })),
      setTrace: (trace) => set({ trace }),
    }),
    {
      name: "ouro-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        devMode: state.devMode,
        documents: state.documents,
        activeSource: state.activeSource,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        settings: state.settings,
        trace: state.trace,
      }),
    }
  )
);
