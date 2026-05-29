import { motion } from "motion/react";
import { cn } from "../utils/cn";

export const Page = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn("space-y-8", className)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      {children}
    </motion.div>
  );
};
