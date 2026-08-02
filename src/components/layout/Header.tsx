import React from "react";
import { Search, Bell, Sparkles, MessageCircle } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { Badge } from "../ui/Badge";

export const Header: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads, contacts, WhatsApp messages... (Ctrl+K)"
            className="w-full bg-zinc-900/90 text-xs text-zinc-200 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2 border border-zinc-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Status Pill */}
        <Badge variant="teal" className="hidden sm:flex items-center gap-1.5 py-1 px-3">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          <span>WhatsApp API: Connected</span>
        </Badge>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-400 ring-2 ring-zinc-950" />
        </button>

        {/* Quick Message CTA */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-all">
          <MessageCircle className="h-4 w-4 text-teal-400" />
          <span>Broadcast</span>
        </button>
      </div>
    </header>
  );
};
