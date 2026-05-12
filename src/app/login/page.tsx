"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useChat } from "@/components/ChatProvider";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

type View = "login" | "forgot" | "sent";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { settings } = useSettings();
  const { openChat } = useChat();

  // ── Sign in ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message || "Invalid credentials.");
      setLoading(false);
    } else {
      const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
      router.push(data.user?.id === ADMIN_UID ? "/admin" : "/");
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message || "Failed to send reset email.");
    } else {
      setView("sent");
    }
  };

  // ── Shared logo ──────────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex justify-center mb-10">
      <span className="font-signature text-6xl font-bold text-slate-900">
        {settings.companyName || "Prutam"}
      </span>
    </div>
  );

  // ── Error banner ─────────────────────────────────────────────────────────
  const ErrorBanner = () => error ? (
    <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded text-center">
      {error}
    </div>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F8] px-4 font-sans">

      {/* ── LOGIN VIEW ───────────────────────────────────────────────── */}
      {view === "login" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <ErrorBanner />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
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
              <button
                type="button"
                onClick={() => { setError(""); setResetEmail(email); setView("forgot"); }}
                className="text-sm font-semibold text-slate-900 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      )}

      {/* ── FORGOT PASSWORD VIEW ─────────────────────────────────────── */}
      {view === "forgot" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter the email linked to your account and we&apos;ll send a reset link.
            </p>
          </div>

          <ErrorBanner />

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-800 pl-10 pr-4 py-2.5 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => { setError(""); setView("login"); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        </div>
      )}

      {/* ── EMAIL SENT VIEW ──────────────────────────────────────────── */}
      {view === "sent" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
          <p className="text-sm text-slate-500 mb-1">
            A password reset link has been sent to:
          </p>
          <p className="text-sm font-bold text-slate-800 mb-6">{resetEmail}</p>
          <p className="text-xs text-slate-400 mb-8">
            The link expires in 60 minutes. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={() => { setError(""); setView("login"); }}
            className="w-full py-3 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      )}

      <button
        onClick={() => openChat("Hi Support Team, I need help accessing my account:")}
        className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        Contact Support
      </button>
    </div>
  );
}
