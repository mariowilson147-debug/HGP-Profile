"use client";

import ProcurementView from "@/components/app-views/ProcurementView";

export default function AdminProcurement() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <ProcurementView branchId={null} returnPath="/admin" />
    </div>
  );
}
