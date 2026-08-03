import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { Users, Phone, MapPin, UserPlus, GripVertical, MoveRight, MessageSquare } from "lucide-react";
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
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageKey, setDragOverStageKey] = useState<string | null>(null);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Users className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <span>WhatsApp Leads & Pipeline Drag-and-Drop</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Geser kartu (*Drag & Drop*) untuk memindahkan status lead dari New Lead hingga Paid & Deal.
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} variant="primary" size="md">
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Tambah Lead Manual</span>
        </Button>
      </div>

      {/* Interactive Drag & Drop Kanban Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const isDragTarget = dragOverStageKey === stage.key;

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`p-3.5 rounded-2xl transition-all flex flex-col min-h-[480px] ${
                isDragTarget
                  ? "bg-teal-500/10 border-2 border-dashed border-teal-500 dark:bg-teal-500/10 scale-[1.01]"
                  : "bg-slate-100/70 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80"
              }`}
            >
              <div className={`flex items-center justify-between pb-2.5 border-b-2 ${stage.color}`}>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{stage.label}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {stageLeads.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pt-3 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-4 text-center text-[11px] text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl">
                    <span>{isDragTarget ? "Drop Kartu Di Sini" : "Kosong"}</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={() => setDraggedLeadId(null)}
                      className={`p-3.5 bg-white dark:bg-zinc-900 border rounded-xl space-y-2.5 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md ${
                        draggedLeadId === lead.id ? "opacity-40 scale-95 border-teal-500" : "border-slate-200 dark:border-zinc-800 hover:border-teal-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-4 w-4 text-slate-300 dark:text-zinc-600 shrink-0" />
                          <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 truncate">{lead.customer_name}</span>
                        </div>
                        <Badge variant="teal" className="text-[9px] py-0.5 px-1.5 font-bold shrink-0">
                          {lead.branch?.name || lead.branch?.code || "DGT Pusat"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 pl-5">
                        <Phone className="h-3 w-3 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{lead.phone_number}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pl-5 font-medium">
                        <MapPin className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{lead.branch?.name || lead.domicile || "DGT Pusat"}</span>
                      </p>

                      {lead.handover_note && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-700 dark:text-amber-300 leading-tight flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                          <span className="truncate">{lead.handover_note}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex justify-between items-center text-[10px]">
                        <Badge variant="emerald" className="text-[9px] py-0 px-1.5">
                          {lead.source}
                        </Badge>

                        <div className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                          <MoveRight className="h-3 w-3" />
                          <span>Drag me</span>
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
