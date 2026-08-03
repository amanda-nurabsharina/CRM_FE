import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, TourPackage } from "../../api/crmApi";
import { Package, FileText, Check, Plus, Pencil, Trash2, X, Upload, Globe, Clock, DollarSign, MessageSquare, FileDown } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

const emptyForm = {
  title: "", destination: "", duration_days: 3, base_price: 0,
  itinerary_json: "", terms_conditions: "", pdf_url: "", wa_template: "",
};

const defaultWaTemplate = `📄 *PENAWARAN HARGA RESMI ({quote_no})*

Halo Kak {customer_name},
Berikut detail penawaran resmi untuk paket *{package_title}*:

• Jumlah Pax: {pax} Orang
• Harga per Pax: Rp {price_per_pax}
• *Total Biaya: Rp {total_price}*
• Masa Berlaku: s/d {valid_until}

📎 Brosur: {pdf_url}

Silakan hubungi kami melalui pesan ini untuk konfirmasi pesanan & rincian pembayaran. Terima kasih! 🙏`;

export const CatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TourPackage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null);
  const [quoteForm, setQuoteForm] = useState({ lead_id: "", pax_count: 2, price_per_pax: 0, custom_reason: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: () => crmApi.getPackages(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => crmApi.getLeads(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => crmApi.createPackage(data),
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & typeof emptyForm & { is_active?: boolean }) => {
      const { id, ...rest } = data;
      return crmApi.updatePackage(id, rest);
    },
    onSuccess: () => {
      setEditingPkg(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deletePackage(id),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const quoteMutation = useMutation({
    mutationFn: (data: { lead_id: string; package_id: string; pax_count: number; price_per_pax: number; custom_price_reason?: string }) =>
      crmApi.createQuotation(data),
    onSuccess: () => {
      setSelectedPkg(null);
      alert("✅ Quotation berhasil dikirim ke WhatsApp pelanggan!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const result = await crmApi.uploadFile(file);
      setForm({ ...form, pdf_url: result.url });
    } catch (err) {
      alert("Upload file gagal. Pastikan server backend aktif.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const openAdd = () => {
    setEditingPkg(null);
    setForm({ ...emptyForm, wa_template: defaultWaTemplate });
    setShowForm(true);
  };

  const openEdit = (pkg: TourPackage) => {
    setEditingPkg(pkg);
    setForm({
      title: pkg.title,
      destination: pkg.destination,
      duration_days: pkg.duration_days,
      base_price: pkg.base_price,
      itinerary_json: pkg.itinerary_json || "",
      terms_conditions: pkg.terms_conditions || "",
      pdf_url: pkg.pdf_url || "",
      wa_template: pkg.wa_template || defaultWaTemplate,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingPkg) {
      updateMutation.mutate({ id: editingPkg.id, ...form, is_active: editingPkg.is_active });
    } else {
      createMutation.mutate(form);
    }
  };

  const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5 gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Package className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Katalog Paket & Generator Quotation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Kelola paket tur, upload brosur PDF, dan atur pesan WhatsApp quotation yang dikirim ke pelanggan.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {/* Package Cards Grid */}
      {packages.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-zinc-500 text-sm">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">Belum ada paket katalog.</p>
          <p className="text-xs mt-1">Klik "Tambah Paket Baru" untuk menambahkan paket tur pertama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-5 bg-white dark:bg-zinc-900/60 border rounded-2xl space-y-3.5 hover:border-teal-500/50 transition-all shadow-sm dark:shadow-none group ${
                !pkg.is_active ? "border-red-300 dark:border-red-800 opacity-60" : "border-slate-200 dark:border-zinc-800"
              }`}
            >
              {/* Top Row: Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="teal" className="text-[10px]">
                    <Globe className="h-3 w-3 mr-0.5" />
                    {pkg.destination}
                  </Badge>
                  <Badge variant="indigo" className="text-[10px]">
                    <Clock className="h-3 w-3 mr-0.5" />
                    {pkg.duration_days} Hari
                  </Badge>
                </div>
                {!pkg.is_active && (
                  <Badge variant="amber" className="text-[9px] font-bold">NONAKTIF</Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 leading-snug">{pkg.title}</h3>

              {/* Description */}
              {pkg.terms_conditions && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{pkg.terms_conditions}</p>
              )}

              {/* PDF & WA Template indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                {pkg.pdf_url && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    <FileDown className="h-3 w-3" /> Brosur PDF
                  </span>
                )}
                {pkg.wa_template && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">
                    <MessageSquare className="h-3 w-3" /> WA Template
                  </span>
                )}
              </div>

              {/* Price & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Harga / Pax
                  </span>
                  <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">{fmtRp(pkg.base_price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(pkg)}
                    className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 transition-all"
                    title="Edit Paket"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(pkg.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition-all"
                    title="Hapus Paket"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPkg(pkg);
                      setQuoteForm({ ...quoteForm, price_per_pax: pkg.base_price, lead_id: leads[0]?.id || "" });
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-sm"
                  >
                    <FileText className="h-3 w-3" />
                    Buat Quotation
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== ADD / EDIT PACKAGE MODAL ========== */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {editingPkg ? <Pencil className="h-5 w-5 text-teal-600 dark:text-teal-400" /> : <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                <span>{editingPkg ? `Edit: ${editingPkg.title}` : "Tambah Paket Katalog Baru"}</span>
              </h3>
              <button onClick={() => { setShowForm(false); setEditingPkg(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Title & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Paket *</label>
                  <input
                    type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Paket Bali 4D3N"
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Destinasi *</label>
                  <input
                    type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="Bali, Indonesia"
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Durasi (Hari)</label>
                  <input
                    type="number" min="1" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Harga Standar / Pax (Rp)</label>
                  <input
                    type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Terms / Description */}
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Deskripsi / Syarat & Ketentuan</label>
                <textarea
                  value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
                  placeholder="Include hotel, makan, transport..."
                  className="w-full h-20 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Itinerary JSON */}
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Itinerary Detail (Opsional)</label>
                <textarea
                  value={form.itinerary_json} onChange={(e) => setForm({ ...form, itinerary_json: e.target.value })}
                  placeholder="Day 1: Arrival & Check-in..."
                  className="w-full h-16 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono text-[10px] leading-relaxed"
                />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Upload Brosur / PDF Katalog</label>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handlePdfUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPdf}
                    className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingPdf ? "Uploading..." : "Pilih File"}
                  </button>
                  {form.pdf_url && (
                    <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 dark:text-teal-400 underline truncate max-w-[200px]">
                      {form.pdf_url.split("/").pop()}
                    </a>
                  )}
                </div>
                <input
                  type="text" value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                  placeholder="Atau paste URL PDF langsung: https://..."
                  className="w-full mt-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono text-[10px]"
                />
              </div>

              {/* WA Template Message */}
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">
                  <MessageSquare className="h-3 w-3 inline mr-1" />
                  Template Pesan WhatsApp Quotation
                </label>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-1.5">
                  Gunakan variabel: <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{customer_name}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{quote_no}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{package_title}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{pax}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{price_per_pax}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{total_price}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{valid_until}"}</code>{" "}
                  <code className="bg-slate-200 dark:bg-zinc-800 px-1 rounded">{"{pdf_url}"}</code>
                </p>
                <textarea
                  value={form.wa_template} onChange={(e) => setForm({ ...form, wa_template: e.target.value })}
                  placeholder={defaultWaTemplate}
                  className="w-full h-36 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 text-[11px] leading-relaxed font-mono"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button onClick={() => { setShowForm(false); setEditingPkg(null); }} className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending || !form.title || !form.destination}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{editingPkg ? "Simpan Perubahan" : "Simpan Paket Baru"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRM MODAL ========== */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-500/10 text-red-500 mx-auto">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">Hapus Paket Katalog?</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Paket ini akan dihapus dari katalog dan tidak bisa dipulihkan. Quotation yang sudah dibuat tetap tersimpan.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs">
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== QUOTATION GENERATOR MODAL ========== */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Kirim Quotation — {selectedPkg.title}</span>
              </h3>
              <button onClick={() => setSelectedPkg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Pilih Lead Customer WA:</label>
                <select
                  value={quoteForm.lead_id}
                  onChange={(e) => setQuoteForm({ ...quoteForm, lead_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                >
                  <option value="">-- Pilih Customer --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Jumlah Peserta (Pax):</label>
                <input
                  type="number" min="1" value={quoteForm.pax_count}
                  onChange={(e) => setQuoteForm({ ...quoteForm, pax_count: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Harga Kesepakatan / Pax (Rp):</label>
                <input
                  type="number" value={quoteForm.price_per_pax}
                  onChange={(e) => setQuoteForm({ ...quoteForm, price_per_pax: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="p-3 bg-teal-500/10 rounded-xl flex justify-between items-center text-xs font-bold text-teal-700 dark:text-teal-300">
                <span>Total Penawaran:</span>
                <span>{fmtRp(quoteForm.price_per_pax * quoteForm.pax_count)}</span>
              </div>

              {/* WA Preview */}
              {selectedPkg.wa_template && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    Pesan WA yang akan dikirim:
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-6 font-mono">
                    {selectedPkg.wa_template.slice(0, 200)}...
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  quoteMutation.mutate({
                    lead_id: quoteForm.lead_id,
                    package_id: selectedPkg.id,
                    pax_count: quoteForm.pax_count,
                    price_per_pax: quoteForm.price_per_pax,
                  })
                }
                disabled={quoteMutation.isPending || !quoteForm.lead_id}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Kirim Quotation ke WA</span>
              </button>
              <button
                onClick={() => setSelectedPkg(null)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
