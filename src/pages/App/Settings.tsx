import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Branch } from "../../api/crmApi";
import { Settings as SettingsIcon, Phone, MapPin, Building2, Check, ShieldCheck, HelpCircle, Plus, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", code: "", wa_phone_number: "", coverage_areas: "" });
  const [waScheme, setWaScheme] = useState<"MULTI_NUMBER" | "SINGLE_NUMBER">("MULTI_NUMBER");

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => crmApi.getBranches(),
  });

  const { data: waStatus } = useQuery({
    queryKey: ["wa-bridge-status"],
    queryFn: async () => {
      try {
        const res = await fetch("http://localhost:3001/status");
        if (!res.ok) return null;
        return (await res.json()) as { status: string; qr_code_url: string };
      } catch {
        return null;
      }
    },
    refetchInterval: 3000,
  });

  const updateMutation = useMutation({
    mutationFn: (b: Branch) =>
      crmApi.updateBranch(b.id, {
        name: b.name,
        code: b.code,
        wa_phone_number: b.wa_phone_number,
        coverage_areas: b.coverage_areas,
        is_active: b.is_active ?? true,
      }),
    onSuccess: () => {
      setEditingBranch(null);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (b: typeof newBranch) => crmApi.createBranch(b),
    onSuccess: () => {
      setShowAddModal(false);
      setNewBranch({ name: "", code: "", wa_phone_number: "", coverage_areas: "" });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const pusatBranch = branches.find((b) => b.code === "PUSAT" || b.name.toLowerCase().includes("pusat"));

  const handleInitPusat = () => {
    createMutation.mutate({
      name: "DGT Kantor Pusat",
      code: "PUSAT",
      wa_phone_number: "628110001000",
      coverage_areas: "Pusat, General, Indonesia, All, Default Fallback",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen transition-colors">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800/80 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
            <SettingsIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Pengaturan DGT Kantor Pusat & Cabang WhatsApp</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Konfigurasi DGT Kantor Pusat (Default Fallback Routing) dan Nomor WhatsApp WABA per Cabang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!pusatBranch && (
            <button
              onClick={handleInitPusat}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-teal-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Setup / Inisialisasi DGT Kantor Pusat</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-slate-300 dark:border-zinc-700"
          >
            <Plus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>
      </div>

      {/* DGT KANTOR PUSAT DEDICATED SETUP CARD */}
      <div className="p-6 bg-gradient-to-r from-teal-900/40 via-zinc-900 to-zinc-900 border border-teal-500/40 rounded-2xl space-y-4 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">DGT Kantor Pusat (Headquarters)</h3>
                <Badge variant="teal" className="text-[10px]">Super Admin Fallback</Badge>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Pusat kendali utama untuk penanganan pesan WA tanpa lokasi domisili & verifikasi pembayaran dual-check.
              </p>
            </div>
          </div>

          {pusatBranch ? (
            <button
              onClick={() => setEditingBranch(pusatBranch)}
              className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-xl transition-all"
            >
              Edit Pengaturan Pusat
            </button>
          ) : (
            <button
              onClick={handleInitPusat}
              className="px-4 py-2 bg-teal-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/20"
            >
              Aktifkan Kantor Pusat
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-400 text-[11px]">Kode Cabang Utama:</span>
            <p className="font-mono font-bold text-teal-300">{pusatBranch?.code || "PUSAT"}</p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-400 text-[11px]">Nomor WA Hotline Pusat:</span>
            <p className="font-mono font-bold text-teal-300">+{pusatBranch?.wa_phone_number || "628110001000"}</p>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-zinc-400 text-[11px]">Aturan Routing:</span>
            <p className="font-semibold text-emerald-400">Default Fallback (Jika Tanpa Lokasi)</p>
          </div>
        </div>
      </div>

      {/* Real WhatsApp QR Scanner Widget for POC */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Koneksi WhatsApp Real (Pengujian HP Pribadi POC)</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Pindai QR Code menggunakan aplikasi WhatsApp di HP Anda untuk pengujian pesan langsung.</p>
            </div>
          </div>
          <Badge variant={waStatus?.status === "CONNECTED" ? "emerald" : "amber"} className="text-xs py-1 px-3">
            {waStatus?.status === "CONNECTED" ? "Terhubung (CONNECTED)" : waStatus?.status === "PAIRING" ? "Siap Pindai (PAIRING)" : "Menunggu Bridge"}
          </Badge>
        </div>

        {waStatus?.status === "PAIRING" && waStatus.qr_code_url && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <p className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">Buka WA di HP → Perangkat Tertaut → Pindai QR Code Ini:</p>
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img src={waStatus.qr_code_url} alt="WhatsApp QR Code" className="w-56 h-56" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">QR Code akan diperbarui secara otomatis secara real-time.</p>
          </div>
        )}

        {waStatus?.status === "CONNECTED" && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>WhatsApp HP Anda telah <strong>SUKSES TERHUBUNG</strong>! Sekarang Anda bisa langsung mengirim pesan dari WhatsApp HP Anda ke CRM.</span>
          </div>
        )}
      </div>

      {/* Scheme Selector Info Card */}
      <div className="p-5 bg-gradient-to-r from-teal-500/10 via-slate-100 dark:via-zinc-900 to-indigo-500/10 border border-teal-500/30 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Penjelasan Skema Integrasi WhatsApp (Multi-Nomor vs Single-Number)</span>
          </h3>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-950/80 p-1 border border-slate-200 dark:border-zinc-800 rounded-xl">
            <button
              onClick={() => setWaScheme("MULTI_NUMBER")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                waScheme === "MULTI_NUMBER" ? "bg-teal-500 text-zinc-950 shadow" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              Multi-Nomor (Per Cabang)
            </button>
            <button
              onClick={() => setWaScheme("SINGLE_NUMBER")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                waScheme === "SINGLE_NUMBER" ? "bg-teal-500 text-zinc-950 shadow" : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              Single-Number (Hotline Pusat)
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
          {waScheme === "MULTI_NUMBER" ? (
            <>
              <strong>Skema Multi-Nomor (Sesuai Spesifikasi SRS Client FR-01)</strong>: Setiap cabang memiliki 1 nomor resmi WhatsApp Business API tersendiri. Customer yang mengontak nomor WhatsApp Medan langsung terhubung ke Inbox Cabang Medan, begitu pula cabang Jakarta & Tangerang.
            </>
          ) : (
            <>
              <strong>Skema Single-Number (Pusat Hotline + Auto-Routing Domisili)</strong>: Menggunakan 1 nomor WA resmi terpusat DGT. Ketika customer baru pertama kali mengirim pesan, sistem otomatis menanyakan kota domisili dan me-route obrolan ke cabang terdekat sesuai daftar <em>Coverage Areas</em> di bawah ini.
            </>
          )}
        </p>
      </div>

      {/* Branches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">
            Daftar Cabang & Nomor WhatsApp Aktif ({branches.length} Cabang)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="p-5 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm dark:shadow-none hover:border-teal-500/50 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{b.name}</h3>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      Kode: {b.code}
                    </span>
                  </div>
                </div>
                <Badge variant={b.code === "PUSAT" ? "teal" : "emerald"} className="text-[10px] py-0.5 px-2">
                  {b.code === "PUSAT" ? "KANTOR PUSAT" : "Aktif"}
                </Badge>
              </div>

              {/* Number & Coverage Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-zinc-950/60 px-3 rounded-xl border border-slate-200 dark:border-zinc-800/50">
                  <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                    Nomor WA WABA:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-100">+{b.wa_phone_number || "Belum Set"}</span>
                </div>

                <div className="py-2 px-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 space-y-1">
                  <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 text-[11px] font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    Cakupan Area Auto-Routing Domisili:
                  </span>
                  <p className="text-slate-700 dark:text-zinc-300 text-[11px] font-medium leading-normal">
                    {b.coverage_areas || "Semua area"}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setEditingBranch(b)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-all"
                >
                  Edit Nomor WA & Coverage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Edit Pengaturan Cabang — {editingBranch.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Cabang / Unit:</label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp Business (Format International):</label>
                <input
                  type="text"
                  value={editingBranch.wa_phone_number}
                  onChange={(e) => setEditingBranch({ ...editingBranch, wa_phone_number: e.target.value })}
                  placeholder="628110001000"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Daftar Kota/Kecamatan Coverage Area (Dipisah Koma):</label>
                <textarea
                  value={editingBranch.coverage_areas}
                  onChange={(e) => setEditingBranch({ ...editingBranch, coverage_areas: e.target.value })}
                  placeholder="Medan, Binjai, Deli Serdang..."
                  className="w-full h-24 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => updateMutation.mutate(editingBranch)}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </button>
              <button
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Tambah Cabang / Setup Kantor Pusat Baru</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Cabang / Unit:</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="DGT Kantor Pusat / DGT Bandung..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Kode Singkatan Cabang:</label>
                <input
                  type="text"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                  placeholder="PUSAT / BDG"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp Business:</label>
                <input
                  type="text"
                  value={newBranch.wa_phone_number}
                  onChange={(e) => setNewBranch({ ...newBranch, wa_phone_number: e.target.value })}
                  placeholder="628110001000"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Cakupan Area (Dipisah Koma):</label>
                <textarea
                  value={newBranch.coverage_areas}
                  onChange={(e) => setNewBranch({ ...newBranch, coverage_areas: e.target.value })}
                  placeholder="Pusat, All, General, Default Fallback..."
                  className="w-full h-20 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => createMutation.mutate(newBranch)}
                disabled={createMutation.isPending || !newBranch.name || !newBranch.code}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Simpan Cabang Baru</span>
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
