import React from "react";
import { motion } from "motion/react";
import { Send, FileText, Sparkles } from "lucide-react";

import { useAppStore } from "../store/useAppStore";
import { cn } from "../utils/cn";

export const QueryComposer = ({
  value,
  onChange,
  onSubmit,
  disabled,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => {
  const documents = useAppStore((state) => state.documents);
  const activeSource = useAppStore((state) => state.activeSource);
  const setActiveSource = useAppStore((state) => state.setActiveSource);
  const defaultK = useAppStore((state) => state.settings.defaultK);

  const suggestions = [
    "Summarize the core findings",
    "Compare architecture decisions",
    "Extract key metrics",
  ];

  return (
    <div className="print-hidden rounded-2xl border border-line/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Source
        </span>
        <select
          className="rounded-lg border border-line/60 bg-background/80 px-2 py-1 text-xs text-foreground"
          value={activeSource ?? ""}
          onChange={(event) => setActiveSource(event.target.value)}
          disabled={documents.length === 0}
        >
          <option value="" disabled>
            Select a document
          </option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.filePath}>
              {doc.filename}
            </option>
          ))}
        </select>
        <span className="ml-auto">k={defaultK}</span>
      </div>

      <div className="group relative mt-4">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-accent/40 opacity-0 blur-xl transition duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-line/70 bg-background/80 px-4 py-3">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Ask a research question..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            disabled={disabled}
          />
          <motion.button
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground",
              disabled && "opacity-60"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={onSubmit}
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <motion.button
            key={suggestion}
            type="button"
            className="flex items-center gap-2 rounded-full border border-line/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => onChange(suggestion)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
