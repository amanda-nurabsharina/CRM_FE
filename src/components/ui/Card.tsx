import React from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 p-6 shadow-xl transition-all duration-300",
        glow && "border-teal-500/30 shadow-teal-500/10 hover:shadow-teal-500/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
