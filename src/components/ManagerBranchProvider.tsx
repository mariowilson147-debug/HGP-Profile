"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BranchInfo = { id: string; name: string };

type ManagerBranchContextType = {
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string) => void;
  availableBranches: BranchInfo[];
};

const ManagerBranchContext = createContext<ManagerBranchContextType>({
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  availableBranches: []
});

export function ManagerBranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<BranchInfo[]>([]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function fetchBranches() {
      if (!user) return;
      
      const branchIdsToFetch = user.assigned_branches || (user.branch_id ? [user.branch_id] : []);
      
      if (branchIdsToFetch.length > 0) {
        const { data } = await supabase
          .from('branches')
          .select('id, name')
          .in('id', branchIdsToFetch);
          
        if (data) {
          setAvailableBranches(data);
          
          // Try to restore from localStorage or pick first available
          const saved = localStorage.getItem('managerSelectedBranch');
          if (saved && data.find(b => b.id === saved)) {
            setSelectedBranchId(saved);
          } else {
            setSelectedBranchId(data[0].id);
          }
        }
      }
    }
    fetchBranches();
  }, [user, supabase]);

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('managerSelectedBranch', selectedBranchId);
    }
  }, [selectedBranchId]);

  return (
    <ManagerBranchContext.Provider value={{ selectedBranchId, setSelectedBranchId, availableBranches }}>
      {children}
    </ManagerBranchContext.Provider>
  );
}

export const useManagerBranch = () => useContext(ManagerBranchContext);
