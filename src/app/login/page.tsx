"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || "Invalid credentials.");
      setLoading(false);
    } else {
      const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
      if (data.user?.id === ADMIN_UID) {
         router.push("/admin");
      } else {
         router.push("/");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F8] px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
        
        {settings.companyLogoUrl ? (
          <div className="flex justify-center mb-10">
            <img src={settings.companyLogoUrl} alt={settings.companyName} className="h-24 object-contain mix-blend-multiply scale-150" />
          </div>
        ) : (
          <h1 className="text-3xl font-display font-semibold text-center text-slate-900 mb-10">
            {settings.companyName}
          </h1>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between pt-2 pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
              <span className="text-sm text-slate-600">Stay logged in</span>
            </label>
            <Link href="#" className="text-sm font-semibold text-slate-900 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      <a href="https://wa.me/254794577748" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        Contact Support
      </a>
    </div>
  );
}

