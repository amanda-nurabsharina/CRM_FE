import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { MessageSquare, Send, MapPin, Trash2, ArrowRightLeft, Check, Building2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const InboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");

  const { data: convs = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => crmApi.getConversations(),
    refetchInterval: 1000,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => crmApi.getBranches(),
  });

  const activeConv = convs.find((c) => c.id === selectedConvId) || convs[0];

  useEffect(() => {
    if (activeConv?.lead) {
      setTargetBranchId(activeConv.lead.branch_id || (branches[0]?.id || ""));
      setHandoverNote(activeConv.lead.handover_note || "");
    }
  }, [activeConv?.id, activeConv?.lead?.branch_id]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeConv?.id],
    queryFn: () => (activeConv ? crmApi.getMessages(activeConv.id) : Promise.resolve([])),
    enabled: !!activeConv,
    refetchInterval: 1000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      crmApi.sendMessage(convId, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConv?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (convId: string) => crmApi.deleteConversation(convId),
    onSuccess: () => {
      setSelectedConvId(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handoverMutation = useMutation({
    mutationFn: ({ leadId, branchId, note }: { leadId: string; branchId: string; note: string }) =>
      crmApi.handoverLead(leadId, branchId, note),
    onSuccess: () => {
      alert("Handover cabang & catatan serah terima berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMutation.mutate({ convId: activeConv.id, text: messageText });
  };

  const handleDeleteChat = (convId: string, name: string) => {
    if (confirm(`Hapus percakapan WA "${name}" & reset data lead untuk pengujian ulang dari awal?`)) {
      deleteMutation.mutate(convId);
    }
  };

  const handleSaveHandover = () => {
    if (!activeConv?.lead) return;
    handoverMutation.mutate({
      leadId: activeConv.lead.id,
      branchId: targetBranchId,
      note: handoverNote,
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Left List of Conversations */}
      <div className="w-80 border-r border-slate-200 dark:border-zinc-800/80 flex flex-col bg-white dark:bg-zinc-900/30">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquare className="h-5 w-5 text-teal-500 dark:text-teal-400" />
              <span>WhatsApp Inbox</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Multi-branch customer chats</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
          {convs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              Belum ada percakapan masuk. Kirim pesan WA ke HP terhubung untuk tes chat.
            </div>
          ) : (
            convs.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              const customerName = conv.lead?.customer_name || "Pelanggan Baru";
              return (
                <div
                  key={conv.id}
                  className={`w-full p-4 text-left transition-colors flex items-start justify-between gap-2 group ${
                    isSelected
                      ? "bg-teal-500/10 dark:bg-teal-500/10 border-l-4 border-teal-500 dark:border-teal-400"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <button
                    onClick={() => setSelectedConvId(conv.id)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                      {customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-zinc-100">{customerName}</p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{conv.lead?.phone_number}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge variant="teal" className="text-[9px] py-0 px-1.5">
                          {conv.lead?.branch?.name || "DGT Pusat"}
                        </Badge>
                        <Badge variant="indigo" className="text-[9px] py-0 px-1.5">
                          {conv.lead?.status || "NEW"}
                        </Badge>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(conv.id, customerName);
                    }}
                    title="Hapus Chat Testing"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center Chat View */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
          {/* Chat Header */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold flex items-center justify-center text-xs">
                {activeConv.lead?.customer_name?.slice(0, 2).toUpperCase() || "WA"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{activeConv.lead?.customer_name || "WhatsApp Customer"}</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                  <span>{activeConv.lead?.phone_number}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                    <MapPin className="h-3 w-3" />
                    {activeConv.lead?.domicile || "Domisili Belum Set"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeleteChat(activeConv.id, activeConv.lead?.customer_name || "Customer")}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Hapus Percakapan & Reset Data Lead untuk Testing Ulang"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Chat (Testing)</span>
              </button>

              <Badge variant="emerald" className="text-xs py-1 px-3">
                WABA Official Connected
              </Badge>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50 dark:bg-zinc-950/60">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs">
                <MessageSquare className="h-8 w-8 text-slate-300 dark:text-zinc-600 mb-2" />
                <p>Belum ada histori pesan pada percakapan ini.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOutbound = msg.direction === "OUTBOUND";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isOutbound
                          ? "bg-teal-600 text-white rounded-br-none shadow-lg shadow-teal-600/10"
                          : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 px-1">
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 flex items-center gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Ketik balasan resmi WhatsApp (Auto-saved to Lead Record)..."
              className="flex-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !messageText.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Kirim WA</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs">
          Pilih percakapan di sebelah kiri untuk memulai percakapan atau kirim pesan WA baru.
        </div>
      )}

      {/* Right Lead Context & Interactive Handover Panel */}
      {activeConv?.lead && (
        <div className="w-80 border-l border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 p-5 space-y-6 overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Informasi Customer</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500">Nama</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{activeConv.lead.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500">Nomor WA</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{activeConv.lead.phone_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500">Cabang Saat Ini</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{activeConv.lead.branch?.name || "DGT Pusat"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500">Status Pipeline</span>
                <Badge variant="indigo" className="text-[10px] py-0 px-2">
                  {activeConv.lead.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Interactive Handover / Transfer Branch Section */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800 pb-2">
              <ArrowRightLeft className="h-4 w-4 text-teal-500" />
              <span>Pindah Cabang & Catatan Handover</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  Pindah Cabang (Transfer Lead):
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
                  Catatan Serah Terima (Handover Note):
                </label>
                <textarea
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Ketik catatan serah terima antar admin cabang (misal: Pelanggan minta berangkat via Medan bulan depan)..."
                  className="w-full h-24 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleSaveHandover}
                disabled={handoverMutation.isPending || !targetBranchId}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Simpan Handover & Pindah Cabang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
