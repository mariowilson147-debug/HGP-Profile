"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase embeds the tokens in the URL hash fragment after the email link is clicked.
  // We need to detect that the session is active before allowing the form submission.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message || "Failed to update password.");
      setStatus("error");
    } else {
      setStatus("success");
      setMessage("Password updated! Redirecting to sign in...");
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F8] px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span className="font-signature text-6xl font-bold text-slate-900">IFS</span>
        </div>

        {status === "success" ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Password Updated!</h2>
            <p className="text-sm text-slate-500">Redirecting you to the sign in page…</p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Set New Password</h2>
                <p className="text-xs text-slate-500">Choose a strong password for your account.</p>
              </div>
            </div>

            {!sessionReady && (
              <div className="mb-5 p-3 bg-amber-50 text-amber-700 text-sm border border-amber-100 rounded flex items-center gap-2">
                <Loader2 size={14} className="animate-spin shrink-0" />
                Verifying your reset link…
              </div>
            )}

            {message && (
              <div className={`mb-5 p-3 text-sm border rounded flex items-center gap-2 ${
                status === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"
              }`}>
                {status === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strengthLabel} password</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className={`w-full bg-white border text-slate-800 px-4 py-2.5 pr-10 rounded focus:outline-none focus:ring-1 transition-colors ${
                      confirm && confirm !== password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> Passwords don&apos;t match
                  </p>
                )}
                {confirm && confirm === password && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
