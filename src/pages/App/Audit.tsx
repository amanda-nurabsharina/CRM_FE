import React from "react";
import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { ShieldAlert, Activity, Clock, PhoneCall } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const AuditPage: React.FC = () => {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => crmApi.getAuditLogs(),
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen transition-colors">
      <div className="border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
          <ShieldAlert className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <span>Immutable Audit Trail (Log Keamanan System)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Catatan permanen read-only atas seluruh transaksi, verifikasi pembayaran, panggilan masuk, perubahan status, dan akses dokumen (FR-28 s.d FR-31)
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Aktivitas & Riwayat Panggilan Terbaru</span>
          <Badge variant="teal" className="text-xs">Immutable Read-Only Log</Badge>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
              Belum ada log audit trail tercatat.
            </div>
          ) : (
            logs.map((log) => {
              const isCall = log.action_type === "INBOUND_CALL";
              let cleanDesc = log.after_value_json ? log.after_value_json.replace(/"/g, "") : "";
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/80 transition-colors flex items-start gap-4">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isCall ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400"
                  }`}>
                    {isCall ? <PhoneCall className="h-4 w-4 animate-pulse" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold ${isCall ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-zinc-200"}`}>{log.action_type}</span>
                      <Badge variant={isCall ? "amber" : "indigo"} className="text-[10px] py-0 px-1.5">{log.entity_name}</Badge>
                      {log.branch?.name && (
                        <Badge variant="teal" className="text-[10px] py-0 px-1.5">{log.branch.name}</Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1">
                      {cleanDesc || `Entity ID: ${log.entity_id}`}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
