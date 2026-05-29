"use client";

import { useManagerBranch } from "@/components/ManagerBranchProvider";
import InventoryView from "@/components/app-views/InventoryView";

export default function ManagerInventory() {
  const { selectedBranchId } = useManagerBranch();

  return <InventoryView branchId={selectedBranchId || ""} returnPath="/manager" showValuation={true} />;
}
