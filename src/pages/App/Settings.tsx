import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Branch, User } from "../../api/crmApi";
import { Settings as SettingsIcon, Phone, PhoneCall, MapPin, Building2, Check, ShieldCheck, Plus, UserPlus, Users, KeyRound, Pencil, X, QrCode, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newBranch, setNewBranch] = useState({ name: "", code: "", wa_phone_number: "", voip_phone_number: "", coverage_areas: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "password123", role: "ADMIN_CABANG", branch_id: "" });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => crmApi.getBranches(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => crmApi.getUsers(),
  });

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  const { data: waStatus } = useQuery({
    queryKey: ["wa-bridge-status", host],
    queryFn: async () => {
      try {
        let res = await fetch(`http://${host}:3001/status`).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch("/wa-bridge/status").catch(() => null);
        }
        if (!res || !res.ok) return null;
        const data = await res.json();
        if (data && data.qr_code_url && data.qr_code_url.includes("localhost")) {
          data.qr_code_url = data.qr_code_url.replace("localhost", host);
        }
        return data as { status: string; qr_code_url: string };
      } catch {
        return null;
      }
    },
    refetchInterval: 2000,
  });

  const updateMutation = useMutation({
    mutationFn: (b: Branch) =>
      crmApi.updateBranch(b.id, {
        name: b.name,
        code: b.code,
        wa_phone_number: b.wa_phone_number,
        voip_phone_number: b.voip_phone_number || "",
        coverage_areas: b.coverage_areas,
        is_active: b.is_active ?? true,
      }),
    onSuccess: () => {
      setEditingBranch(null);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      alert("✅ Data Cabang & Nomor Telepon VoIP SIP Line Berhasil Disimpan!");
    },
    onError: (err: any) => {
      alert(`❌ Gagal menyimpan data cabang: ${err.message || "Terjadi kesalahan"}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (b: typeof newBranch) => crmApi.createBranch(b),
    onSuccess: () => {
      setShowAddModal(false);
      setNewBranch({ name: "", code: "", wa_phone_number: "", voip_phone_number: "", coverage_areas: "" });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (u: typeof newUser) => crmApi.createUser(u),
    onSuccess: () => {
      setShowAddUserModal(false);
      setNewUser({ name: "", email: "", password: "password123", role: "ADMIN_CABANG", branch_id: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen transition-colors max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800/80 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
            <SettingsIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Pengaturan Cabang & User Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manajemen DGT Kantor Pusat, Cabang WhatsApp WABA, dan Hak Akses User Admin / Sales per Cabang.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Branch Management (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Daftar Cabang & Coverage Area</h2>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Cabang</span>
              </button>
            </div>

            {/* Branch List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {branches.map((branch) => {
                const isPusat = branch.code === "PUSAT";
                return (
                  <div
                    key={branch.id}
                    className={`p-4 rounded-xl border space-y-2.5 transition-all group ${
                      isPusat
                        ? "bg-teal-500/5 dark:bg-teal-950/20 border-teal-500/30"
                        : "bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">{branch.name}</span>
                        {isPusat && (
                          <Badge variant="teal" className="text-[9px] py-0 px-1.5 font-extrabold">
                            PUSAT FALLBACK
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="indigo" className="text-[10px] font-mono px-2 py-0.5">
                          {branch.code}
                        </Badge>
                        <button
                          onClick={() => setEditingBranch(branch)}
                          className="p-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                          title="Edit Data & Coverage Area Cabang"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 dark:text-zinc-400">
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        <span>WA: +{branch.wa_phone_number || "Belum diatur"}</span>
                      </p>
                      <p className="flex items-start gap-1.5 text-[11px] leading-tight pt-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-zinc-300">{branch.coverage_areas || "Tidak ada coverage area"}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. User Management Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Manajemen User Admin & Sales Cabang</h2>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Akun pengelola yang dapat login ke dashboard CRM per cabang.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Tambah User Cabang</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-semibold text-[11px]">
                    <th className="pb-2">Nama User</th>
                    <th className="pb-2">Email Login</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Penugasan Cabang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] flex items-center justify-center">
                          {u.name?.slice(0, 2).toUpperCase() || "US"}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-600 dark:text-zinc-300">{u.email}</td>
                      <td className="py-2.5">
                        <Badge variant={u.role === "ADMIN_PUSAT" ? "indigo" : "teal"} className="text-[9px] py-0.5 px-2 font-bold">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-700 dark:text-zinc-300 font-medium">
                        {u.branch?.name || (u.role === "ADMIN_PUSAT" ? "DGT Kantor Pusat (All)" : "Belum diatur")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Gateway QR Code Scanner */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <QrCode className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">WhatsApp Web QR Scanner</h2>
              </div>
              <Badge variant={waStatus?.status === "CONNECTED" ? "emerald" : "amber"} className="text-[10px] font-bold">
                {waStatus?.status === "CONNECTED" ? "CONNECTED" : waStatus?.status === "PAIRING" ? "READY TO SCAN" : "DISCONNECTED"}
              </Badge>
            </div>

            {waStatus?.status === "CONNECTED" ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">WhatsApp Terhubung Online!</h3>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
                  Koneksi socket Baileys aktif di port 3001. Seluruh pesan WA masuk & keluar tersinkronisasi otomatis.
                </p>
              </div>
            ) : waStatus?.qr_code_url ? (
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-md border border-slate-200">
                  <img src={waStatus.qr_code_url} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">Scan QR Code Ini via WhatsApp HP</h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Buka WhatsApp ➔ Perangkat Tertaut ➔ Scan gambar di atas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-center space-y-2 text-xs text-slate-500 dark:text-zinc-400">
                <RefreshCw className="h-6 w-6 text-teal-500 mx-auto animate-spin" />
                <p className="font-semibold text-slate-700 dark:text-zinc-300">Menghubungkan ke Server WA Bridge...</p>
                <p className="text-[10px]">Pastikan server wa_bridge aktif di http://{host}:3001.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" />
              <span>Login Credentials Demo</span>
            </h3>
            <div className="text-xs space-y-2 text-zinc-300 font-mono">
              <p><strong className="text-white">Default Password:</strong> password123</p>
              <p><strong className="text-white">Admin Pusat:</strong> pusat@dgt.co.id</p>
              <p><strong className="text-white">Admin Jkt:</strong> admin.jkt@dgt.co.id</p>
              <p><strong className="text-white">Admin Medan:</strong> admin.mdn@dgt.co.id</p>
              <p><strong className="text-white">Admin Tangerang:</strong> admin.tgr@dgt.co.id</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Cabang */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Edit Data Cabang: {editingBranch.name}</span>
              </h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Cabang:</label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Kode Cabang:</label>
                <input
                  type="text"
                  value={editingBranch.code}
                  onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp Business:</label>
                <input
                  type="text"
                  value={editingBranch.wa_phone_number}
                  onChange={(e) => setEditingBranch({ ...editingBranch, wa_phone_number: e.target.value })}
                  placeholder="628110001000"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Cakupan Area (Dipisah Koma):</label>
                <textarea
                  value={editingBranch.coverage_areas}
                  onChange={(e) => setEditingBranch({ ...editingBranch, coverage_areas: e.target.value })}
                  placeholder="Tangerang, BSD, Gading Serpong..."
                  className="w-full h-24 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => updateMutation.mutate(editingBranch)}
                disabled={updateMutation.isPending || !editingBranch.name || !editingBranch.code}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah User */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Tambah User Admin / Sales Cabang</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Lengkap:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Misal: Admin Tangerang"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Email Login:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="admin.tgr@dgt.co.id"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Role User:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="ADMIN_CABANG">ADMIN_CABANG</option>
                  <option value="SALES_AGENT">SALES_AGENT</option>
                  <option value="ADMIN_PUSAT">ADMIN_PUSAT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Tugaskan ke Cabang:</label>
                <select
                  value={newUser.branch_id}
                  onChange={(e) => setNewUser({ ...newUser, branch_id: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending || !newUser.name || !newUser.email}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Simpan User Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Cabang */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Tambah Cabang DGT Baru</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Cabang:</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="Misal: DGT Bandung"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Kode Cabang:</label>
                <input
                  type="text"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                  placeholder="PUSAT / BDG"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp Business:</label>
                <input
                  type="text"
                  value={newBranch.wa_phone_number}
                  onChange={(e) => setNewBranch({ ...newBranch, wa_phone_number: e.target.value })}
                  placeholder="628110001000"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Cakupan Area (Dipisah Koma):</label>
                <textarea
                  value={newBranch.coverage_areas}
                  onChange={(e) => setNewBranch({ ...newBranch, coverage_areas: e.target.value })}
                  placeholder="Bandung, Cimahi, Lembang..."
                  className="w-full h-20 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => createMutation.mutate(newBranch)}
                disabled={createMutation.isPending || !newBranch.name || !newBranch.code}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Simpan Cabang Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
