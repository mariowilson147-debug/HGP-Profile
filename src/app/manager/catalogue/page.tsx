"use client";

import CatalogueView from "@/components/app-views/CatalogueView";
import { useManagerBranch } from "@/components/ManagerBranchProvider";

export default function ManagerCatalogue() {
  const { selectedBranchId } = useManagerBranch();
  return <CatalogueView returnPath="/manager" branchId={selectedBranchId} />;
}
