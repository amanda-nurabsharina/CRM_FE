import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Invoice, PaymentTerm, PaymentProof } from "../../api/crmApi";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Upload,
  Plus,
  Building2,
  DollarSign,
  AlertCircle,
  Eye,
  X,
  History,
  Check,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedTermForUpload, setSelectedTermForUpload] = useState<PaymentTerm | null>(null);
  const [selectedProofForVerify, setSelectedProofForVerify] = useState<{ id: string; url: string; amount: number; bank: string } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form States
  const [createInvoiceForm, setCreateInvoiceForm] = useState({ lead_id: "", quotation_id: "", payment_type: "FULL", terms_count: 1 });
  const [uploadProofForm, setUploadProofForm] = useState({ proof_image_url: "", amount: 0, bank_name: "BCA" });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("Disetujui Admin Pusat (Dual-Check Passed)");

  // Queries
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => crmApi.getInvoices(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => crmApi.getLeads(),
  });

  const { data: dashboardKpi } = useQuery({
    queryKey: ["dashboard-kpi"],
    queryFn: () => crmApi.getDashboardKPIs(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => crmApi.getAuditLogs(),
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: typeof createInvoiceForm) => crmApi.createInvoice(data),
    onSuccess: () => {
      setShowCreateInvoiceModal(false);
      setCreateInvoiceForm({ lead_id: "", quotation_id: "", payment_type: "FULL", terms_count: 1 });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpi"] });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({ termId, data }: { termId: string; data: typeof uploadProofForm }) => crmApi.uploadProof(termId, data),
    onSuccess: () => {
      setSelectedTermForUpload(null);
      setUploadProofForm({ proof_image_url: "", amount: 0, bank_name: "BCA" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      alert("✅ Bukti transfer berhasil diunggah! Menunggu verifikasi Admin Pusat (Dual-Check).");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ proofId, approved, notes }: { proofId: string; approved: boolean; notes: string }) =>
      crmApi.verifyProof(proofId, approved, notes),
    onSuccess: () => {
      setSelectedProofForVerify(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpi"] });
    },
  });

  // Upload File Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const res = await crmApi.uploadFile(file);
      setUploadProofForm((prev) => ({ ...prev, proof_image_url: res.url }));
    } catch {
      alert("Gagal mengunggah foto bukti transfer.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Calculations for FR-23 Outstanding AR per Cabang
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.paid_amount || 0), 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalRevenue);

  // Filter payment audit logs for FR-22
  const paymentAuditLogs = auditLogs.filter(
    (log) => log.action_type.includes("PAYMENT") || log.entity_name.includes("payment") || log.entity_name.includes("invoice")
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2.5 tracking-tight text-slate-900 dark:text-white">
            <CreditCard className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Manajemen Invoice & Verifikasi Pembayaran (Dual-Check)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Mekanisme Dual-Check Pembayaran SRS FR-20 s/d FR-23 (Upload Admin Cabang → Dual-Check Approval Admin Pusat → Audit Trail Lock).
          </p>
        </div>

        <button
          onClick={() => {
            setCreateInvoiceForm({ lead_id: leads[0]?.id || "", quotation_id: "", payment_type: "FULL", terms_count: 1 });
            setShowCreateInvoiceModal(true);
          }}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0 shadow-md shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>+ Terbitkan Invoice Baru</span>
        </button>
      </div>

      {/* FR-23: Summary Cards & Outstanding AR per Cabang */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Invoiced */}
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold">
            <span>Total Tagihan Diterbitkan</span>
            <FileText className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">Rp {totalInvoiced.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-slate-400">{invoices.length} Dokumen Invoice Tagihan</span>
        </div>

        {/* Total Terbayar Verified */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <span>Total Pembayaran Lunas (Verified Pusat)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">Rp {totalRevenue.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Dual-check approval disetujui</span>
        </div>

        {/* Total Piutang / Outstanding AR (FR-23) */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-semibold">
            <span>Piutang / Outstanding AR Per Cabang</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-900 dark:text-amber-300">Rp {totalOutstanding.toLocaleString("id-ID")}</p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400">Monitoring sisa cicilan berjalan</span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>Daftar Invoice & Skema Dual-Check Pembayaran</span>
        </h2>

        {loadingInvoices ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading data invoice...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-xs space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 dark:text-zinc-300">Belum ada invoice yang diterbitkan.</p>
            <p className="text-[11px]">Klik "+ Terbitkan Invoice Baru" di atas untuk membuat tagihan baru.</p>
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === "PAID";
            return (
              <div
                key={inv.id}
                className="p-5 bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm dark:shadow-none hover:border-teal-500/50 transition-all"
              >
                {/* Invoice Card Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{inv.invoice_number}</h3>
                        <Badge variant={inv.payment_type === "FULL" ? "teal" : "indigo"} className="text-[9px] py-0 px-1.5 font-bold">
                          {inv.payment_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Customer: <strong className="text-slate-800 dark:text-zinc-200">{inv.lead?.customer_name || "WhatsApp Customer"}</strong> ({inv.lead?.phone_number})
                        {inv.lead?.branch && ` • Cabang: ${inv.lead.branch.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">Total Tagihan</p>
                      <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">Rp {inv.total_amount.toLocaleString("id-ID")}</p>
                    </div>
                    <Badge variant={isPaid ? "emerald" : "amber"} className="text-xs py-1 px-3 font-bold">
                      {isPaid ? "LUNAS (PAID)" : inv.status}
                    </Badge>
                  </div>
                </div>

                {/* Termin Cicilan Details (FR-20 & FR-21) */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Skema Termin Pembayaran & Dual-Check Approval
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {inv.terms?.map((term) => (
                      <div key={term.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200">Termin Ke-{term.term_number}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-extrabold">Rp {term.amount.toLocaleString("id-ID")}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          <span>Jatuh Tempo: {new Date(term.due_date).toLocaleDateString("id-ID")}</span>
                          <Badge variant={term.status === "VERIFIED" ? "emerald" : term.status === "PENDING_PUSAT" ? "amber" : "zinc"} className="text-[9px] py-0 px-1.5">
                            {term.status}
                          </Badge>
                        </div>

                        {/* Upload Proof Button (FR-20: Admin Cabang) */}
                        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60 space-y-2">
                          {term.proofs && term.proofs.length > 0 ? (
                            term.proofs.map((proof) => (
                              <div key={proof.id} className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Bank: {proof.bank_name || "BCA"}</span>
                                  <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400">Rp {proof.amount_transferred.toLocaleString("id-ID")}</span>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                                  {/* Preview Proof Image Thumbnail */}
                                  {proof.proof_image_url ? (
                                    <button
                                      onClick={() => setPreviewImageUrl(proof.proof_image_url)}
                                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                                    >
                                      <Eye className="h-3 w-3" /> Lihat Resi TF
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Tanpa Foto</span>
                                  )}

                                  {/* FR-21 Dual Check Action */}
                                  {proof.verification_status === "PENDING_PUSAT" ? (
                                    <button
                                      onClick={() =>
                                        setSelectedProofForVerify({
                                          id: proof.id,
                                          url: proof.proof_image_url,
                                          amount: proof.amount_transferred,
                                          bank: proof.bank_name || "BCA",
                                        })
                                      }
                                      className="px-2 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold hover:bg-amber-500/30 flex items-center gap-1 transition-all"
                                    >
                                      <Clock className="h-3 w-3" />
                                      <span>Dual-Check Pusat</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                      <span>Lunas (Approved Pusat)</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTermForUpload(term);
                                setUploadProofForm({ proof_image_url: "", amount: term.amount, bank_name: "BCA" });
                              }}
                              className="w-full py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>Unggah Bukti Transfer (Admin Cabang)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FR-22: Audit Trail Log Payment Verification */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          <History className="h-4 w-4 text-teal-500" />
          <span>Riwayat Verifikasi Pembayaran & Audit Trail (SRS FR-22)</span>
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Mencatat riwayat verifikasi lengkap (Siapa mengunggah, siapa menyetujui, tanggal & jam) pada immutable system audit trail.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold text-[11px]">
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Tindakan / Event</th>
                <th className="pb-2">User / Cabang</th>
                <th className="pb-2">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono">
              {paymentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">Belum ada riwayat verifikasi pembayaran tercatat.</td>
                </tr>
              ) : (
                paymentAuditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="py-2 text-slate-600 dark:text-zinc-400">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                    <td className="py-2">
                      <Badge variant="teal" className="text-[9px] py-0.5 px-2 font-bold">
                        {log.action_type}
                      </Badge>
                    </td>
                    <td className="py-2 font-sans font-semibold text-slate-800 dark:text-zinc-200">
                      {log.user?.name || "System"} ({log.branch?.name || "Pusat"})
                    </td>
                    <td className="py-2 text-slate-500 dark:text-zinc-400 text-[10px]">{log.entity_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CREATE INVOICE MODAL ========== */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Terbitkan Invoice Tagihan Baru</span>
              </h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Pilih Customer Lead WA *</label>
                <select
                  value={createInvoiceForm.lead_id}
                  onChange={(e) => setCreateInvoiceForm({ ...createInvoiceForm, lead_id: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Pilih Customer --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.phone_number}) — {l.branch?.name || "Pusat"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Skema Pembayaran *</label>
                <select
                  value={createInvoiceForm.payment_type}
                  onChange={(e) => setCreateInvoiceForm({ ...createInvoiceForm, payment_type: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="FULL">FULL PAYMENT (Lunas Sekaligus)</option>
                  <option value="INSTALLMENT">INSTALLMENT (Cicilan / DP + Pelunasan)</option>
                </select>
              </div>

              {createInvoiceForm.payment_type === "INSTALLMENT" && (
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Jumlah Termin Cicilan</label>
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={createInvoiceForm.terms_count}
                    onChange={(e) => setCreateInvoiceForm({ ...createInvoiceForm, terms_count: parseInt(e.target.value) || 2 })}
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button onClick={() => setShowCreateInvoiceModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs">
                Batal
              </button>
              <button
                onClick={() => createInvoiceMutation.mutate(createInvoiceForm)}
                disabled={createInvoiceMutation.isPending || !createInvoiceForm.lead_id}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Simpan & Terbitkan Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== FR-20: UPLOAD PROOF MODAL (Admin Cabang) ========== */}
      {selectedTermForUpload && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Upload className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Unggah Bukti Transfer (Admin Cabang — FR-20)</span>
              </h3>
              <button onClick={() => setSelectedTermForUpload(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nominal Transfer (Rp) *</label>
                <input
                  type="number"
                  value={uploadProofForm.amount}
                  onChange={(e) => setUploadProofForm({ ...uploadProofForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Bank Tujuan *</label>
                <select
                  value={uploadProofForm.bank_name}
                  onChange={(e) => setUploadProofForm({ ...uploadProofForm, bank_name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="MANDIRI">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Foto / Scan Struk Resi Bukti Transfer *</label>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingFile ? "Uploading..." : "Pilih Foto Struk"}
                  </button>
                </div>
                {uploadProofForm.proof_image_url && (
                  <div className="mt-2 p-2 bg-slate-100 dark:bg-zinc-950 rounded-xl flex items-center gap-2 border border-slate-200 dark:border-zinc-800">
                    <img src={uploadProofForm.proof_image_url} alt="Proof" className="h-12 w-16 object-cover rounded-lg" />
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono truncate">{uploadProofForm.proof_image_url}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button onClick={() => setSelectedTermForUpload(null)} className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs">
                Batal
              </button>
              <button
                onClick={() => uploadProofMutation.mutate({ termId: selectedTermForUpload.id, data: uploadProofForm })}
                disabled={uploadProofMutation.isPending || !uploadProofForm.amount || !uploadProofForm.proof_image_url}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Kirim Bukti ke Admin Pusat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== FR-21: DUAL-CHECK VERIFICATION MODAL (Admin Pusat) ========== */}
      {selectedProofForVerify && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Verifikasi Dual-Check (Admin Pusat — FR-21)</span>
              </h3>
              <button onClick={() => setSelectedProofForVerify(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-zinc-300">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-1">
                <p>Nominal Transfer: <strong className="text-sm font-mono text-teal-600 dark:text-teal-400">Rp {selectedProofForVerify.amount.toLocaleString("id-ID")}</strong></p>
                <p>Bank Tujuan: <strong>{selectedProofForVerify.bank}</strong></p>
              </div>

              <div className="h-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-center p-2">
                <img src={selectedProofForVerify.url} alt="Proof Large" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Catatan Verifikasi Admin Pusat:</label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => verifyMutation.mutate({ proofId: selectedProofForVerify.id, approved: false, notes: verifyNotes || "Ditolak Admin Pusat" })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Tolak (Reject)</span>
              </button>
              <button
                onClick={() => verifyMutation.mutate({ proofId: selectedProofForVerify.id, approved: true, notes: verifyNotes || "Dual-check disetujui" })}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Setujui (Approve & Lock)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== IMAGE FULL PREVIEW LIGHTBOX MODAL ========== */}
      {previewImageUrl && (
        <div onClick={() => setPreviewImageUrl(null)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Eye className="h-4 w-4 text-teal-500" />
                <span>Bukti Struk Transfer Resi</span>
              </h3>
              <button onClick={() => setPreviewImageUrl(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl overflow-hidden p-2 flex items-center justify-center max-h-[70vh]">
              <img src={previewImageUrl} alt="Full Proof" className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
