import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";

import { useAppStore } from "../store/useAppStore";
import { useHealthReady, useStats } from "../api/hooks";

export const DevModePanel = ({ open }: { open: boolean }) => {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const trace = useAppStore((state) => state.trace);
  const documents = useAppStore((state) => state.documents);
  const agentState = useAppStore((state) => state.agentState);
  const toggleDevMode = useAppStore((state) => state.toggleDevMode);
  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;

  const stats = useStats();
  const ready = useHealthReady();

  const tokenRate =
    activeSession?.tokenEstimate && activeSession?.durationMs
      ? activeSession.tokenEstimate / (activeSession.durationMs / 1000)
      : null;

  const readyStatus = ready.isSuccess
    ? "Ready"
    : ready.isError
    ? "Unavailable"
    : "Checking";

  const retrieverStatus = activeSession?.retrievedChunks?.length
    ? "Complete"
    : agentState === "synthesizing"
    ? "Running"
    : "Idle";
  const synthesizerStatus = activeSession?.synthesis
    ? "Complete"
    : agentState === "synthesizing"
    ? "Running"
    : "Idle";
  const criticStatus = activeSession?.critique
    ? "Complete"
    : agentState === "synthesizing"
    ? "Running"
    : "Idle";

  const statValue = (value: string | number | undefined) => {
    if (stats.isSuccess) {
      return value ?? "Not available";
    }
    if (stats.isError) {
      return "Unavailable";
    }
    return "Loading";
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="print-hidden fixed right-0 top-0 z-40 h-full w-[360px] overflow-y-auto border-l border-line/60 bg-background p-5 shadow-soft-dark"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
        >
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Dev Mode</h2>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-line/60 px-2 py-1 text-[11px] text-muted-foreground"
                onClick={toggleDevMode}
              >
                Hide
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {!documents.length ? (
              <div className="rounded-xl border border-line/60 bg-card p-3 text-xs">
                <p className="mt-1 text-muted-foreground">
                  No documents indexed yet. Upload and ingest a PDF to unlock pipeline traces.
                </p>
              </div>
            ) : null}
            <div>
              <h3 className="text-sm font-medium">System</h3>
              <div className="mt-3 space-y-1 text-muted-foreground">
                <p>Readiness: {readyStatus}</p>
                <p>Request ID: {activeSession?.requestId ?? "Not available"}</p>
                <p>
                  Duration: {activeSession?.durationMs
                    ? `${activeSession.durationMs.toFixed(0)} ms`
                    : "Not available"}
                </p>
                <p>Tokens: {activeSession?.tokenEstimate ?? "Not available"}</p>
                <p>Tokens/sec: {tokenRate ? tokenRate.toFixed(1) : "Not available"}</p>
              </div>
              {ready.isSuccess ? (
                <div className="mt-3 space-y-1 rounded-xl border border-line/60 bg-card p-3 text-[11px] text-muted-foreground">
                  <p>Vector store: {ready.data.checks.vector_store?.status ?? "Unknown"}</p>
                  <p>Ollama: {ready.data.checks.ollama?.status ?? "Unknown"}</p>
                </div>
              ) : null}
            </div>

            <div>
              <h3 className="text-sm font-medium">Collection</h3>
              <div className="mt-3 space-y-1 text-muted-foreground">
                <p>Docs: {statValue(stats.data?.document_count)}</p>
                <p>Chunk size: {statValue(stats.data?.chunk_size)}</p>
                <p>Overlap: {statValue(stats.data?.chunk_overlap)}</p>
                <p>Embedding: {statValue(stats.data?.embedding_model)}</p>
                <p>Device: {statValue(stats.data?.embedding_device)}</p>
                <p>Storage: {statValue(stats.data?.persist_directory)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Chunks</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeSession?.retrievedChunks?.length
                  ? activeSession.retrievedChunks.map((chunk, index) => {
                      const distance = Number(
                        (chunk.metadata as { distance?: number }).distance ?? 1
                      );
                      const similarity = Math.max(0, 1 - distance);
                      const tone =
                        similarity > 0.7
                          ? "bg-emerald-400/70"
                          : similarity > 0.4
                          ? "bg-amber-400/70"
                          : "bg-rose-400/70";
                      return (
                        <span
                          key={`viz-${index}`}
                          className={`h-3 w-3 rounded-sm ${tone}`}
                          title={`Similarity ${(similarity * 100).toFixed(0)}%`}
                        />
                      );
                    })
                  : null}
                {!activeSession?.retrievedChunks?.length ? (
                  <p className="text-muted-foreground">No chunks retrieved.</p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Pipeline</h3>
              <div className="mt-3 space-y-1 text-muted-foreground">
                <p>Retriever: {retrieverStatus}</p>
                <p>Synthesizer: {synthesizerStatus}</p>
                <p>Critic: {criticStatus}</p>
                <p>Supported: {activeSession ? (activeSession.supported ? "Yes" : "No") : "Not available"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Trace</h3>
              <div className="mt-3 rounded-xl border border-line/60 bg-card p-3 text-[11px] text-muted-foreground">
                {trace ? (
                  <div className="space-y-1">
                    <p>Query: {trace.query}</p>
                    <p>Source: {trace.source}</p>
                    <p>Matches: {trace.results.length}</p>
                  </div>
                ) : (
                  <p>No trace captured.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Last Response</h3>
              <div className="mt-3 rounded-xl border border-line/60 bg-card p-3 text-[11px] text-muted-foreground">
                {activeSession ? (
                  <div className="space-y-1">
                    <p>Title: {activeSession.title}</p>
                    <p>Query: {activeSession.query}</p>
                    <p>Chunks: {activeSession.retrievedChunks.length}</p>
                    <p>Synthesis: {activeSession.synthesis.length} chars</p>
                  </div>
                ) : (
                  <p>No session yet.</p>
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
};
