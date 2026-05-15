"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProtectedRoute({ children, reqRole }: { children: React.ReactNode, reqRole?: "admin" | "authenticated" | "wholesale" }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> send to client view
        router.push("/");
      } else {
        // If a specific role is required (e.g., admin), check if user fits
        if (reqRole === "admin" && user.role !== "admin") {
          // Regular user trying to access admin
          router.push("/");
        } else {
          // Authorized
          setIsReady(true);
        }
      }
    }
  }, [user, isLoading, router, reqRole]);

  if (!isReady) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0f0f0f] w-full">
        <div className="w-12 h-12 rounded-full border-t-2 border-l-2 border-[#d4af37] animate-spin mb-4"></div>
        <p className="text-[#888] text-[10px] uppercase tracking-widest animate-pulse">Verifying Access Level...</p>
      </div>
    );
  }

  return <>{children}</>;
}
