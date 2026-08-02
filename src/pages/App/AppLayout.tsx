import React, { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { ModernSidebar } from "../../components/layout/ModernSidebar";
import { Header } from "../../components/layout/Header";
import { useAuthStore } from "../../store/useAuthStore";

export const AppLayout: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" as any });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Modern Floating Sidebar Menu */}
      <ModernSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
