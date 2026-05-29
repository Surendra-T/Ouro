import React from "react";
import { X } from "lucide-react";

import { cn } from "../utils/cn";

export const Modal = ({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-line/60 bg-card p-6 shadow-soft-dark",
          className
        )}
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex items-center gap-2 text-xs text-muted-foreground"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
        {children}
      </div>
    </div>
  );
};
