import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { MessageSquare, Send, MapPin } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export const InboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: convs = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => crmApi.getConversations(),
  });

  const activeConv = convs.find((c) => c.id === selectedConvId) || convs[0];

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeConv?.id],
    queryFn: () => (activeConv ? crmApi.getMessages(activeConv.id) : Promise.resolve([])),
    enabled: !!activeConv,
  });

  const sendMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      crmApi.sendMessage(convId, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConv?.id] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMutation.mutate({ convId: activeConv.id, text: messageText });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Left List of Conversations */}
      <div className="w-80 border-r border-slate-200 dark:border-zinc-800/80 flex flex-col bg-white dark:bg-zinc-900/30">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80">
          <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <MessageSquare className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            <span>WhatsApp Inbox</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Multi-branch customer chats</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
          {convs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
              Belum ada percakapan masuk. Gunakan webhook simulator untuk tes chat.
            </div>
          ) : (
            convs.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isSelected
                      ? "bg-teal-500/10 dark:bg-teal-500/10 border-l-4 border-teal-500 dark:border-teal-400"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    {conv.lead?.customer_name ? conv.lead.customer_name.slice(0, 2).toUpperCase() : "WA"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-zinc-100">{conv.lead?.customer_name || "Pelanggan Baru"}</p>
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
                  <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                    <MapPin className="h-3 w-3" />
                    {activeConv.lead?.domicile || "Domisili Belum Set"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
          Pilih percakapan di sebelah kiri untuk memulai percakapan.
        </div>
      )}

      {/* Right Lead Context Panel */}
      {activeConv?.lead && (
        <div className="w-72 border-l border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900/40 p-4 space-y-6 overflow-y-auto">
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
                <span className="text-slate-500 dark:text-zinc-500">Cabang</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">{activeConv.lead.branch?.name || "DGT Pusat"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                <span className="text-slate-500 dark:text-zinc-500">Status Pipeline</span>
                <Badge variant="indigo" className="text-[10px] py-0 px-2">
                  {activeConv.lead.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Internal Handover Note</h4>
            <textarea
              defaultValue={activeConv.lead.handover_note || ""}
              placeholder="Catatan serah terima antar admin cabang..."
              className="w-full h-24 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
