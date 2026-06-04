"use client";

import { useState, useEffect } from "react";
import POSView from "@/components/app-views/POSView";
import { Loader2 } from "lucide-react";
import { getBranches } from "@/lib/auth-actions";
import SelectDropdown from "@/components/ui/SelectDropdown";

export default function AdminPOS() {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBranches();
        setBranches(data || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-apex-on-surface-variant" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-apex-text">Point of Sale</h1>
          <p className="text-apex-on-surface-variant mt-1">Admin Access: Select a branch to ring up a sale.</p>
        </div>
        <div className="bg-apex-surface p-2 rounded-xl border border-apex-outline shadow-sm flex items-center gap-3">
          <span className="text-sm font-medium text-apex-on-surface-variant pl-2">Branch:</span>
          <SelectDropdown
            value={selectedBranchId || ""}
            onChange={setSelectedBranchId}
            options={branches.map(b => ({ label: b.name, value: b.id }))}
            placeholder="Select Branch"
            className="w-48"
          />
        </div>
      </div>

      {selectedBranchId ? (
        <POSView branchId={selectedBranchId} returnPath="/admin" />
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] border-2 border-dashed border-apex-outline rounded-2xl bg-apex-surface-low">
          <h2 className="text-xl font-bold text-apex-text mb-2">No Branch Selected</h2>
          <p className="text-apex-on-surface-variant text-center max-w-md">
            Please select a branch from the dropdown above to access the Point of Sale system for that location.
          </p>
        </div>
      )}
    </div>
  );
}
