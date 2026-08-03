import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Conversation } from "../../api/crmApi";
import { useAuthStore } from "../../store/useAuthStore";
import { MessageSquare, Send, MapPin, Trash2, ArrowRightLeft, Check, X, Building2, User, Phone, Filter, Volume2, VolumeX, Bell } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { formatPhoneNumber } from "../../utils/formatters";
import { playIncomingNotificationSound } from "../../utils/sound";

export const InboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string>("ALL");

  // Notification Sound & Toast States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string } | null>(null);
  const prevLastMsgIdRef = useRef<string | null>(null);

  const effectiveBranchId = user?.role !== "ADMIN_PUSAT" && user?.branch_id ? user.branch_id : (filterBranchId === "ALL" ? undefined : filterBranchId);

  const { data: convs = [] } = useQuery({
    queryKey: ["conversations", effectiveBranchId],
    queryFn: () => crmApi.getConversations(effectiveBranchId),
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

  // Sound Ringer Effect on Incoming Message
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      if (
        prevLastMsgIdRef.current &&
        latestMsg.id !== prevLastMsgIdRef.current &&
        latestMsg.direction === "INBOUND"
      ) {
        if (soundEnabled) {
          playIncomingNotificationSound();
        }
        setToastNotification({
          title: `🔔 Chat Masuk: ${activeConv?.lead?.customer_name || "Pelanggan"}`,
          body: latestMsg.content,
        });
        setTimeout(() => setToastNotification(null), 5000);
      }
      prevLastMsgIdRef.current = latestMsg.id;
    }
  }, [messages, activeConv?.id, soundEnabled]);

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
    onError: (err: any) => {
      alert("❌ Akses Ditolak: Hanya Admin Pusat yang memiliki wewenang untuk menghapus percakapan WhatsApp.");
    },
  });

  const handoverMutation = useMutation({
    mutationFn: ({ leadId, branchId, note }: { leadId: string; branchId: string; note: string }) =>
      crmApi.handoverLead(leadId, branchId, note),
    onSuccess: () => {
      setShowHandoverModal(false);
      alert("Handover cabang & catatan serah terima berhasil diproses!");
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
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquare className="h-5 w-5 text-teal-500 dark:text-teal-400" />
              <span>WhatsApp Inbox</span>
            </h2>
          </div>

          {/* Branch Filter Selector */}
          {user?.role === "ADMIN_PUSAT" ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Filter View Cabang:
              </label>
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-teal-500"
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
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-teal-500 shrink-0" />
              <span className="truncate">{user?.branch?.name || "Cabang Terkunci"}</span>
            </div>
          )}
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
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{formatPhoneNumber(conv.lead?.phone_number)}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge variant="teal" className="text-[9px] py-0 px-1.5 font-bold">
                          {conv.lead?.branch?.name || "DGT Pusat"}
                        </Badge>
                        <Badge variant="indigo" className="text-[9px] py-0 px-1.5">
                          {conv.lead?.status || "NEW"}
                        </Badge>
                      </div>

                      {conv.lead?.handover_note && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate mt-1.5 flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                          <ArrowRightLeft className="h-3 w-3 shrink-0 text-amber-500" />
                          <span className="truncate">Note: {conv.lead.handover_note}</span>
                        </p>
                      )}
                    </div>
                  </button>

                  {user?.role === "ADMIN_PUSAT" && (
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
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Width Chat View */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
          {/* Responsive Precision Aligned Chat Header */}
          <div className="min-h-16 py-2.5 px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {activeConv.lead?.customer_name?.slice(0, 2).toUpperCase() || "WA"}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate leading-snug">{activeConv.lead?.customer_name || "WhatsApp Customer"}</h3>
                  <Badge variant="indigo" className="text-[10px] py-0.5 px-2 font-bold shrink-0">
                    {activeConv.lead?.status || "NEW"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  <span>{formatPhoneNumber(activeConv.lead?.phone_number)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-teal-500" />
                    <span className="truncate">{activeConv.lead?.branch?.name || activeConv.lead?.domicile || "DGT Pusat"}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Compact Efficient Action Buttons & Status Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowHandoverModal(true)}
                className="h-8.5 px-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm shrink-0"
                title="Pindah Cabang & Catatan Handover"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                <span>Handover</span>
              </button>

              {user?.role === "ADMIN_PUSAT" && (
                <button
                  onClick={() => handleDeleteChat(activeConv.id, activeConv.lead?.customer_name || "Customer")}
                  disabled={deleteMutation.isPending}
                  className="h-8.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm shrink-0"
                  title="Hapus Percakapan (Wewenang Khusus Admin Pusat)"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span>Hapus Chat</span>
                </button>
              )}

              {/* Sound Ringer Toggle & Test Button */}
              <button
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  if (nextState) playIncomingNotificationSound();
                }}
                className={`h-8.5 px-2.5 border rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm shrink-0 ${
                  soundEnabled
                    ? "bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30"
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700"
                }`}
                title={soundEnabled ? "Dering Dering Chat Masuk Aktif (Klik untuk Matikan / Tes Suara Dering)" : "Dering Matikan (Klik untuk Aktifkan Dering)"}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-teal-500" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
                <span>{soundEnabled ? "Dering ON" : "Mute"}</span>
              </button>

              <div className="h-8.5 px-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Prominent Handover Note Banner */}
          {activeConv.lead?.handover_note && (
            <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium shrink-0 animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-extrabold shrink-0">Catatan Handover Cabang:</span>
                <span className="truncate italic font-semibold">"{activeConv.lead.handover_note}"</span>
              </div>
              <button
                onClick={() => setShowHandoverModal(true)}
                className="text-[10px] underline font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 shrink-0 ml-2"
              >
                Edit Note
              </button>
            </div>
          )}

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
                      className={`max-w-lg px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
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
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
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

      {/* Handover Modal Popup */}
      {showHandoverModal && activeConv?.lead && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-teal-500" />
                <span>Form Handover & Serah Terima Lead</span>
              </h3>
              <button
                onClick={() => setShowHandoverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead Summary Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Customer:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{activeConv.lead.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Nomor WA:</span>
                <span className="font-mono text-slate-800 dark:text-zinc-200">{activeConv.lead.phone_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Cabang Saat Ini:</span>
                <Badge variant="teal" className="text-[10px] py-0.5 px-2 font-bold">
                  {activeConv.lead.branch?.name || "DGT Pusat"}
                </Badge>
              </div>
            </div>

            {/* Handover Form Inputs */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-teal-500" />
                  <span>Pindah ke Cabang Tujuan:</span>
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 truncate"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>

                {(() => {
                  const selectedBranch = branches.find((b) => b.id === targetBranchId);
                  return selectedBranch ? (
                    <div className="mt-2.5 p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-[11px] text-teal-700 dark:text-teal-300 flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-teal-500" />
                      <div>
                        <span className="font-bold block">Cakupan Area:</span>
                        <span className="text-slate-600 dark:text-zinc-400">{selectedBranch.coverage_areas}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5">
                  Catatan Serah Terima (Handover Note):
                </label>
                <textarea
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Ketik catatan serah terima antar admin cabang (misal: Pelanggan minta berangkat via Medan bulan depan)..."
                  className="w-full h-28 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveHandover}
                disabled={handoverMutation.isPending || !targetBranchId}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{handoverMutation.isPending ? "Memproses..." : "Proses Handover"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification for Incoming WhatsApp Message */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-teal-500/50 flex items-start gap-3 max-w-sm">
          <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-xs font-extrabold text-teal-300">{toastNotification.title}</h4>
            <p className="text-xs text-slate-200 truncate">{toastNotification.body}</p>
          </div>
          <button onClick={() => setToastNotification(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
