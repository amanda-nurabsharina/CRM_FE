import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { crmApi } from "../../api/crmApi";
import { useAuthStore } from "../../store/useAuthStore";
import { playIncomingNotificationSound } from "../../utils/sound";
import { Bell, MessageSquare, X, ExternalLink, PhoneCall, Phone } from "lucide-react";

export const GlobalWhatsAppNotifier: React.FC = () => {
  const { user } = useAuthStore();
  const [toast, setToast] = useState<{ convId: string; customerName: string; text: string; isCall?: boolean } | null>(null);
  const prevLastMessageAtRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);

  const effectiveBranchId = user?.role !== "ADMIN_PUSAT" ? user?.branch_id : undefined;

  const { data: convs = [] } = useQuery({
    queryKey: ["global-conversations", effectiveBranchId],
    queryFn: () => crmApi.getConversations(effectiveBranchId),
    refetchInterval: 1500,
  });

  useEffect(() => {
    if (convs.length === 0) return;

    convs.forEach((conv) => {
      const prevTime = prevLastMessageAtRef.current[conv.id];
      if (!isFirstLoadRef.current && (prevTime === undefined || conv.last_message_at !== prevTime)) {
        crmApi.getMessages(conv.id).then((msgs) => {
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.direction === "INBOUND") {
              const isCall = lastMsg.message_type === "DOCUMENT" || lastMsg.content.includes("Panggilan") || lastMsg.content.includes("Call");

              playIncomingNotificationSound();

              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(
                  isCall ? `📞 Panggilan WA: ${conv.lead?.customer_name || "Pelanggan"}` : `💬 WhatsApp Chat: ${conv.lead?.customer_name || "Pelanggan"}`,
                  {
                    body: lastMsg.content,
                  }
                );
              }

              setToast({
                convId: conv.id,
                customerName: conv.lead?.customer_name || "Pelanggan WA",
                text: lastMsg.content,
                isCall: isCall,
              });
              setTimeout(() => setToast(null), 7000);
            }
          }
        });
      }
      prevLastMessageAtRef.current[conv.id] = conv.last_message_at;
    });

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [convs]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl flex items-start gap-3 max-w-sm animate-bounce ${
        toast.isCall
          ? "bg-amber-950 text-white border-2 border-amber-500 shadow-amber-500/20"
          : "bg-slate-900 text-white border border-teal-500/50"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          toast.isCall ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-teal-500/20 text-teal-400 border border-teal-500/40"
        }`}
      >
        {toast.isCall ? <PhoneCall className="h-5 w-5 animate-pulse text-amber-400" /> : <Bell className="h-5 w-5 animate-pulse text-teal-400" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className={`text-xs font-extrabold flex items-center gap-1.5 ${toast.isCall ? "text-amber-300" : "text-teal-300"}`}>
          <span>{toast.isCall ? "📞 PANGGILAN WHATSAPP MASUK" : "💬 PESAN WA MASUK"}</span>
        </h4>
        <p className="text-xs font-bold text-slate-100">{toast.customerName}</p>
        <p className="text-[11px] text-slate-300 truncate font-mono">{toast.text}</p>
        <a
          href={`/app/inbox?convId=${toast.convId}`}
          className={`inline-flex items-center gap-1 text-[10px] font-bold underline pt-1 ${toast.isCall ? "text-amber-400 hover:text-amber-300" : "text-teal-400 hover:text-teal-300"}`}
        >
          {toast.isCall ? <Phone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          <span>{toast.isCall ? "Buka Obrolan / Respon Telepon" : "Buka Percakapan WA"}</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
      <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
