import React, { useState, useEffect, useRef } from "react";
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Phone, X, ShieldCheck, ArrowRightLeft, UserCheck } from "lucide-react";
import { crmApi, Branch } from "../../api/crmApi";
import { formatPhoneNumber } from "../../utils/formatters";

export const VoIPSoftphone: React.FC = () => {
  const [callState, setCallState] = useState<"IDLE" | "RINGING" | "CONNECTED">("IDLE");
  const [callerInfo, setCallerInfo] = useState<{
    phone: string;
    name: string;
    line: string;
    sessionId: string;
    channel: "WHATSAPP" | "PSTN";
    direction: "INBOUND" | "OUTBOUND";
    provider: string;
    providerCallId: string;
  }>({
    phone: "6281298765432",
    name: "BettaQuatic_Splash",
    line: "WhatsApp Business Voice Engine",
    sessionId: "557547",
    channel: "WHATSAPP",
    direction: "INBOUND",
    provider: "WHATSAPP_BUSINESS",
    providerCallId: "",
  });

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [targetBranchId, setTargetBranchId] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<any>(null);

  useEffect(() => {
    crmApi.getBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    const handleVoIPCallEvent = (e: any) => {
      const phone = e.detail?.sipLine || "6281298765432";
      const channel = e.detail?.channel || "WHATSAPP";
      const direction = e.detail?.direction || "INBOUND";
      const provider = e.detail?.provider || "WHATSAPP_BUSINESS";
      const name = e.detail?.name || "BettaQuatic_Splash";
      const providerCallId = e.detail?.providerCallId || `WACALL-${Date.now()}`;
      const sessionId = Math.floor(100000 + Math.random() * 900000).toString();

      setCallerInfo({
        phone: phone,
        name: name,
        line: channel === "WHATSAPP" ? "WhatsApp Business Voice Engine" : `SIP Line #${phone}`,
        sessionId: sessionId,
        channel: channel,
        direction: direction,
        provider: provider,
        providerCallId: providerCallId,
      });

      setCallState("RINGING");

      crmApi.triggerVoiceWebhook({
        provider: provider,
        provider_call_id: providerCallId,
        channel: channel,
        direction: direction,
        caller_number: phone,
        status: "RINGING",
      }).catch(() => {});
    };

    window.addEventListener("trigger-voip-call", handleVoIPCallEvent);
    return () => {
      window.removeEventListener("trigger-voip-call", handleVoIPCallEvent);
    };
  }, []);

  useEffect(() => {
    let ringInterval: any = null;
    if (callState === "RINGING") {
      const playRingtone = () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        } catch (e) {}
      };

      playRingtone();
      ringInterval = setInterval(playRingtone, 2800);
    } else {
      if (ringInterval) clearInterval(ringInterval);
    }
    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [callState]);

  useEffect(() => {
    if (callState === "CONNECTED") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleAnswerCall = async () => {
    setCallState("CONNECTED");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      }
    } catch (e) {
      console.warn("WebRTC Audio microphone connection notice:", e);
    }

    crmApi.triggerVoiceWebhook({
      provider: callerInfo.provider,
      provider_call_id: callerInfo.providerCallId,
      channel: callerInfo.channel,
      direction: callerInfo.direction,
      caller_number: callerInfo.phone,
      status: "ANSWERED",
    }).catch(() => {});
  };

  const handleHangUp = async () => {
    const finalDuration = callDuration;
    setCallState("IDLE");
    setCallDuration(0);
    setShowTransferModal(false);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      await crmApi.triggerVoiceWebhook({
        provider: callerInfo.provider,
        provider_call_id: callerInfo.providerCallId,
        channel: callerInfo.channel,
        direction: callerInfo.direction,
        caller_number: callerInfo.phone,
        status: "COMPLETED",
        duration_seconds: finalDuration,
      });
    } catch (e) {}
  };

  const handleRejectCall = () => {
    setCallState("IDLE");
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    crmApi.triggerVoiceWebhook({
      provider: callerInfo.provider,
      provider_call_id: callerInfo.providerCallId,
      channel: callerInfo.channel,
      direction: callerInfo.direction,
      caller_number: callerInfo.phone,
      status: "REJECTED",
    }).catch(() => {});
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleExecuteTransfer = async () => {
    if (!targetBranchId) return;
    try {
      await crmApi.triggerVoiceWebhook({
        provider: callerInfo.provider,
        provider_call_id: callerInfo.providerCallId,
        channel: callerInfo.channel,
        direction: callerInfo.direction,
        caller_number: callerInfo.phone,
        status: "TRANSFERRED",
        duration_seconds: callDuration,
      });
      alert(`✅ Panggilan berhasil di-transfer! Catatan: ${transferNote || "Direct Transfer"}`);
      setCallState("IDLE");
      setShowTransferModal(false);
    } catch (e) {
      alert("Gagal melakukan transfer panggilan.");
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {callState === "RINGING" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111827] border-2 border-[#10B981]/50 rounded-3xl p-7 shadow-2xl text-white text-center space-y-6 animate-fadeIn">
            <div className="mx-auto h-24 w-24 rounded-full bg-[#10B981]/15 border-2 border-[#10B981] flex items-center justify-center text-[#10B981] shadow-xl shadow-[#10B981]/25 animate-pulse">
              <PhoneCall className="h-11 w-11 animate-bounce text-[#10B981]" />
            </div>

            <div className="space-y-2">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#10B981]/15 border border-[#10B981]/30 rounded-full text-[10px] font-extrabold text-[#10B981] tracking-wider uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {callerInfo.channel === "WHATSAPP" ? "WHATSAPP BUSINESS VOICE CALL" : "PSTN / SIP TELEPHONY CALL"}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{callerInfo.name}</h2>
              <p className="text-xs font-mono text-[#10B981] font-bold">
                Sesi WA #{callerInfo.sessionId}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{callerInfo.line}</p>
            </div>

            <div className="flex items-center justify-center gap-8 pt-2">
              <button
                onClick={handleRejectCall}
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-transform active:scale-95"
                title="Tolak / Batal Panggilan"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              <button
                onClick={handleAnswerCall}
                className="h-16 w-16 rounded-full bg-[#10B981] hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-extrabold shadow-xl shadow-[#10B981]/40 transition-transform active:scale-95 animate-pulse"
                title="Angkat & Konek Panggilan Voice Audio"
              >
                <Phone className="h-7 w-7 text-slate-950 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {callState === "CONNECTED" && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-[#111827] border-2 border-[#10B981] rounded-2xl shadow-2xl text-white flex items-center gap-4 max-w-md animate-fadeIn">
          <div className="h-11 w-11 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
            <Volume2 className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase bg-[#10B981] text-slate-950">
                VOICE CONNECTED
              </span>
              <h4 className="text-xs font-extrabold text-emerald-300 truncate">{callerInfo.name}</h4>
              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded font-mono font-extrabold">
                {formatTimer(callDuration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-slate-400 font-mono">{formatPhoneNumber(callerInfo.phone)}</span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-0.5">
                <span className="h-2 w-1 rounded-full bg-[#10B981] animate-pulse" style={{ height: `${Math.max(4, audioLevel * 0.2)}px` }} />
                <span className="h-3 w-1 rounded-full bg-[#10B981] animate-pulse" style={{ height: `${Math.max(6, audioLevel * 0.3)}px` }} />
                <span className="h-2 w-1 rounded-full bg-[#10B981] animate-pulse" style={{ height: `${Math.max(4, audioLevel * 0.15)}px` }} />
              </div>
              <span className="text-[9px] text-[#10B981] font-bold">Audio Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl border transition-colors ${
                isMuted ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title={isMuted ? "Unmute Mikrofon" : "Mute Mikrofon"}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setShowTransferModal(true)}
              className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl hover:bg-amber-500/30 transition-colors"
              title="Transfer Panggilan ke Cabang / Agent Lain"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <button
              onClick={handleHangUp}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md shadow-red-600/30"
              title="Akhiri Panggilan Voice"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfer Panggilan Suara</span>
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Pilih Cabang Tujuan:</label>
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="">-- Pilih Cabang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Catatan Transfer:</label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Misal: Pelanggan butuh konsultasi visa Eropa..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 bg-zinc-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-zinc-700"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteTransfer}
                disabled={!targetBranchId}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Proses Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
