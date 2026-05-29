"use client";

import { useAuth } from "@/components/AuthProvider";
import POSView from "@/components/app-views/POSView";
import { Loader2 } from "lucide-react";

export default function SellerPOS() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!user.branch_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Assigned</h2>
        <p className="text-slate-500">Please contact an admin to assign you to a branch before accessing POS.</p>
      </div>
    );
  }

  return <POSView branchId={user.branch_id} returnPath="/seller" />;
}
