"use client";

import { useManagerBranch } from "@/components/ManagerBranchProvider";
import ReportsView from "@/components/app-views/ReportsView";

export default function ManagerReports() {
  const { selectedBranchId } = useManagerBranch();

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Selected</h2>
        <p className="text-slate-500">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  return <ReportsView branchId={selectedBranchId} returnPath="/manager" />;
}
