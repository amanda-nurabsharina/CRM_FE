import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Lead } from "../../api/crmApi";
import { Users, Filter, Plus, Phone, MapPin, Tag, ArrowRight, UserPlus } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const PIPELINE_STAGES = [
  { key: "NEW", label: "New Lead", color: "border-teal-500" },
  { key: "QUALIFIED", label: "Qualified", color: "border-indigo-500" },
  { key: "QUOTATION_SENT", label: "Quotation Sent", color: "border-violet-500" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-amber-500" },
  { key: "PAYMENT_PENDING", label: "Payment Pending", color: "border-orange-500" },
  { key: "PAID", label: "Paid & Deal", color: "border-emerald-500" },
];

export const Leads: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ customer_name: "", phone_number: "", domicile: "Jakarta", source: "WHATSAPP" });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => crmApi.getLeads(),
    refetchInterval: 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newLead) => crmApi.createLead(data),
    onSuccess: () => {
      setShowAddModal(false);
      setNewLead({ customer_name: "", phone_number: "", domicile: "Jakarta", source: "WHATSAPP" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => crmApi.updateLeadStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Users className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <span>WhatsApp Leads & Pipeline Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Tracking status pipeline lead real-time dari pesan WA masuk hingga deal lunas.
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md">
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Tambah Lead Manual</span>
        </Button>
      </div>

      {/* Kanban Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);

          return (
            <div key={stage.key} className="p-3 rounded-2xl bg-slate-100/70 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 space-y-3 flex flex-col min-h-[420px]">
              <div className={`flex items-center justify-between pb-2 border-b-2 ${stage.color}`}>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{stage.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {stageLeads.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                    Kosong
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2 hover:border-teal-500/50 transition-all shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 truncate">{lead.customer_name}</span>
                        <Badge variant="teal" className="text-[9px] py-0 px-1.5 font-bold shrink-0">{lead.branch?.name || lead.branch?.code || "DGT Pusat"}</Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
                        {lead.phone_number}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{lead.branch?.name || lead.domicile || "DGT Pusat"}</span>
                      </p>

                      {lead.handover_note && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-700 dark:text-amber-300 leading-tight">
                          <span className="font-bold">Catatan Handover: </span>
                          {lead.handover_note}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 dark:text-zinc-500">{lead.source}</span>
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: lead.id, status: e.target.value })}
                          className="bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-[10px] text-slate-800 dark:text-zinc-300 p-1 focus:outline-none"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              → {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Tambah Lead Baru</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nama Pelanggan:</label>
                <input
                  type="text"
                  value={newLead.customer_name}
                  onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })}
                  placeholder="Ahmad Subagyo"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp:</label>
                <input
                  type="text"
                  value={newLead.phone_number}
                  onChange={(e) => setNewLead({ ...newLead, phone_number: e.target.value })}
                  placeholder="6281234567890"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Kota Domisili (Untuk Auto-Routing):</label>
                <input
                  type="text"
                  value={newLead.domicile}
                  onChange={(e) => setNewLead({ ...newLead, domicile: e.target.value })}
                  placeholder="Medan / Jakarta Pusat / Tangerang..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => createMutation.mutate(newLead)}
                disabled={createMutation.isPending || !newLead.customer_name || !newLead.phone_number}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Simpan Lead & Auto Route</span>
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
