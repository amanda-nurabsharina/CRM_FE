import React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";

  const variants = {
    primary:
      "bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 hover:scale-[1.01] active:scale-[0.99]",
    secondary:
      "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 shadow-sm hover:border-zinc-600",
    outline:
      "border border-teal-500/40 text-teal-300 hover:bg-teal-500/10 hover:border-teal-500/80",
    ghost: "bg-transparent hover:bg-zinc-800/60 text-zinc-300 hover:text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-semibold",
    md: "px-4 py-2.5 text-sm font-semibold",
    lg: "px-6 py-3.5 text-base font-bold",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
