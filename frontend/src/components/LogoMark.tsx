import { motion } from "motion/react";

import { cn } from "../utils/cn";

export const LogoMark = ({ className }: { className?: string }) => {
  return (
    <motion.div
      layoutId="ouro-logo"
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border border-line/70 bg-foreground text-background shadow-lux",
        className
      )}
    >
      <span className="text-sm font-semibold">O</span>
    </motion.div>
  );
};
