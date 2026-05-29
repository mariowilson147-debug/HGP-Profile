"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { ManagerBranchProvider } from "@/components/ManagerBranchProvider";

import ProfileDropdown from "@/components/ui/ProfileDropdown";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['manager', 'ceo', 'admin']}>
      <ManagerBranchProvider>
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
          {/* Manager Header */}
          <header className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 flex justify-end items-center">
            <ProfileDropdown />
          </header>
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
            {children}
          </main>
        </div>
      </ManagerBranchProvider>
    </ProtectedRoute>
  );
}
