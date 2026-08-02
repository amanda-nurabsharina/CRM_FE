import React from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Card } from "../../components/ui/Card";
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
    { title: "Active WhatsApp Leads", value: "1,248", change: "+14.2%", icon: Users, variant: "teal" as const },
    { title: "Converted Deals", value: "$48,500", change: "+28.4%", icon: DollarSign, variant: "emerald" as const },
    { title: "Avg Response Speed", value: "42 sec", change: "-12.5%", icon: Clock, variant: "indigo" as const },
    { title: "Messages Processed", value: "18,920", change: "+9.1%", icon: MessageSquare, variant: "violet" as const },
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
              <span>View Analytics</span>
            </Button>
            <Button variant="primary" size="md">
              <Send className="h-4 w-4 mr-2" />
              <span>Open Inbox</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} glow className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">{m.title}</span>
                <div className={`p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{m.value}</span>
                <span className="text-xs font-bold text-emerald-400">{m.change}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent WhatsApp Leads */}
        <Card className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-400" />
                Recent WhatsApp Conversations
              </h3>
              <p className="text-xs text-zinc-400">Real-time incoming customer leads</p>
            </div>
            <Badge variant="zinc">4 Active</Badge>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {recentLeads.map((lead, i) => (
              <div key={i} className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-teal-300 text-xs">
                    {lead.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{lead.name}</p>
                    <p className="text-xs text-zinc-400">{lead.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-400">{lead.value}</span>
                  <Badge variant={lead.status === "Deal Won" ? "emerald" : lead.status === "Hot Lead" ? "amber" : "teal"}>
                    {lead.status}
                  </Badge>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">{lead.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Account & Quick CRM Actions */}
        <Card className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
            <UserCheck className="h-4 w-4 text-teal-400" />
            Session Details
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400">Authenticated Email:</span>
              <span className="font-bold text-teal-300 truncate max-w-[160px]">{user?.email || "admin@crm.com"}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400">Assigned Role:</span>
              <span className="font-bold text-indigo-300 capitalize">{user?.role || "Agent"}</span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400">Backend API Status:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active (Fiber v2)
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Manage Quick Templates
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
