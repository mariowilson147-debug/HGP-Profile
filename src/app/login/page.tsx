"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || "Invalid credentials. Ensure your account has been created by an Administrator.");
      setLoading(false);
    } else {
      const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
      if (data.user?.id === ADMIN_UID) {
         router.push("/admin");
      } else {
         router.push("/catalog");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0f0f0f] px-6 pb-20 pt-10">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#222] p-8 md:p-10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#1a1a1a] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
            <LogIn size={24} className="text-[#d4af37]" />
          </div>
        </div>
        
        <h1 className="text-2xl font-serif text-center text-[#fefefe] mb-2">Secure Access</h1>
        <p className="text-center text-[#888] text-sm mb-8 leading-relaxed">Login to your authenticated account to view exclusive catalog pricing and manage orders.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 text-red-500 text-[10px] uppercase tracking-widest text-center rounded-sm leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] shadow-sm mb-3">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 transition-all font-light"
              placeholder="wholesale@example.com"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] shadow-sm mb-3">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 transition-all font-light"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-[#0f0f0f] font-medium uppercase tracking-[0.2em] text-[11px] rounded-sm hover:from-[#d4af37] hover:to-[#ebd483] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-8"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
