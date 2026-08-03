import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login({ email, password });
    if (success) {
      navigate({ to: "/app" as any });
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    clearError();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>WhatsApp CRM Suite</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Welcome back
        </h2>
        <p className="text-zinc-400 text-sm">
          Enter your credentials to access your CRM agent dashboard.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-between animate-shake">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 font-bold hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-300">Password</label>
            <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-teal-400 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
          <span>Sign In to CRM</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </form>

      {/* Quick Demo Fill Buttons */}
      <div className="pt-4 border-t border-zinc-800/80 space-y-2">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-center">
          Quick Demo Accounts (1-Click Login All Branches)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill("pusat@dgt.co.id")}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
          >
            <p className="text-xs font-bold text-teal-400 group-hover:underline">👑 Admin Pusat</p>
            <p className="text-[10px] text-zinc-500 truncate">pusat@dgt.co.id</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill("admin.jkt@dgt.co.id")}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
          >
            <p className="text-xs font-bold text-indigo-400 group-hover:underline">🏢 Admin Jkt Pusat</p>
            <p className="text-[10px] text-zinc-500 truncate">admin.jkt@dgt.co.id</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill("admin.mdn@dgt.co.id")}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
          >
            <p className="text-xs font-bold text-emerald-400 group-hover:underline">🌴 Admin Medan</p>
            <p className="text-[10px] text-zinc-500 truncate">admin.mdn@dgt.co.id</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill("admin.tgr@dgt.co.id")}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-all group"
          >
            <p className="text-xs font-bold text-amber-400 group-hover:underline">✈️ Admin Tangerang</p>
            <p className="text-[10px] text-zinc-500 truncate">admin.tgr@dgt.co.id</p>
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-500 pt-2 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
        Protected by Enterprise JWT Authentication
      </p>
    </div>
  );
};
