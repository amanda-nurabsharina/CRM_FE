import React from "react";
import { Search, Bell, MessageCircle, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { Badge } from "../ui/Badge";

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads, contacts, WhatsApp messages... (Ctrl+K)"
            className="w-full bg-slate-100 dark:bg-zinc-900/90 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-teal-500/50 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-white transition-all flex items-center justify-center"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Status Pill */}
        <Badge variant="teal" className="hidden sm:flex items-center gap-1.5 py-1 px-3">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span>WhatsApp API: Connected</span>
        </Badge>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-white dark:ring-zinc-950" />
        </button>

        {/* Quick Message CTA */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-all">
          <MessageCircle className="h-4 w-4 text-teal-500 dark:text-teal-400" />
          <span>Broadcast</span>
        </button>
      </div>
    </header>
  );
};
