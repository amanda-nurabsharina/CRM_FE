import React from "react";
import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { ShieldAlert, Activity, Filter, Clock } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const AuditPage: React.FC = () => {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => crmApi.getAuditLogs(),
  });

  return (
    <div className="p-6 space-y-6 bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="border-b border-zinc-800/80 pb-5">
        <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
          <ShieldAlert className="h-6 w-6 text-teal-400" />
          <span>Immutable Audit Trail (Log Keamanan System)</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Catatan permanen read-only atas seluruh transaksi, verifikasi pembayaran, perubahan status, dan akses dokumen (FR-28 s.d FR-31)
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300">Aktivitas Terbaru</span>
          <Badge variant="teal" className="text-xs">Immutable Read-Only Log</Badge>
        </div>

        <div className="divide-y divide-zinc-800/60 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Belum ada log audit trail tercatat.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-zinc-900/80 transition-colors flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">{log.action_type}</span>
                    <Badge variant="indigo" className="text-[10px] py-0 px-1.5">{log.entity_name}</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Entity ID: <span className="font-mono text-zinc-300">{log.entity_id}</span>
                  </p>
                </div>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
