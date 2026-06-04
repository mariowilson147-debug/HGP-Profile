"use client";

import { useAuth } from "@/components/AuthProvider";
import SessionsView from "@/components/app-views/SessionsView";
import { Loader2 } from "lucide-react";

export default function SellerSalesHistory() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-apex-on-surface-variant" size={32} />
      </div>
    );
  }

  if (!user?.branch_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Assigned</h2>
        <p className="text-apex-on-surface-variant">You need an assigned branch to view sales history.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SessionsView branchId={user.branch_id} returnPath="/seller" />
    </div>
  );
}
