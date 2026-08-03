import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi, TourPackage } from "../../api/crmApi";
import { KanbanSquare, FileText, Check, Plus, Clock, Sparkles } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export const CatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null);
  const [quoteForm, setQuoteForm] = useState({ lead_id: "", pax_count: 2, price_per_pax: 0, custom_reason: "" });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: () => crmApi.getPackages(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => crmApi.getLeads(),
  });

  const quoteMutation = useMutation({
    mutationFn: (data: { lead_id: string; package_id: string; pax_count: number; price_per_pax: number; custom_price_reason?: string }) =>
      crmApi.createQuotation(data),
    onSuccess: () => {
      setSelectedPkg(null);
      alert("Quotation PDF berhasil digenerate!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <KanbanSquare className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            <span>Katalog Paket Tur & Generator Quotation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Pilih paket tur standar dan terbitkan penawaran harga resmi (PDF Quotation) untuk pelanggan WA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="p-6 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4 hover:border-teal-500/50 transition-all shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <Badge variant="teal" className="text-xs">{pkg.destination}</Badge>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{pkg.duration_days} Hari</span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">{pkg.title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{pkg.terms_conditions}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Harga Standar / Pax</span>
                <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">Rp {pkg.base_price.toLocaleString("id-ID")}</p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedPkg(pkg);
                  setQuoteForm({ ...quoteForm, price_per_pax: pkg.base_price, lead_id: leads[0]?.id || "" });
                }}
              >
                Buat Quotation
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quote Generator Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Generator Quotation PDF — {selectedPkg.destination}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Pilih Lead Customer WA:</label>
                <select
                  value={quoteForm.lead_id}
                  onChange={(e) => setQuoteForm({ ...quoteForm, lead_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Jumlah Peserta (Pax):</label>
                <input
                  type="number"
                  min="1"
                  value={quoteForm.pax_count}
                  onChange={(e) => setQuoteForm({ ...quoteForm, pax_count: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-zinc-400 mb-1 font-semibold">Harga Kesepakatan / Pax (Rp):</label>
                <input
                  type="number"
                  value={quoteForm.price_per_pax}
                  onChange={(e) => setQuoteForm({ ...quoteForm, price_per_pax: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="p-3 bg-teal-500/10 rounded-xl flex justify-between items-center text-xs font-bold text-teal-700 dark:text-teal-300">
                <span>Total Penawaran:</span>
                <span>Rp {(quoteForm.price_per_pax * quoteForm.pax_count).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  quoteMutation.mutate({
                    lead_id: quoteForm.lead_id,
                    package_id: selectedPkg.id,
                    pax_count: quoteForm.pax_count,
                    price_per_pax: quoteForm.price_per_pax,
                  })
                }
                disabled={quoteMutation.isPending || !quoteForm.lead_id}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Terbitkan PDF & Kirim WA</span>
              </button>
              <button
                onClick={() => setSelectedPkg(null)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
