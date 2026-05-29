"use client";

import InventoryView from "@/components/app-views/InventoryView";

export default function AdminInventory() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <InventoryView branchId={null} returnPath="/admin" showValuation={true} />
    </div>
  );
}
