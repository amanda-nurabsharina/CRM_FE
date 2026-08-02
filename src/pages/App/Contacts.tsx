import React from "react";
import { Card } from "../../components/ui/Card";
import { UserCheck } from "lucide-react";

export const Contacts: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-teal-400" /> Customer Contacts
        </h1>
      </div>
      <Card>
        <p className="text-zinc-400 text-sm">Directory of saved customer profiles and chat history.</p>
      </Card>
    </div>
  );
};
