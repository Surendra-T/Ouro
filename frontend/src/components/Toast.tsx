import { create } from "zustand";

import { cn } from "../utils/cn";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "error";
};

type ToastState = {
  items: ToastItem[];
  push: (item: ToastItem) => void;
  remove: (id: string) => void;
};

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (item) =>
    set((state) => ({
      items: [item, ...state.items].slice(0, 3),
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export const pushToast = (item: Omit<ToastItem, "id">) => {
  const id = crypto.randomUUID();
  useToastStore.getState().push({ id, ...item });
  setTimeout(() => {
    useToastStore.getState().remove(id);
  }, 4000);
};

export const ToastViewport = () => {
  const items = useToastStore((state) => state.items);
  if (!items.length) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-[60] flex w-[280px] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-xl border border-line/60 bg-card px-4 py-3 text-sm shadow-soft",
            item.tone === "success" && "border-emerald-200/60",
            item.tone === "error" && "border-rose-200/60"
          )}
        >
          <p className="font-medium">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
};
