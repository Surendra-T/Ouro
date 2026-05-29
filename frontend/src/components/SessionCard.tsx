import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { ResearchSession } from "../store/useAppStore";
import { formatDate } from "../utils/format";
import { truncate } from "../utils/text";
import { cn } from "../utils/cn";

export const SessionCard = ({
  session,
  onOpen,
  compact = false,
}: {
  session: ResearchSession;
  onOpen: (id: string) => void;
  compact?: boolean;
}) => {
  return (
    <motion.div
      layoutId={`session-${session.id}`}
      className={cn(
        "group flex cursor-pointer flex-col gap-2 rounded-2xl border border-line/60 bg-card p-4 shadow-soft",
        compact && "p-3"
      )}
      onClick={() => onOpen(session.id)}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{truncate(session.title, 60)}</h4>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</p>
      <p className="text-xs text-muted-foreground">Source: {truncate(session.source, 36)}</p>
    </motion.div>
  );
};
