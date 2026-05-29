import * as React from "react";

import { cn } from "../../utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/60 bg-card shadow-soft",
        className
      )}
      {...props}
    />
  );
};
