"use client";

import { useManagerBranch } from "@/components/ManagerBranchProvider";
import POSView from "@/components/app-views/POSView";
import { Loader2 } from "lucide-react";

export default function ManagerPOS() {
  const { selectedBranchId } = useManagerBranch();

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Selected</h2>
        <p className="text-slate-500">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  return <POSView branchId={selectedBranchId} returnPath="/manager" />;
}
