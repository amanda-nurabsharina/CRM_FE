import React from "react";
import { Card } from "../../components/ui/Card";
import { KanbanSquare } from "lucide-react";

export const Deals: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <KanbanSquare className="h-6 w-6 text-teal-400" /> Sales & Deals Pipeline
        </h1>
      </div>
      <Card>
        <p className="text-zinc-400 text-sm">Kanban deal stages from discovery to closed won.</p>
      </Card>
    </div>
  );
};
