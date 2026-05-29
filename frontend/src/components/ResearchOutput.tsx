import React from "react";
import {
  Copy,
  FileText,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Type,
} from "lucide-react";

import { ResearchSession } from "../store/useAppStore";
import { GhostSelectionMenu } from "./GhostSelectionMenu";
import { Button } from "./ui/Button";
import { cn } from "../utils/cn";
import { useAppStore } from "../store/useAppStore";

const parseInline = (value: string) => {
  const tokens = value.split(/(\*\*[^*]+\*\*|\[\d+\])/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={`bold-${index}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (/^\[\d+\]$/.test(token)) {
      return (
        <sup key={`sup-${index}`} className="ml-0.5">
          {token.replace("[", "").replace("]", "")}
        </sup>
      );
    }
    return <span key={`text-${index}`}>{token}</span>;
  });
};

const renderBlocks = (text: string) => {
  const lines = text.split(/\n+/).filter((line) => line.trim().length > 0);

  return lines.map((line, index) => {
    if (line.trim().startsWith(">")) {
      return (
        <blockquote key={`quote-${index}`}>{parseInline(line.replace(/^>\s?/, ""))}</blockquote>
      );
    }

    return <p key={`line-${index}`}>{parseInline(line)}</p>;
  });
};

export const ResearchOutput = ({
  session,
  loading,
  error,
  onGhostAction,
  onCopy,
  onExportMarkdown,
  onExportPdf,
}: {
  session: ResearchSession | null;
  loading: boolean;
  error?: string | null;
  onGhostAction: (action: "expand" | "opposing" | "trace", text: string) => void;
  onCopy: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
}) => {
  const outputRef = React.useRef<HTMLDivElement>(null);
  const outputFont = useAppStore((state) => state.settings.outputFont);
  const setOutputFont = useAppStore((state) => state.setOutputFont);
  const [showTypography, setShowTypography] = React.useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl border border-line/60 bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Synthesizing response...</p>
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isInsufficient =
    session.synthesis.trim().toUpperCase() === "INSUFFICIENT EVIDENCE";
  const supported = session.supported;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {supported ? (
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <p className="text-sm font-medium">Research Output</p>
            <p className="text-xs text-muted-foreground">Source: {session.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="relative"
            onMouseLeave={() => setShowTypography(false)}
          >
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-line/60 px-3 py-1 text-xs text-muted-foreground opacity-60 transition hover:opacity-100"
              onClick={() => setShowTypography((prev) => !prev)}
            >
              <Type className="h-3.5 w-3.5" />
              Typography
            </button>
            {showTypography ? (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-line/60 bg-card p-2 text-xs shadow-soft">
                {(["serif", "sans", "mono"] as const).map((font) => (
                  <button
                    key={font}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1 text-left",
                      outputFont === font ? "bg-muted" : "hover:bg-muted/60"
                    )}
                    onClick={() => setOutputFont(font)}
                  >
                    {font.toUpperCase()}
                    {outputFont === font ? "Selected" : ""}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={onExportMarkdown}>
            <FileText className="mr-2 h-4 w-4" />
            Markdown
          </Button>
          <Button variant="ghost" size="sm" onClick={onExportPdf}>
            <Printer className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200/60 bg-rose-50/70 p-4 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div
        ref={outputRef}
        className={cn(
          "rounded-2xl border border-line/60 bg-card p-6 shadow-soft",
          "reading-output",
          outputFont === "serif" && "output-font-serif",
          outputFont === "sans" && "output-font-sans",
          outputFont === "mono" && "output-font-mono",
          isInsufficient && "text-muted-foreground"
        )}
      >
        {isInsufficient ? (
          <p>Insufficient evidence found in the selected source.</p>
        ) : (
          renderBlocks(session.synthesis)
        )}
        <GhostSelectionMenu
          containerRef={outputRef}
          onAction={onGhostAction}
        />
      </div>

      <div className="rounded-2xl border border-line/60 bg-card p-5">
        <p className="text-sm font-medium">Critique</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {session.critique || "No critique returned by the critic."}
        </p>
      </div>

      <div className="rounded-2xl border border-line/60 bg-card p-5">
        <p className="text-sm font-medium">Evidence</p>
        <div className="mt-3 space-y-3">
          {session.retrievedChunks.map((chunk, index) => (
            <div
              key={`chunk-${index}`}
              className="rounded-xl border border-line/60 bg-background/70 p-3 text-xs text-muted-foreground"
            >
              <p className="font-medium text-foreground">Chunk {index + 1}</p>
              <p className="mt-2">{chunk.content}</p>
            </div>
          ))}
          {!session.retrievedChunks.length ? (
            <p className="text-xs text-muted-foreground">
              No chunks were returned for this session.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
