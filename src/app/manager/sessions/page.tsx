"use client";

import { useManagerBranch } from "@/components/ManagerBranchProvider";
import SessionsView from "@/components/app-views/SessionsView";

export default function ManagerSessions() {
  const { selectedBranchId } = useManagerBranch();

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <SessionsView branchId={selectedBranchId} returnPath="/manager" />
    </div>
  );
}
