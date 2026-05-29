"use client";

import React from "react";
import ProcurementView from "@/components/app-views/ProcurementView";
import { useManagerBranch } from "@/components/ManagerBranchProvider";

export default function ManagerPurchasesPage() {
  const { selectedBranchId, availableBranches } = useManagerBranch();

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <ProcurementView 
        branchId={selectedBranchId} 
        availableBranches={availableBranches}
        returnPath="/manager" 
      />
    </div>
  );
}
