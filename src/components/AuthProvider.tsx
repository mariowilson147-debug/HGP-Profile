"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    window.location.href = "/";
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    let expirationTimer: NodeJS.Timeout;

    const checkExpiration = (session: { user?: { last_sign_in_at?: string } } | null) => {
      if (!session?.user?.last_sign_in_at) return false;
      const signInTime = new Date(session.user.last_sign_in_at).getTime();
      const tenMinutes = 10 * 60 * 1000;
      
      if (Date.now() - signInTime > tenMinutes) {
        logout();
        return true; // expired
      } else {
        // Set a timer to log out when the 10 minutes are up
        const timeRemaining = tenMinutes - (Date.now() - signInTime);
        clearTimeout(expirationTimer);
        expirationTimer = setTimeout(() => {
          logout();
        }, timeRemaining);
        return false;
      }
    };

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          const isExpired = checkExpiration(session);
          if (!isExpired) {
            const role = session.user.id === ADMIN_UID ? "admin" : "wholesale";
            setUser({ id: session.user.id, email: session.user.email || "", role });
          }
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
          const isExpired = checkExpiration(session);
          if (!isExpired) {
            const role = session.user.id === ADMIN_UID ? "admin" : "wholesale";
            setUser({ id: session.user.id, email: session.user.email || "", role });
          }
        } else {
          setUser(null);
          clearTimeout(expirationTimer);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(expirationTimer);
    };
  }, [supabase, ADMIN_UID, logout]);

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
