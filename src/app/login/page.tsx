"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useChat } from "@/components/ChatProvider";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

// Views in the login flow
type View = "login" | "set-password";

// Simple password strength helper
function usePasswordStrength(password: string) {
  if (password.length === 0) return { score: 0, label: "", color: "" };
  let s = 0;
  if (password.length >= 8) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];
  return { score: s, label: labels[s], color: colors[s] };
}

export default function LoginPage() {
  const [view, setView] = useState<View>("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // New password fields (first-login only)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { settings } = useSettings();
  const { openChat } = useChat();
  const strength = usePasswordStrength(newPassword);

  // ── Sign in ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message || "Invalid credentials.");
      return;
    }

    const user = data.user;
    if (!user) return;

    // Check for first-login flag
    if (user.user_metadata?.must_change_password) {
      setView("set-password");
      return;
    }

    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    router.push(user.id === ADMIN_UID ? "/admin" : "/");
  };

  // ── First-login: save new password ─────────────────────────────────────────
  const handleFirstLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    // Update password AND clear the must_change_password flag
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });
    setLoading(false);

    if (pwError) {
      setError(pwError.message || "Failed to update password.");
      return;
    }

    // Get current user to determine where to redirect
    const { data: { user } } = await supabase.auth.getUser();
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    router.push(user?.id === ADMIN_UID ? "/admin" : "/");
  };

  // ── Shared components ──────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex justify-center mb-10">
      <span className="font-signature text-6xl font-bold text-slate-900">
        {settings.companyName || "IFS"}
      </span>
    </div>
  );

  const ErrorBanner = () =>
    error ? (
      <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded flex items-center gap-2">
        <AlertCircle size={14} className="shrink-0" />
        {error}
      </div>
    ) : null;

  const PasswordFields = ({
    onSubmit,
    submitLabel,
    submitLoadingLabel,
    heading,
    subheading,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    submitLoadingLabel: string;
    heading: string;
    subheading: string;
  }) => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-slate-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{heading}</h2>
          <p className="text-xs text-slate-500">{subheading}</p>
        </div>
      </div>
      <ErrorBanner />
      <form onSubmit={onSubmit} className="space-y-5">
        {/* New password */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNewPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {newPassword.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">{strength.label} password</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full bg-white border text-slate-800 px-4 py-2.5 pr-10 rounded focus:outline-none focus:ring-1 transition-colors ${
                confirmPassword && confirmPassword !== newPassword
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
              }`}
              placeholder="Re-enter password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> Passwords don&apos;t match
            </p>
          )}
          {confirmPassword && confirmPassword === newPassword && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={11} /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? submitLoadingLabel : submitLabel}
        </button>
      </form>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F8] px-4 font-sans">

      {/* ── LOGIN ─────────────────────────────────────────────────────────── */}
      {view === "login" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <ErrorBanner />
          <form onSubmit={handleSignIn} className="space-y-5">
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-slate-600">Stay logged in</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      )}

      {/* ── SET PASSWORD (first login) ──────────────────────────────────────── */}
      {view === "set-password" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <div className="mb-5 p-3 bg-amber-50 text-amber-700 text-sm border border-amber-100 rounded flex items-center gap-2">
            <span className="text-lg">👋</span>
            Welcome! Please set a personal password before continuing.
          </div>
          <PasswordFields
            heading="Create Your Password"
            subheading="Choose a strong password for your account."
            onSubmit={handleFirstLoginPassword}
            submitLabel="Save Password & Continue"
            submitLoadingLabel="Saving…"
          />
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
