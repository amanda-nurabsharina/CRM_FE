import React from "react";
import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { ShieldAlert, Activity, Clock, PhoneCall, User, Phone, MapPin, MessageSquare, DollarSign, CheckCircle2, Building2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { formatPhoneNumber, formatCustomerName, formatCurrency } from "../../utils/formatters";

export const AuditPage: React.FC = () => {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => crmApi.getAuditLogs(),
    refetchInterval: 2000,
  });

  const renderAuditDetails = (log: any) => {
    let data: any = null;
    try {
      if (log.after_value_json && log.after_value_json !== "null") {
        data = JSON.parse(log.after_value_json);
      }
    } catch (e) {
      // Treat as plain text
    }

    const action = log.action_type;

    // 1. LEAD_CREATED
    if (action === "LEAD_CREATED") {
      const rawName = data?.customer_name || (typeof data === "string" ? data : "");
      const customerName = formatCustomerName(rawName);
      const phone = formatPhoneNumber(data?.phone_number || rawName);
      const domicile = data?.domicile || log.branch?.name || "DGT Pusat";
      const source = data?.source || "WHATSAPP";

      return (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-slate-800 dark:text-zinc-200 font-semibold">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-teal-500 shrink-0" />
              <span className="truncate">Pelanggan: <strong className="text-slate-900 dark:text-white">{customerName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Telepon: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{phone}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Domisili: <strong>{domicile}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span className="truncate">Sumber: <strong>{source}</strong></span>
            </div>
          </div>
        </div>
      );
    }

    // 2. INBOUND_CALL
    if (action === "INBOUND_CALL") {
      let callText = typeof data === "string" ? data : log.after_value_json || "";
      callText = callText.replace(/"/g, "");

      const phoneMatch = callText.match(/\(\+?(\d+)\)/);
      const phoneNum = phoneMatch ? formatPhoneNumber(phoneMatch[1]) : formatPhoneNumber(data?.phone_number);

      return (
        <div className="mt-2 p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold">
              <PhoneCall className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
              <span>Panggilan WhatsApp Suara Masuk</span>
            </div>
            {phoneNum !== "-" && (
              <div className="flex items-center gap-1.5 font-mono text-amber-800 dark:text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-lg">
                <Phone className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>{phoneNum}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. PAYMENT_VERIFIED / PAYMENT_SUBMITTED
    if (action.includes("PAYMENT") || action.includes("INVOICE")) {
      const amount = data?.amount || data?.total_amount;
      const bank = data?.bank_name || "Bank Transfer";
      return (
        <div className="mt-2 p-3 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between gap-3 font-semibold text-emerald-900 dark:text-emerald-200 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Verifikasi Pembayaran Dual-Check: <strong className="text-emerald-700 dark:text-emerald-300">{formatCurrency(amount)}</strong> ({bank})</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>VERIFIED & LOCKED</span>
          </span>
        </div>
      );
    }

    // 4. CONVERSATION_DELETED
    if (action === "CONVERSATION_DELETED") {
      return (
        <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium italic">
          Obrolan percakapan WhatsApp telah dihapus oleh Admin Pusat.
        </div>
      );
    }

    // 5. BRANCH_CREATED / BRANCH_UPDATED
    if (action.includes("BRANCH")) {
      return (
        <div className="mt-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>Pengaturan Cabang: <strong>{data?.name || log.branch?.name || log.entity_id}</strong> ({data?.coverage_areas || "Coverage Area"})</span>
        </div>
      );
    }

    // Default Fallback
    const cleanStr = log.after_value_json ? log.after_value_json.replace(/[{"}]/g, " ").replace(/"/g, "") : "";
    return (
      <div className="mt-1 text-xs text-slate-600 dark:text-zinc-400 font-medium truncate">
        {cleanStr || `Entity ID: ${log.entity_id}`}
      </div>
    );
  };

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
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-900/80 transition-colors flex items-start gap-4">
                  <div className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isCall ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400"
                  }`}>
                    {isCall ? <PhoneCall className="h-4.5 w-4.5 animate-pulse" /> : <Activity className="h-4.5 w-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-extrabold ${isCall ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-zinc-200"}`}>
                        {log.action_type}
                      </span>
                      <Badge variant={isCall ? "amber" : "indigo"} className="text-[10px] py-0 px-1.5 font-bold">
                        {log.entity_name}
                      </Badge>
                      {log.branch?.name && (
                        <Badge variant="teal" className="text-[10px] py-0 px-1.5 font-bold">
                          {log.branch.name}
                        </Badge>
                      )}
                    </div>
                    {renderAuditDetails(log)}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
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
