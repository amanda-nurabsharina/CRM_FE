import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { useAuthStore } from "../../store/useAuthStore";
import { Users, Phone, MapPin, UserPlus, GripVertical, MessageSquare, Building2, Filter } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { formatPhoneNumber } from "../../utils/formatters";

const PIPELINE_STAGES = [
  { key: "NEW", label: "New Lead", color: "border-teal-500", badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  { key: "QUALIFIED", label: "Qualified", color: "border-indigo-500", badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { key: "QUOTATION_SENT", label: "Quotation Sent", color: "border-violet-500", badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { key: "NEGOTIATION", label: "Negotiation", color: "border-amber-500", badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { key: "PAYMENT_PENDING", label: "Payment Pending", color: "border-orange-500", badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { key: "PAID", label: "Paid & Deal", color: "border-emerald-500", badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
];

export const Leads: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageKey, setDragOverStageKey] = useState<string | null>(null);
  const [filterBranchId, setFilterBranchId] = useState<string>("ALL");
  const [newLead, setNewLead] = useState({ customer_name: "", phone_number: "", domicile: "Jakarta", source: "WHATSAPP" });

  const effectiveBranchId = user?.role !== "ADMIN_PUSAT" && user?.branch_id ? user.branch_id : (filterBranchId === "ALL" ? undefined : filterBranchId);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => crmApi.getBranches(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", effectiveBranchId],
    queryFn: () => crmApi.getLeads(effectiveBranchId),
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

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageKey !== stageKey) {
      setDragOverStageKey(stageKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverStageKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverStageKey(null);
    const leadId = e.dataTransfer.getData("leadId") || draggedLeadId;
    if (leadId) {
      updateStatusMutation.mutate({ id: leadId, status: targetStageKey });
      setDraggedLeadId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Users className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <span>WhatsApp Leads & Drag-and-Drop Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Geser kartu (*Drag & Drop*) untuk memindahkan status lead dari New Lead hingga Paid & Deal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "ADMIN_PUSAT" ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
              <Filter className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="bg-transparent text-xs text-slate-800 dark:text-zinc-200 font-bold focus:outline-none"
              >
                <option value="ALL">🌐 Semua Cabang (Pusat View)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-500" />
              <span>Cabang: {user?.branch?.name || "Terkunci"}</span>
            </div>
          )}

          <Button onClick={() => setShowAddModal(true)} variant="primary" size="md">
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Tambah Lead Manual</span>
          </Button>
        </div>
      </div>

      {/* Spacious Horizontal Scrollable Drag & Drop Kanban Pipeline */}
      <div className="flex gap-5 overflow-x-auto pb-6 pt-1 min-h-[560px]">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const isDragTarget = dragOverStageKey === stage.key;

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`w-80 shrink-0 rounded-2xl p-4 transition-all flex flex-col ${
                isDragTarget
                  ? "bg-teal-500/10 border-2 border-dashed border-teal-500 dark:bg-teal-500/10 scale-[1.01]"
                  : "bg-slate-100/70 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80"
              }`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${stage.color}`}>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{stage.label}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${stage.badgeColor}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Column Cards Drop Area */}
              <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-40 flex items-center justify-center p-4 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl">
                    <span>{isDragTarget ? "Drop Kartu Di Sini" : "Kosong"}</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={() => setDraggedLeadId(null)}
                      className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl space-y-3 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md ${
                        draggedLeadId === lead.id ? "opacity-40 scale-95 border-teal-500" : "border-slate-200/90 dark:border-zinc-800 hover:border-teal-500/50"
                      }`}
                    >
                      {/* Card Title & Branch Badge */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {lead.customer_name?.slice(0, 2).toUpperCase() || "WA"}
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 truncate">{lead.customer_name}</h4>
                        </div>
                        <Badge variant="teal" className="text-[10px] py-0.5 px-2 font-bold shrink-0">
                          {lead.branch?.name || lead.branch?.code || "DGT Pusat"}
                        </Badge>
                      </div>

                      {/* Card Body Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                        <p className="font-mono flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{formatPhoneNumber(lead.phone_number)}</span>
                        </p>

                        <p className="flex items-center gap-2 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{lead.branch?.name || lead.domicile || "DGT Pusat"}</span>
                        </p>
                      </div>

                      {/* Handover Note Badge */}
                      {lead.handover_note && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <span className="line-clamp-2">{lead.handover_note}</span>
                        </div>
                      )}

                      {/* Card Footer Drag Handle */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                        <Badge variant="emerald" className="text-[10px] py-0.5 px-2">
                          {lead.source}
                        </Badge>

                        <div className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                          <span>Drag to move</span>
                        </div>
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
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Nomor WhatsApp:</label>
                <input
                  type="text"
                  value={newLead.phone_number}
                  onChange={(e) => setNewLead({ ...newLead, phone_number: e.target.value })}
                  placeholder="081234567890"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Domisili / Kota:</label>
                <input
                  type="text"
                  value={newLead.domicile}
                  onChange={(e) => setNewLead({ ...newLead, domicile: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setShowAddModal(false)} variant="secondary" size="sm">
                Batal
              </Button>
              <Button
                onClick={() => createMutation.mutate(newLead)}
                disabled={createMutation.isPending || !newLead.customer_name || !newLead.phone_number}
                variant="primary"
                size="sm"
              >
                Simpan Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
