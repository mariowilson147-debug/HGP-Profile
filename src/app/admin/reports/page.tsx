"use client";

import ReportsView from "@/components/app-views/ReportsView";

export default function AdminReports() {
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <ReportsView branchId={null} returnPath="/admin" />
    </div>
  );
}
