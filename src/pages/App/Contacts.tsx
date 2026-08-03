import React from "react";
import { Card } from "../../components/ui/Card";
import { UserCheck } from "lucide-react";

export const Contacts: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <UserCheck className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          <span>Customer Contacts Directory</span>
        </h1>
      </div>
      <Card>
        <p className="text-slate-600 dark:text-zinc-400 text-sm">Directory of saved customer profiles, domicile branches, and WhatsApp chat history.</p>
      </Card>
    </div>
  );
};
