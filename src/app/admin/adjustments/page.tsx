"use client";

import AdjustmentsView from "@/components/app-views/AdjustmentsView";

export default function AdminAdjustments() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <AdjustmentsView branchId={null} returnPath="/admin" />
    </div>
  );
}
