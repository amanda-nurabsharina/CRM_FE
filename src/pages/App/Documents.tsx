import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, BookingTraveler } from "../../api/crmApi";
import {
  Sparkles,
  User,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Eye,
  MessageSquare,
  Search,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { useNavigate } from "@tanstack/react-router";

const emptyTravelerForm = {
  lead_id: "",
  full_name: "",
  id_card_number: "",
  passport_number: "",
  passport_expiry: "",
  birth_date: "",
  ktp_photo_url: "",
  passport_photo_url: "",
};

export const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadIdFilter, setSelectedLeadIdFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<BookingTraveler | null>(null);
  const [form, setForm] = useState(emptyTravelerForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Uploading State
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: travelers = [], isLoading: loadingTravelers } = useQuery({
    queryKey: ["travelers"],
    queryFn: () => crmApi.getTravelers(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => crmApi.getLeads(),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => crmApi.getConversations(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof emptyTravelerForm) => crmApi.createTraveler(data),
    onSuccess: () => {
      setShowModal(false);
      setForm(emptyTravelerForm);
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & typeof emptyTravelerForm) => {
      const { id, lead_id, ...rest } = data;
      return crmApi.updateTraveler(id, rest);
    },
    onSuccess: () => {
      setEditingTraveler(null);
      setShowModal(false);
      setForm(emptyTravelerForm);
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteTraveler(id),
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
    },
  });

  // Handlers for File Upload
  const handleKtpFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKtp(true);
    try {
      const res = await crmApi.uploadFile(file);
      setForm((prev) => ({ ...prev, ktp_photo_url: res.url }));
    } catch {
      alert("Gagal mengunggah foto KTP.");
    } finally {
      setUploadingKtp(false);
    }
  };

  const handlePassportFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPassport(true);
    try {
      const res = await crmApi.uploadFile(file);
      setForm((prev) => ({ ...prev, passport_photo_url: res.url }));
    } catch {
      alert("Gagal mengunggah foto Paspor.");
    } finally {
      setUploadingPassport(false);
    }
  };

  const openAddModal = () => {
    setEditingTraveler(null);
    setForm({
      ...emptyTravelerForm,
      lead_id: leads[0]?.id || "",
    });
    setShowModal(true);
  };

  const openEditModal = (t: BookingTraveler) => {
    setEditingTraveler(t);
    setForm({
      lead_id: t.lead_id,
      full_name: t.full_name,
      id_card_number: t.id_card_number || "",
      passport_number: t.passport_number || "",
      passport_expiry: t.passport_expiry ? t.passport_expiry.slice(0, 10) : "",
      birth_date: t.birth_date ? t.birth_date.slice(0, 10) : "",
      ktp_photo_url: t.ktp_photo_url || "",
      passport_photo_url: t.passport_photo_url || "",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingTraveler) {
      updateMutation.mutate({ id: editingTraveler.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  // Helper to jump to WA Chat
  const goToChat = (leadId: string) => {
    const conv = conversations.find((c) => c.lead_id === leadId);
    if (conv) {
      window.location.href = `/app/inbox?convId=${conv.id}`;
    } else {
      window.location.href = "/app/inbox";
    }
  };

  // Filtered Travelers List
  const filteredTravelers = travelers.filter((t) => {
    const matchesSearch =
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.id_card_number && t.id_card_number.includes(searchTerm)) ||
      (t.passport_number && t.passport_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.lead?.customer_name && t.lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLead = selectedLeadIdFilter ? t.lead_id === selectedLeadIdFilter : true;
    return matchesSearch && matchesLead;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Sparkles className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Dokumen Perjalanan Paspor & KTP (Encrypted Vault)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>Management & Monitoring kelengkapan dokumen traveler terhubung langsung ke Chat ID WhatsApp Customer.</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0 shadow-md shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Dokumen Traveler</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nama Traveler, NIK KTP, No Paspor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 shrink-0">Filter Chat / Lead:</label>
          <select
            value={selectedLeadIdFilter}
            onChange={(e) => setSelectedLeadIdFilter(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none font-medium"
          >
            <option value="">Semua Chat Customer WA</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer_name} ({l.phone_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Traveler Document Cards Grid */}
      {loadingTravelers ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading dokumen traveler...</div>
      ) : filteredTravelers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">Belum ada dokumen traveler terdaftar.</p>
          <p className="text-xs text-slate-400 mt-1">Klik "+ Tambah Dokumen Traveler" untuk mendaftarkan data KTP & Paspor baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTravelers.map((t) => {
            const hasPassport = !!(t.passport_number && t.passport_photo_url);
            const hasKtp = !!(t.id_card_number && t.ktp_photo_url);

            return (
              <div
                key={t.id}
                className="p-5 bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm dark:shadow-none hover:border-teal-500/40 transition-all"
              >
                {/* Left Info Column */}
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-extrabold shrink-0 mt-0.5 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{t.full_name}</h3>
                      {t.lead && (
                        <button
                          onClick={() => goToChat(t.lead_id)}
                          className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                          title="Buka Chat WA Customer Ini"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Chat WA: {t.lead.customer_name}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 flex-wrap font-mono">
                      <span>NIK KTP: <strong className="text-slate-800 dark:text-zinc-200">{t.id_card_number || "Belum Diatur"}</strong></span>
                      <span>•</span>
                      <span>No Paspor: <strong className="text-slate-800 dark:text-zinc-200">{t.passport_number || "Belum Diatur"}</strong></span>
                      {t.passport_expiry && (
                        <>
                          <span>•</span>
                          <span>Expiry: <strong className="text-amber-600 dark:text-amber-400">{t.passport_expiry.slice(0, 10)}</strong></span>
                        </>
                      )}
                    </div>

                    {t.lead?.branch && (
                      <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                        <Building2 className="h-3 w-3" />
                        <span>Penugasan Cabang: {t.lead.branch.name} ({t.lead.branch.code})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions & Previews */}
                <div className="flex flex-wrap items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 border-slate-100 dark:border-zinc-800 pt-3 lg:pt-0">
                  {/* Photo Previews */}
                  <div className="flex items-center gap-2">
                    {/* KTP Photo Thumbnail */}
                    {t.ktp_photo_url ? (
                      <button
                        onClick={() => setPreviewImage({ url: t.ktp_photo_url!, title: `Foto KTP — ${t.full_name}` })}
                        className="relative group border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden h-12 w-20 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center"
                        title="Klik untuk Preview Foto KTP"
                      >
                        <img src={t.ktp_photo_url} alt="KTP" className="h-full w-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white">
                          <Eye className="h-4 w-4" />
                        </div>
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-bold text-white text-center py-0.5">KTP</span>
                      </button>
                    ) : (
                      <div className="h-12 w-20 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-medium">
                        KTP (-)
                      </div>
                    )}

                    {/* Passport Photo Thumbnail */}
                    {t.passport_photo_url ? (
                      <button
                        onClick={() => setPreviewImage({ url: t.passport_photo_url!, title: `Foto Paspor — ${t.full_name}` })}
                        className="relative group border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden h-12 w-20 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center"
                        title="Klik untuk Preview Foto Paspor"
                      >
                        <img src={t.passport_photo_url} alt="Paspor" className="h-full w-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white">
                          <Eye className="h-4 w-4" />
                        </div>
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-bold text-white text-center py-0.5">PASPOR</span>
                      </button>
                    ) : (
                      <div className="h-12 w-20 border border-dashed border-slate-300 dark:border-zinc-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-medium">
                        Paspor (-)
                      </div>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-1.5">
                    <Badge variant={hasPassport ? "emerald" : "amber"} className="text-[10px] font-bold">
                      Paspor: {hasPassport ? "LENGKAP" : "BELUM_LENGKAP"}
                    </Badge>
                    <Badge variant={hasKtp ? "emerald" : "amber"} className="text-[10px] font-bold">
                      KTP: {hasKtp ? "LENGKAP" : "BELUM_LENGKAP"}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold transition-all flex items-center gap-1"
                      title="Edit Dokumen Traveler"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(t.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs transition-all"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== ADD / EDIT TRAVELER MODAL ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                {editingTraveler ? <Pencil className="h-5 w-5 text-teal-600 dark:text-teal-400" /> : <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
                <span>{editingTraveler ? `Edit Dokumen: ${editingTraveler.full_name}` : "Tambah Dokumen Traveler Baru"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Select Connected Lead / Chat */}
              {!editingTraveler && (
                <div>
                  <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Hubungkan ke Chat ID / Customer WA *</label>
                  <select
                    value={form.lead_id}
                    onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-medium"
                  >
                    <option value="">-- Pilih Customer WA --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.customer_name} ({l.phone_number}) — {l.branch?.name || "Pusat"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Lengkap Traveler (Sesuai Paspor) *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Misal: Budi Santoso"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              {/* KTP Section */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>Dokumen KTP</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1 font-medium">Nomor NIK KTP</label>
                    <input
                      type="text"
                      value={form.id_card_number}
                      onChange={(e) => setForm({ ...form, id_card_number: e.target.value })}
                      placeholder="3171010000000001"
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1 font-medium">Foto KTP</label>
                    <div className="flex items-center gap-2">
                      <input ref={ktpInputRef} type="file" accept="image/*" onChange={handleKtpFileUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => ktpInputRef.current?.click()}
                        disabled={uploadingKtp}
                        className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {uploadingKtp ? "Uploading..." : "Upload KTP"}
                      </button>
                    </div>
                  </div>
                </div>
                {form.ktp_photo_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <img src={form.ktp_photo_url} alt="KTP Preview" className="h-10 w-16 object-cover rounded-lg border border-slate-300" />
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono truncate">{form.ktp_photo_url}</span>
                  </div>
                )}
              </div>

              {/* Passport Section */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2.5">
                <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Dokumen Paspor</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1 font-medium">Nomor Paspor</label>
                    <input
                      type="text"
                      value={form.passport_number}
                      onChange={(e) => setForm({ ...form, passport_number: e.target.value.toUpperCase() })}
                      placeholder="A-12345678"
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1 font-medium">Masa Berlaku Paspor Expiry</label>
                    <input
                      type="date"
                      value={form.passport_expiry}
                      onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-zinc-400 mb-1 font-medium">Foto Halaman Depan Paspor</label>
                  <div className="flex items-center gap-2">
                    <input ref={passportInputRef} type="file" accept="image/*" onChange={handlePassportFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => passportInputRef.current?.click()}
                      disabled={uploadingPassport}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingPassport ? "Uploading..." : "Upload Foto Paspor"}
                    </button>
                  </div>
                </div>

                {form.passport_photo_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <img src={form.passport_photo_url} alt="Passport Preview" className="h-10 w-16 object-cover rounded-lg border border-slate-300" />
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate">{form.passport_photo_url}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending || !form.full_name}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{editingTraveler ? "Simpan Perubahan" : "Simpan Dokumen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== PHOTO PREVIEW MODAL ========== */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Eye className="h-4 w-4 text-teal-500" />
                <span>{previewImage.title}</span>
              </h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl overflow-hidden p-2 flex items-center justify-center max-h-[70vh]">
              <img src={previewImage.url} alt="Dokumen Preview" className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg" />
            </div>

            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[300px]">{previewImage.url}</span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Lihat Ukuran Penuh</span>
              </a>
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
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">Hapus Dokumen Traveler?</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Data traveler dan link foto KTP/Paspor ini akan dihapus dari vault sistem.</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
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
    </div>
  );
};
