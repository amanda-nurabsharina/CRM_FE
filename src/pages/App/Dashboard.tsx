import React from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Clock,
  Send,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const metrics = [
    { title: "Active WhatsApp Leads", value: "1,248", change: "+14.2%", icon: Users },
    { title: "Converted Deals", value: "$48,500", change: "+28.4%", icon: DollarSign },
    { title: "Avg Response Speed", value: "42 sec", change: "-12.5%", icon: Clock },
    { title: "Messages Processed", value: "18,920", change: "+9.1%", icon: MessageSquare },
  ];

  const recentLeads = [
    { name: "Budi Santoso", phone: "+62 812-3456-7890", status: "Hot Lead", time: "2 mins ago", value: "$4,500" },
    { name: "Siti Rahma", phone: "+62 857-1122-3344", status: "Deal Won", time: "15 mins ago", value: "$12,000" },
    { name: "Dewi Lestari", phone: "+62 819-9988-7766", status: "Follow Up", time: "1 hour ago", value: "$2,800" },
    { name: "Andi Wijaya", phone: "+62 813-4455-6677", status: "New Inquiry", time: "3 hours ago", value: "$6,200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900/60 via-zinc-900 to-zinc-900 border border-teal-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="teal" className="py-1 px-3 text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> WhatsApp CRM v1.0 Connected
              </Badge>
              <Badge variant="emerald" className="py-1 px-3 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Logged In
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.name || "CRM Agent"}! 👋
            </h1>
            <p className="text-zinc-300 text-sm max-w-xl">
              Your WhatsApp CRM agent console is live. You have <span className="text-teal-300 font-bold">12 unread customer inquiries</span> waiting for reply.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md">
              View Inbox
            </Button>
            <Button variant="primary" size="md">
              <Send className="h-4 w-4 mr-2" />
              <span>Quick Broadcast</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 shadow-sm dark:shadow-none hover:border-teal-500/50 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{m.title}</span>
                <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{m.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> {m.change}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">vs last month</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Leads & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent WhatsApp Leads</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Incoming inquiries from multi-branch channels</p>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {recentLeads.map((lead, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/40 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {lead.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{lead.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">{lead.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{lead.value}</span>
                  <Badge variant={lead.status === "Deal Won" ? "emerald" : "teal"} className="text-[10px]">
                    {lead.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 space-y-4">
          <div className="border-b border-slate-200 dark:border-zinc-800/80 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Quick Actions</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Common agent operations</p>
          </div>

          <div className="space-y-3">
            <button className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-teal-500/50 flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-300 transition-all">
              <MessageSquare className="h-4 w-4 text-teal-500" />
              <span>Open WhatsApp Inbox</span>
            </button>

            <button className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-teal-500/50 flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-300 transition-all">
              <UserCheck className="h-4 w-4 text-indigo-500" />
              <span>Create New Quotation</span>
            </button>

            <button className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-teal-500/50 flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-300 transition-all">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Broadcast Campaign</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
