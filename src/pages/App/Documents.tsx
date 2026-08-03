import React from "react";
import { Sparkles, ShieldCheck, FileCheck, User } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export const DocumentsPage: React.FC = () => {
  const sampleTravelers = [
    { name: "Budi Santoso", bookingId: "BKG-260802-001", passport: "A-98765432", passportStatus: "LENGKAP", ktpStatus: "LENGKAP", daysToDeparture: 14 },
    { name: "Siti Rahma", bookingId: "BKG-260802-002", passport: "A-11223344", passportStatus: "LENGKAP", ktpStatus: "LENGKAP", daysToDeparture: 21 },
    { name: "Dewi Lestari", bookingId: "BKG-260802-003", passport: "Belum Unggah", passportStatus: "BELUM_LENGKAP", ktpStatus: "LENGKAP", daysToDeparture: 5 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Sparkles className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <span>Dokumen Perjalanan Paspor & KTP (Encrypted Vault)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Monitoring kelengkapan dokumen per-traveler mendekati H-7 keberangkatan (Encrypted At-Rest & Access Logged).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sampleTravelers.map((t, idx) => (
          <div key={idx} className="p-5 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">{t.name}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Booking ID: {t.bookingId} • Keberangkatan: H-{t.daysToDeparture}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={t.passportStatus === "LENGKAP" ? "emerald" : "amber"}>
                  Paspor: {t.passportStatus}
                </Badge>
                <Badge variant={t.ktpStatus === "LENGKAP" ? "emerald" : "amber"}>
                  KTP: {t.ktpStatus}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
