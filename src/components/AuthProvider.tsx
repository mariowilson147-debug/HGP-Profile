"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type User = { 
  id: string; 
  email: string; 
  role: "admin" | "ceo" | "manager" | "seller" | "wholesale";
  branch_id?: string | null;
  assigned_branches?: string[] | null;
  nickname?: string | null;
  avatar_url?: string | null;
} | null;

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

    const checkExpiration = (session: { user?: { id?: string; last_sign_in_at?: string } } | null) => {
      if (!session?.user?.last_sign_in_at) return false;
      if (session.user.id === ADMIN_UID) return false; // Admin bypass
      
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

    async function fetchProfileAndSetUser(session: { user: { id: string; email?: string } }) {
      const isExpired = checkExpiration(session);
      if (isExpired) return;

      let role: NonNullable<User>["role"] = session.user.id === ADMIN_UID ? "admin" : "wholesale";
      let branch_id = null;
      let assigned_branches = null;
      let nickname = null;
      let avatar_url = null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        if (session.user.id !== ADMIN_UID) {
          role = profile.role as NonNullable<User>["role"];
        }
        branch_id = profile.branch_id;
        assigned_branches = profile.assigned_branches;
        nickname = profile.nickname;
        avatar_url = profile.avatar_url;
      } else {
        // If no profile exists, create one
        await supabase.from('user_profiles').insert([{ 
          id: session.user.id, 
          role: session.user.id === ADMIN_UID ? 'admin' : 'wholesale' 
        }]);
      }

      if (mounted) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || "", 
          role, 
          branch_id,
          assigned_branches,
          nickname,
          avatar_url
        });
      }
    }

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          await fetchProfileAndSetUser(session);
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
          fetchProfileAndSetUser(session);
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
