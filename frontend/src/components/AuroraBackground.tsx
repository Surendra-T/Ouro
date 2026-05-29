import { cn } from "../utils/cn";

export const AuroraBackground = ({
  state,
}: {
  state: "idle" | "active" | "dev";
}) => {
  return (
    <div
      className={cn(
        "aurora-layer",
        state === "idle" && "aurora-idle",
        state === "active" && "aurora-active",
        state === "dev" && "aurora-dev"
      )}
      aria-hidden
    />
  );
};
