import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-zinc-300 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-zinc-900/80 text-zinc-100 text-sm placeholder-zinc-500 rounded-xl px-4 py-2.5 transition-all duration-200 border border-zinc-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 hover:border-zinc-700 shadow-inner",
              icon && "pl-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/50",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 font-medium pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
