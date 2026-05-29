import React from "react";
import { useFloating, offset, shift, flip } from "@floating-ui/react";
import { Sparkles, Search, Crosshair } from "lucide-react";

type GhostAction = "expand" | "opposing" | "trace";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  onAction: (action: GhostAction, text: string) => void;
};

type VirtualEl = {
  getBoundingClientRect: () => DOMRect;
  getClientRects: () => DOMRectList;
};

export const GhostSelectionMenu = ({ containerRef, onAction }: Props) => {
  const [selectionText, setSelectionText] = React.useState("");
  const { refs, floatingStyles, update } = useFloating({
    middleware: [offset(8), flip(), shift()],
    placement: "top",
  });

  React.useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionText("");
        return;
      }

      const anchor = selection.anchorNode;
      if (!anchor || !containerRef.current?.contains(anchor)) {
        setSelectionText("");
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectionText("");
        return;
      }

      const range = selection.getRangeAt(0);
      const virtualElement: VirtualEl = {
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => range.getClientRects(),
      };

      refs.setReference(virtualElement);
      setSelectionText(text);
      update();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", handleSelectionChange);
    window.addEventListener("resize", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", handleSelectionChange);
      window.removeEventListener("resize", handleSelectionChange);
    };
  }, [containerRef, refs, update]);

  if (!selectionText) {
    return null;
  }

  const handleAction = (action: GhostAction) => {
    onAction(action, selectionText);
    window.getSelection()?.removeAllRanges();
    setSelectionText("");
  };

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 flex items-center gap-2 rounded-full border border-line/60 bg-card px-3 py-2 text-xs shadow-soft"
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted"
        onClick={() => handleAction("expand")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Expand on this
      </button>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted"
        onClick={() => handleAction("opposing")}
      >
        <Search className="h-3.5 w-3.5" />
        Find opposing evidence
      </button>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted"
        onClick={() => handleAction("trace")}
      >
        <Crosshair className="h-3.5 w-3.5" />
        Trace chunk
      </button>
    </div>
  );
};
