import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Branch } from "../../api/crmApi";
import { Settings as SettingsIcon, Phone, MapPin, Building2, Plus, Check, ShieldCheck, HelpCircle } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
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

  return (
    <div className="p-6 space-y-6 bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-5">
        <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight">
          <SettingsIcon className="h-6 w-6 text-teal-400" />
          <span>Pengaturan Nomor WhatsApp & Auto-Routing Cabang</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Kelola konfigurasi nomor WhatsApp Business API (WABA) per cabang dan aturan Auto-Routing domisili (FR-01, FR-06).
        </p>
      </div>

      {/* Real WhatsApp QR Scanner Widget for POC */}
      <div className="p-5 bg-zinc-900 border border-teal-500/40 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100">Koneksi WhatsApp Real (Untuk Pengujian POC & HP Pribadi)</h3>
              <p className="text-xs text-zinc-400">Pindai QR Code menggunakan aplikasi WhatsApp di HP Anda untuk pengujian pesan langsung.</p>
            </div>
          </div>
          <Badge variant={waStatus?.status === "CONNECTED" ? "emerald" : "amber"} className="text-xs py-1 px-3">
            {waStatus?.status === "CONNECTED" ? "Terhubung (CONNECTED)" : waStatus?.status === "PAIRING" ? "Siap Pindai (PAIRING)" : "Menunggu Bridge"}
          </Badge>
        </div>

        {waStatus?.status === "PAIRING" && waStatus.qr_code_url && (
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
            <p className="text-xs text-zinc-300 font-semibold">Buka WA di HP → Perangkat Tertaut → Pindai QR Code Ini:</p>
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img src={waStatus.qr_code_url} alt="WhatsApp QR Code" className="w-56 h-56" />
            </div>
            <p className="text-[11px] text-zinc-500">QR Code akan diperbarui secara otomatis secara real-time.</p>
          </div>
        )}

        {waStatus?.status === "CONNECTED" && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>WhatsApp HP Anda telah <strong>SUKSES TERHUBUNG</strong>! Sekarang Anda bisa langsung mengirim pesan dari WhatsApp HP Anda ke CRM.</span>
          </div>
        )}
      </div>

      {/* Scheme Selector Info Card */}
      <div className="p-5 bg-gradient-to-r from-teal-500/10 via-zinc-900 to-indigo-500/10 border border-teal-500/30 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-400" />
            <span>Penjelasan Skema Integrasi WhatsApp (Multi-Nomor vs Single-Number)</span>
          </h3>
          <div className="flex items-center gap-2 bg-zinc-950/80 p-1 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setWaScheme("MULTI_NUMBER")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                waScheme === "MULTI_NUMBER" ? "bg-teal-500 text-zinc-950 shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Multi-Nomor (Per Cabang)
            </button>
            <button
              onClick={() => setWaScheme("SINGLE_NUMBER")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                waScheme === "SINGLE_NUMBER" ? "bg-teal-500 text-zinc-950 shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Single-Number (Hotline Pusat)
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
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
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Daftar Cabang & Nomor WhatsApp Aktif ({branches.length} Cabang)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3 hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-100">{b.name}</h3>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                      Kode: {b.code}
                    </span>
                  </div>
                </div>
                <Badge variant="emerald" className="text-[10px] py-0.5 px-2">
                  Aktif
                </Badge>
              </div>

              {/* Number & Coverage Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 bg-zinc-950/60 px-3 rounded-xl border border-zinc-800/50">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-teal-400" />
                    Nomor WA WABA:
                  </span>
                  <span className="font-mono font-bold text-zinc-100">+{b.wa_phone_number || "Belum Set"}</span>
                </div>

                <div className="py-2 px-3 bg-zinc-950/60 rounded-xl border border-zinc-800/50 space-y-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-[11px] font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    Cakupan Area Auto-Routing Domisili:
                  </span>
                  <p className="text-zinc-300 text-[11px] font-medium leading-normal">
                    {b.coverage_areas || "Semua area"}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setEditingBranch(b)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
              <Phone className="h-5 w-5 text-teal-400" />
              <span>Edit Pengaturan WA — {editingBranch.name}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Nomor WhatsApp Business (Format International):</label>
                <input
                  type="text"
                  value={editingBranch.wa_phone_number}
                  onChange={(e) => setEditingBranch({ ...editingBranch, wa_phone_number: e.target.value })}
                  placeholder="628110001001"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Daftar Kota/Kecamatan Coverage Area (Dipisah Koma):</label>
                <textarea
                  value={editingBranch.coverage_areas}
                  onChange={(e) => setEditingBranch({ ...editingBranch, coverage_areas: e.target.value })}
                  placeholder="Medan, Binjai, Deli Serdang..."
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
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
                className="px-4 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
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
