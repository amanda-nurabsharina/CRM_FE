import React from "react";
import { Outlet } from "@tanstack/react-router";
import crmHeroImage from "../../assets/modern_crm_workspace.png";
import { Sparkles, MessageSquare, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export const AuthLayout: React.FC = () => {
  return (
    <main className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-0 lg:p-6 select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full min-h-screen lg:min-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-12 gap-8 bg-zinc-950/80 backdrop-blur-2xl rounded-none lg:rounded-3xl border-0 lg:border border-zinc-800/80 shadow-2xl overflow-hidden">
        
        {/* Left Column: Modern Hero Image & Glassmorphic Preview */}
        <div className="hidden lg:block lg:col-span-6 relative overflow-hidden bg-zinc-950 p-12">
          {/* Background image container with glowing subtle border */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 hover:scale-105 transition-all duration-1000"
            style={{ backgroundImage: `url(${crmHeroImage})` }}
          />

          {/* Gradient Overlay for ultra-high contrast text */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

          {/* Floating Metric Card 1 */}
          <div className="absolute top-10 left-10 p-4 rounded-2xl glass-panel-glow max-w-xs animate-float">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">WhatsApp Automation</p>
                <p className="text-sm font-bold text-white">99.8% Instant Response</p>
              </div>
            </div>
          </div>

          {/* Floating Metric Card 2 */}
          <div className="absolute top-36 right-10 p-4 rounded-2xl glass-panel border border-indigo-500/30 max-w-xs animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400">Conversion Rate</p>
                <p className="text-sm font-bold text-emerald-400">+34.2% Growth</p>
              </div>
            </div>
          </div>

          {/* Left Bottom Content */}
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold w-max mb-4">
              <Zap className="h-4 w-4 text-teal-400" />
              <span>Next-Gen CRM Workspace</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              Supercharge your Customer
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Engagement via WhatsApp.
              </span>
            </h1>

            <p className="text-zinc-300 text-sm mt-4 max-w-md font-medium leading-relaxed">
              Unified lead management, automated sales pipelines, and intelligent multi-agent chat response built for high-performing teams.
            </p>

            <div className="mt-8 flex items-center gap-6 pt-6 border-t border-zinc-800/80 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-400" /> End-to-End Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" /> AI Lead Scoring
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
};
