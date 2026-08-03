import React, { useState, useEffect, useRef } from "react";
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Phone, X, ShieldCheck } from "lucide-react";
import { crmApi } from "../../api/crmApi";
import { formatPhoneNumber } from "../../utils/formatters";

export const VoIPSoftphone: React.FC = () => {
  const [callState, setCallState] = useState<"IDLE" | "RINGING" | "CONNECTED">("IDLE");
  const [callerInfo, setCallerInfo] = useState<{ phone: string; name: string; line: string }>({
    phone: "6281298765432",
    name: "Budi Santoso (Pelanggan VoIP)",
    line: "SIP Line #021-5500-888",
  });
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound Ringer Effect for Inbound VoIP Call
  useEffect(() => {
    let ringInterval: any = null;
    if (callState === "RINGING") {
      const playRingtone = () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          // Double phone ring sound (440Hz + 480Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
      ringInterval = setInterval(playRingtone, 3000);
    } else {
      if (ringInterval) clearInterval(ringInterval);
    }
    return () => {
      if (ringInterval) clearInterval(ringInterval);
    };
  }, [callState]);

  // Call Duration Counter
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
      // Connect WebRTC Microphone Audio Stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.warn("WebRTC Microphone access:", e);
    }
  };

  const handleHangUp = async () => {
    const finalDuration = callDuration;
    setCallState("IDLE");
    setCallDuration(0);

    // Log call event to CRM backend & Audit Trail
    try {
      await crmApi.sendMessage("", `📞 Panggilan VoIP Terjawab (${finalDuration} detik) dari ${callerInfo.name}`);
    } catch (e) {}
  };

  const handleRejectCall = () => {
    setCallState("IDLE");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* 1. RINGING DIALOG OVERLAY — Inbound VoIP Phone Call */}
      {callState === "RINGING" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-zinc-900 to-slate-950 border-2 border-teal-500/50 rounded-3xl p-6 shadow-2xl text-white text-center space-y-6 animate-pulse">
            <div className="mx-auto h-20 w-20 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/30">
              <PhoneCall className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-500/20 border border-teal-400/40 rounded-full text-[11px] font-bold text-teal-300 uppercase tracking-wider mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Panggilan Masuk VoIP (SIP Trunk)
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">{callerInfo.name}</h2>
              <p className="text-sm font-mono text-emerald-400 font-bold mt-1">
                {formatPhoneNumber(callerInfo.phone)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{callerInfo.line}</p>
            </div>

            {/* Answer / Reject Action Buttons */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={handleRejectCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform active:scale-95"
                title="Tolak Panggilan"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
              <button
                onClick={handleAnswerCall}
                className="h-16 w-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 flex items-center justify-center font-extrabold shadow-xl shadow-teal-500/40 transition-transform active:scale-95 animate-pulse"
                title="Angkat Panggilan WebRTC VoIP"
              >
                <Phone className="h-7 w-7 text-slate-950 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE CONNECTED CALL FLOATING BAR */}
      {callState === "CONNECTED" && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl text-white flex items-center gap-4 max-w-md animate-fadeIn">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Volume2 className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-emerald-300 truncate">{callerInfo.name}</h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                {formatTimer(callDuration)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">{formatPhoneNumber(callerInfo.phone)}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
              title={isMuted ? "Unmute Mikrofon" : "Mute Mikrofon"}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              onClick={handleHangUp}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-red-600/30"
              title="Akhiri Panggilan VoIP"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
