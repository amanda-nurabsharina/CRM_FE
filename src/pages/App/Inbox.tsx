import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, Conversation } from "../../api/crmApi";
import { useAuthStore } from "../../store/useAuthStore";
import { MessageSquare, Send, MapPin, Trash2, ArrowRightLeft, Check, CheckCheck, X, Building2, User, Phone, PhoneCall, Filter, Volume2, VolumeX, Bell, Plus, UserPlus, RefreshCw } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { formatPhoneNumber } from "../../utils/formatters";
import { playIncomingNotificationSound } from "../../utils/sound";

export const InboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string>("ALL");

  // New Chat / Start Conversation Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Notification Sound & Toast States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string } | null>(null);
  const notifiedMsgIdsRef = useRef<Set<string>>(new Set());

  const effectiveBranchId = user?.role !== "ADMIN_PUSAT" && user?.branch_id ? user.branch_id : (filterBranchId === "ALL" ? undefined : filterBranchId);

  const { data: convs = [], isLoading: isLoadingConvs, isFetching: isFetchingConvs } = useQuery({
    queryKey: ["conversations", effectiveBranchId],
    queryFn: () => crmApi.getConversations(effectiveBranchId),
    refetchInterval: 1000,
  });

  const { data: bridgeStatus } = useQuery({
    queryKey: ["wa-bridge-status"],
    queryFn: async () => {
      try {
        return await ky.get("/wa-bridge/status").json<{ status: string; is_syncing_history?: boolean; synced_count?: number }>();
      } catch (e) {
        return null;
      }
    },
    refetchInterval: 2000,
  });

  const handleResetSession = async () => {
    if (confirm("Apakah Anda yakin ingin mengimpor ulang / scan QR WhatsApp baru?")) {
      try {
        await ky.post("/wa-bridge/reset").json();
        alert("Sesi WhatsApp di-reset. Silakan scan QR code baru untuk menyinkronkan ulang!");
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err: any) {
        alert("Gagal reset sesi: " + err.message);
      }
    }
  };

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

  const [liveAvatar, setLiveAvatar] = useState<string | null>(null);
  const activePhone = activeConv?.lead?.phone_number;

  useEffect(() => {
    setLiveAvatar(activeConv?.lead?.avatar_url || null);
    if (activePhone && !activeConv?.lead?.avatar_url) {
      fetch(`/wa-bridge/avatar?phone=${activePhone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.avatar_url) {
            setLiveAvatar(data.avatar_url);
          }
        })
        .catch(() => {});
    }
  }, [activeConv?.id, activePhone, activeConv?.lead?.avatar_url]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeConv?.id],
    queryFn: () => (activeConv ? crmApi.getMessages(activeConv.id) : Promise.resolve([])),
    enabled: !!activeConv,
    refetchInterval: 1000,
  });

  const isFirstLoadRef = useRef<Record<string, boolean>>({});

  // Sound Notification Effect for Inbound Messages (Only trigger for brand new live incoming messages)
  useEffect(() => {
    if (!activeConv || messages.length === 0) return;

    const convId = activeConv.id;

    // If this is the first time opening/loading this conversation, mark all existing messages as notified without sound
    if (!isFirstLoadRef.current[convId]) {
      messages.forEach((m) => notifiedMsgIdsRef.current.add(m.id));
      isFirstLoadRef.current[convId] = true;
      return;
    }

    // Check for brand new live incoming messages that arrived after opening the chat
    const brandNewInbound = messages.filter(
      (m) => m.direction === "INBOUND" && !notifiedMsgIdsRef.current.has(m.id)
    );

    if (brandNewInbound.length > 0) {
      brandNewInbound.forEach((m) => notifiedMsgIdsRef.current.add(m.id));
      const latest = brandNewInbound[brandNewInbound.length - 1];

      if (soundEnabled) {
        playIncomingNotificationSound();
      }
      setToastNotification({
        title: `💬 Pesan Baru dari ${activeConv.lead?.customer_name || "Pelanggan"}`,
        body: latest.content,
      });
      setTimeout(() => setToastNotification(null), 5000);
    }
  }, [messages, soundEnabled, activeConv?.id]);

  const sendMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      crmApi.sendMessage(convId, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConv?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (convId: string) => crmApi.deleteConversation(convId),
    onSuccess: () => {
      setSelectedConvId(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handoverMutation = useMutation({
    mutationFn: ({ leadId, branchId, note }: { leadId: string; branchId: string; note: string }) =>
      crmApi.handoverLead(leadId, branchId, note),
    onSuccess: () => {
      setShowHandoverModal(false);
      setHandoverNote("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMutation.mutate({ convId: activeConv.id, text: messageText.trim() });
  };

  const handleDeleteChat = (convId: string, customerName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus seluruh riwayat chat dengan "${customerName}"? Tindakan ini tidak dapat dibatalkan.`)) {
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

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneInput = newChatPhone.trim();
    if (!phoneInput) return;

    const digitsOnly = phoneInput.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 5) {
      alert("Nomor telepon tidak valid! Harap masukkan nomor HP WhatsApp berupa angka (contoh: 081298765432 atau 6281298765432).");
      return;
    }

    setIsCreatingChat(true);
    try {
      const conv = await crmApi.startNewConversation(
        newChatPhone.trim(),
        newChatName.trim() || undefined,
        newChatMessage.trim() || undefined
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setShowNewChatModal(false);
      setNewChatPhone("");
      setNewChatName("");
      setNewChatMessage("");
      if (conv?.id) {
        setSelectedConvId(conv.id);
      }
    } catch (err: any) {
      alert("Gagal memulai pesan baru: " + (err?.response?.data?.message || err.message));
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDirectWhatsAppCall = (phone?: string, name?: string) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);

    // Open WhatsApp Web directly in new window (no call overlay modal)
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, "_blank");
    setShowCallModal(false);
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
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              title="Kirim Pesan WhatsApp Baru ke Nomor Telepon Mana Saja"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Pesan Baru</span>
            </button>
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

        {bridgeStatus?.is_syncing_history && (
          <div className="p-3 bg-teal-500/10 border-b border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center gap-2 animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin text-teal-500 shrink-0" />
            <div className="min-w-0">
              <p className="truncate">Mengimpor riwayat chat WhatsApp...</p>
              <p className="text-[10px] opacity-80">{bridgeStatus.synced_count || 0} pesan terimpor</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
          {isLoadingConvs ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 dark:bg-zinc-800/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : convs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-3">
              <div className="h-12 w-12 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <p className="font-extrabold text-slate-700 dark:text-zinc-300 text-sm">Belum ada percakapan masuk</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  {bridgeStatus?.is_syncing_history
                    ? `⚡ Sedang menyinkronkan riwayat chat dari WhatsApp... (${bridgeStatus.synced_count || 0} pesan terimpor)`
                    : "Silakan kirim pesan baru atau scan QR WhatsApp untuk mengimpor histori obrolan."}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Mulai Chat Baru</span>
                </button>
              </div>
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
                    {conv.lead?.avatar_url ? (
                      <img
                        src={conv.lead.avatar_url}
                        alt={customerName}
                        className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                        {customerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-zinc-100">{customerName}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {conv.unread_count && conv.unread_count > 0 ? (
                            <span className="h-4.5 min-w-[1.125rem] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
                              {conv.unread_count}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
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
                        <div className="mt-1.5 p-1 px-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-700 dark:text-amber-300 truncate italic">
                          <span>⇄ Note: {conv.lead.handover_note}</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Width Chat View */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
          <div className="min-h-16 py-2 px-3 sm:px-5 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {liveAvatar || activeConv.lead?.avatar_url ? (
                <img
                  src={liveAvatar || activeConv.lead?.avatar_url}
                  alt={activeConv.lead?.customer_name || "WA"}
                  className="h-9 w-9 rounded-full object-cover shrink-0 border border-emerald-500/50 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {activeConv.lead?.customer_name?.slice(0, 2).toUpperCase() || "WA"}
                </div>
              )}
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100 truncate leading-tight">{activeConv.lead?.customer_name || "WhatsApp Customer"}</h3>
                  <Badge variant="indigo" className="text-[9px] py-0.5 px-1.5 font-bold shrink-0">
                    {activeConv.lead?.status || "NEW"}
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  <span>{formatPhoneNumber(activeConv.lead?.phone_number)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-semibold truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-teal-500" />
                    <span className="truncate">{activeConv.lead?.branch?.name || activeConv.lead?.domicile || "DGT Pusat"}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDirectWhatsAppCall(activeConv.lead?.phone_number, activeConv.lead?.customer_name)}
                className="h-8.5 w-8.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Panggil WA Direct (Softphone)"
              >
                <PhoneCall className="h-4 w-4 text-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => setShowHandoverModal(true)}
                className="h-8.5 w-8.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Handover Cabang & Catatan"
              >
                <ArrowRightLeft className="h-4 w-4 text-teal-500" />
              </button>

              {user?.role === "ADMIN_PUSAT" && (
                <button
                  onClick={() => handleDeleteChat(activeConv.id, activeConv.lead?.customer_name || "Customer")}
                  disabled={deleteMutation.isPending}
                  className="h-8.5 w-8.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Hapus Chat (Admin Pusat)"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}

              <button
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  if (nextState) playIncomingNotificationSound();
                }}
                className={`h-8.5 w-8.5 border rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                  soundEnabled
                    ? "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30"
                    : "bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700"
                }`}
                title={soundEnabled ? "Dering Chat Masuk Aktif" : "Dering Matikan"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-teal-500" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
              </button>

              <div className="h-8.5 px-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap shrink-0 shadow-sm" title="WhatsApp API Connected">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Online</span>
              </div>
            </div>
          </div>

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
                    {msg.content.includes("Panggilan") || msg.content.includes("Call") ? (
                      <div className="max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-2 border-amber-500/30 text-slate-800 dark:text-zinc-200 shadow-md">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <PhoneCall className="h-4 w-4 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-amber-700 dark:text-amber-300">Panggilan WhatsApp Masuk</h4>
                            <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">{msg.content}</p>
                          </div>
                        </div>

                        {/* Call Action Options */}
                        <div className="pt-2 border-t border-amber-500/20 flex items-center gap-2">
                          <a
                            href={`https://wa.me/${activeConv?.lead?.phone_number?.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Telepon Balik di WA</span>
                          </a>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                            *Panggilan via Web WhatsApp dapat direspon via HP/Aplikasi WA
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-lg px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isOutbound
                            ? "bg-teal-600 text-white rounded-br-none shadow-lg shadow-teal-600/10"
                            : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-bl-none shadow-sm"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 dark:text-zinc-500">
                      <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isOutbound && (
                        msg.is_read || msg.status === "READ" ? (
                          <CheckCheck className="h-3.5 w-3.5 text-sky-400 font-bold" title="Dibaca (Read)" />
                        ) : msg.status === "DELIVERED" ? (
                          <CheckCheck className="h-3.5 w-3.5 text-slate-400" title="Tersampaikan (Delivered)" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-slate-400" title="Terkirim (Sent)" />
                        )
                      )}
                    </div>
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

      {/* WHATSAPP CALL OPTIONS MODAL */}
      {showCallModal && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Panggil Pelanggan WhatsApp</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    {formatPhoneNumber(activeConv.lead?.phone_number)}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              Pilih metode panggilan yang ingin Anda gunakan untuk menghubungi <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{activeConv.lead?.customer_name || "Pelanggan"}</span>:
            </p>

            <div className="space-y-3">
              {/* Option 1: Direct WhatsApp Desktop Call */}
              <button
                onClick={() => handleDirectWhatsAppCall(activeConv.lead?.phone_number)}
                className="w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-left flex items-start gap-3 transition-all group"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>1. Panggil via WhatsApp Desktop / App</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    Memicu panggilan langsung di aplikasi WhatsApp Desktop / Web WhatsApp yang terinstall di perangkat Anda.
                  </p>
                </div>
              </button>

              {/* Option 2: WebRTC Voice Call (Softphone & WA Link) */}
              <button
                onClick={() => handleDirectWhatsAppCall(activeConv.lead?.phone_number, activeConv.lead?.customer_name)}
                className="w-full p-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-2xl text-left flex items-start gap-3 transition-all group"
              >
                <div className="h-9 w-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                    <span>2. WebRTC Softphone Call (Web Engine)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    Buka Softphone panggilan audio di CRM & hubungkan voice stream langsung di browser Web.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
              >
                Batal
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

      {/* New Chat / Start Conversation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5" />
                <span>Kirim Pesan WhatsApp Baru</span>
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Nomor HP WhatsApp Target: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="Misal: 081298765432 atau 6281298765432"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Nama Pelanggan (Opsional):
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 mb-1">
                  Pesan Pertama:
                </label>
                <textarea
                  rows={3}
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Halo, salam dari DGT WhatsApp CRM..."
                  className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !newChatPhone.trim()}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-teal-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isCreatingChat ? "Mengirim..." : "Kirim Pesan WA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
