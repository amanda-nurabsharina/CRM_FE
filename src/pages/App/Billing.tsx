import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { CreditCard, CheckCircle2, XCircle, Clock, ShieldCheck, FileText } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProof, setSelectedProof] = useState<{ id: string; url: string; amount: number } | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => crmApi.getInvoices(),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ proofId, approved, notes }: { proofId: string; approved: boolean; notes: string }) =>
      crmApi.verifyProof(proofId, approved, notes),
    onSuccess: () => {
      setSelectedProof(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
            <CreditCard className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Manajemen Invoice & Verifikasi Pembayaran (Dual-Check)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Status 'Paid' hanya dapat dikunci final setelah disetujui oleh Admin Pusat (Sesuai Kebutuhan SRS FR-20 s.d FR-23)
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4">
        {invoices.length === 0 ? (
          <div className="p-12 text-center border border-slate-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/30 text-slate-400 dark:text-zinc-500 text-xs">
            Belum ada invoice yang diterbitkan. Buat invoice baru dari modul Lead & Pipeline.
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === "PAID";
            return (
              <div key={inv.id} className="p-5 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm dark:shadow-none hover:border-teal-500/50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{inv.invoice_number}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Customer: {inv.lead?.customer_name || "Customer"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 dark:text-zinc-500">Total Tagihan</p>
                      <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">Rp {inv.total_amount.toLocaleString("id-ID")}</p>
                    </div>
                    <Badge variant={isPaid ? "emerald" : "indigo"} className="text-xs py-1 px-3">
                      {inv.status}
                    </Badge>
                  </div>
                </div>

                {/* Termin Cicilan Details */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Termin Cicilan / Skema Pembayaran</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {inv.terms?.map((term) => (
                      <div key={term.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">Termin {term.term_number}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">Rp {term.amount.toLocaleString("id-ID")}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-400">
                          <span>Jatuh Tempo: {new Date(term.due_date).toLocaleDateString("id-ID")}</span>
                          <Badge variant={term.status === "VERIFIED" ? "emerald" : "amber"} className="text-[9px] py-0 px-1.5">
                            {term.status}
                          </Badge>
                        </div>

                        {/* Dual-Check Proof Button */}
                        {term.proofs && term.proofs.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                            {term.proofs.map((proof) => (
                              <div key={proof.id} className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 dark:text-zinc-400">Bukti Transfer TF</span>
                                {proof.verification_status === "PENDING_PUSAT" ? (
                                  <button
                                    onClick={() => setSelectedProof({ id: proof.id, url: proof.proof_image_url, amount: proof.amount_transferred })}
                                    className="px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold hover:bg-amber-500/30 flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    <span>Verifikasi Pusat</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>Verified</span>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dual Check Verification Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Verifikasi Dual-Check Pembayaran (Admin Pusat)</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
              <p>Nominal Ditransfer: <span className="font-bold text-teal-600 dark:text-teal-400">Rp {selectedProof.amount.toLocaleString("id-ID")}</span></p>
              <div className="h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center">
                <img src={selectedProof.url} alt="Proof" className="max-h-full object-contain" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => verifyMutation.mutate({ proofId: selectedProof.id, approved: true, notes: "Disetujui Admin Pusat" })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Setujui (Approve)</span>
              </button>
              <button
                onClick={() => verifyMutation.mutate({ proofId: selectedProof.id, approved: false, notes: "Bukti tidak valid" })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 hover:bg-red-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Tolak (Reject)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
