"use client";

import TransfersView from "@/components/app-views/TransfersView";

export default function AdminTransfers() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <TransfersView branchId={null} returnPath="/admin" />
    </div>
  );
}
