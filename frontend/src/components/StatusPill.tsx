import { cn } from "../utils/cn";

export const StatusPill = ({
  label,
  status,
}: {
  label: string;
  status: "ok" | "warn" | "error";
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        status === "ok" && "border-emerald-200/60 text-emerald-500",
        status === "warn" && "border-amber-200/60 text-amber-500",
        status === "error" && "border-rose-200/60 text-rose-500"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "ok" && "bg-emerald-400",
          status === "warn" && "bg-amber-400",
          status === "error" && "bg-rose-400"
        )}
      />
      {label}
    </span>
  );
};
