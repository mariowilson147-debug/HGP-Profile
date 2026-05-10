"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type User = { id: string; email: string; role: "admin" | "wholesale" } | null;

interface AuthContextType {
  user: User;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          const role = session.user.id === ADMIN_UID ? "admin" : "wholesale";
          setUser({ id: session.user.id, email: session.user.email || "", role });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          const role = session.user.id === ADMIN_UID ? "admin" : "wholesale";
          setUser({ id: session.user.id, email: session.user.email || "", role });
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, ADMIN_UID]);

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
