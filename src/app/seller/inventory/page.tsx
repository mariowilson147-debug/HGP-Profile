"use client";

import { useAuth } from "@/components/AuthProvider";
import InventoryView from "@/components/app-views/InventoryView";
import { Loader2 } from "lucide-react";

export default function SellerInventory() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  // If no branch assigned, we still render InventoryView to let it display the "No Branch Selected" warning nicely.
  return <InventoryView branchId={user.branch_id || ""} returnPath="/seller" />;
}
