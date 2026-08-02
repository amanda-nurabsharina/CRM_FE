import React from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "indigo" | "emerald" | "amber" | "violet" | "zinc";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "teal", className }) => {
  const variants = {
    teal: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
