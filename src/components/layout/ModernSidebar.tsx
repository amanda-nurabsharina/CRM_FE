import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  KanbanSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../utils/cn";

export const ModernSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navGroups = [
    {
      title: "CRM CORE",
      items: [
        { label: "Executive Dashboard", icon: LayoutDashboard, to: "/app" },
        { label: "WhatsApp Inbox", icon: MessageSquare, to: "/app/inbox", badge: "Multi-WA" },
        { label: "Lead Pipeline", icon: Users, to: "/app/leads", badge: "Kanban" },
      ],
    },
    {
      title: "TRANSACTIONS & BILLING",
      items: [
        { label: "Paket & Quotation", icon: KanbanSquare, to: "/app/catalog" },
        { label: "Invoice & Payment Dual-Check", icon: UserCheck, to: "/app/billing", badge: "Dual-Check" },
        { label: "Dokumen Paspor & KTP", icon: Sparkles, to: "/app/documents" },
      ],
    },
    {
      title: "GOVERNANCE & AUDIT",
      items: [
        { label: "Audit Trail (Immutable)", icon: ShieldAlert, to: "/app/audit" },
        { label: "Pengaturan Cabang", icon: Settings, to: "/app/settings" },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-zinc-950 border-r border-zinc-800/80 transition-all duration-300 ease-in-out z-30 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/80">
        <Link to={"/app" as any} className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-teal-500/25 shrink-0">
            <Sparkles className="h-5 w-5 stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-teal-300 bg-clip-text text-transparent">
                CRM Pro
              </span>
              <span className="text-[10px] font-semibold text-teal-400/90 tracking-widest uppercase">
                WhatsApp Suite
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-teal-500/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== "/app" && location.pathname.startsWith(item.to));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-teal-500/15 via-teal-500/10 to-transparent text-teal-300 border border-teal-500/30 shadow-md shadow-teal-500/5"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 hover:border-zinc-800 border border-transparent"
                    )}
                  >
                    {/* Active Pill Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-400 shadow-sm shadow-teal-400" />
                    )}

                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-teal-400" : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-full",
                          item.badge === "New"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "CR"}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-100 truncate">{user?.name || "CRM Agent"}</p>
              <div className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-teal-400" />
                <p className="text-[10px] text-zinc-400 capitalize truncate">{user?.role || "Agent"}</p>
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
