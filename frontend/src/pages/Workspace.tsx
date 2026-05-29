import React from "react";
import { motion } from "motion/react";

import { Page } from "../components/Page";
import { QueryComposer } from "../components/QueryComposer";
import { ResearchOutput } from "../components/ResearchOutput";
import { EmptyState } from "../components/EmptyState";
import { useResearch, useRetrieve } from "../api/hooks";
import { useAppStore } from "../store/useAppStore";
import { pushToast } from "../components/Toast";
import { truncate } from "../utils/text";
import { buildMarkdownExport } from "../utils/markdown";
import { downloadMarkdown } from "../utils/storage";

export const Workspace = () => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [draft, setDraft] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessions = useAppStore((state) => state.sessions);
  const addSession = useAppStore((state) => state.addSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const activeSource = useAppStore((state) => state.activeSource);
  const defaultK = useAppStore((state) => state.settings.defaultK);
  const setAgentState = useAppStore((state) => state.setAgentState);
  const setTrace = useAppStore((state) => state.setTrace);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;

  const researchMutation = useResearch();
  const retrieveMutation = useRetrieve();

  const runResearch = async () => {
    if (!draft.trim()) {
      return;
    }
    if (!activeSource) {
      pushToast({
        title: "Select a source",
        description: "Upload and select a PDF before running research.",
        tone: "error",
      });
      return;
    }

    const id = crypto.randomUUID();
    const session = {
      id,
      title: truncate(draft, 64),
      query: draft,
      source: activeSource,
      createdAt: new Date().toISOString(),
      synthesis: "",
      critique: "",
      supported: false,
      retrievedChunks: [],
    };

    addSession(session);
    setAgentState("synthesizing");
    setErrorMessage(null);
    setTrace(null);

    try {
      const result = await researchMutation.mutateAsync({
        query: draft,
        source: activeSource,
        k: defaultK,
      });

      updateSession({
        ...session,
        synthesis: result.data.synthesis,
        critique: result.data.critique,
        supported: result.data.supported,
        retrievedChunks: result.data.retrieved_chunks,
        requestId: result.requestId ?? undefined,
        durationMs: result.durationMs,
        tokenEstimate: result.tokenEstimate,
      });
      setAgentState("idle");
      setDraft("");
    } catch (error) {
      setAgentState("error");
      setErrorMessage(error instanceof Error ? error.message : "Research failed");
    }
  };

  const handleGhostAction = async (
    action: "expand" | "opposing" | "trace",
    text: string
  ) => {
    const nextQuery =
      action === "expand"
        ? `Expand on: ${text}`
        : action === "opposing"
        ? `Find opposing evidence for: ${text}`
        : `Trace evidence for: ${text}`;

    if (action === "trace" && activeSource) {
      try {
        const trace = await retrieveMutation.mutateAsync({
          query: text,
          source: activeSource,
          k: defaultK,
        });
        setTrace({
          query: text,
          source: activeSource,
          createdAt: new Date().toISOString(),
          results: trace.results,
        });
        pushToast({
          title: "Trace captured",
          description: "Retriever output is now available in Dev Mode.",
        });
      } catch (error) {
        pushToast({
          title: "Trace failed",
          description: error instanceof Error ? error.message : "Trace failed",
          tone: "error",
        });
      }
    }

    setDraft(nextQuery);
    inputRef.current?.focus();
  };

  const handleCopy = async () => {
    if (!activeSession) {
      return;
    }
    await navigator.clipboard.writeText(activeSession.synthesis || "");
    pushToast({ title: "Copied to clipboard", tone: "success" });
  };

  const handleExportMarkdown = () => {
    if (!activeSession) {
      return;
    }
    const markdown = buildMarkdownExport(activeSession);
    downloadMarkdown(`ouro-${activeSession.id}.md`, markdown);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Ingest. Retrieve. Research.
          </p>
        </div>
      </div>

      {!activeSession ? (
        <EmptyState
          title="Start a new research session"
          description="Ask a question about your indexed documents. Ouro will retrieve and synthesize grounded evidence."
        />
      ) : null}

      {activeSession ? (
        <motion.div
          layoutId={`session-${activeSession.id}`}
          className="space-y-6"
        >
          <ResearchOutput
            session={activeSession}
            loading={researchMutation.isPending}
            error={errorMessage}
            onGhostAction={handleGhostAction}
            onCopy={handleCopy}
            onExportMarkdown={handleExportMarkdown}
            onExportPdf={handleExportPdf}
          />
        </motion.div>
      ) : null}

      <QueryComposer
        value={draft}
        onChange={setDraft}
        onSubmit={runResearch}
        disabled={researchMutation.isPending}
        inputRef={inputRef}
      />
    </Page>
  );
};
