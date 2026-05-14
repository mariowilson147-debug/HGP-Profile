"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useChat } from "@/components/ChatProvider";
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

// Views in the login flow
type View = "login" | "forgot" | "verify-otp" | "new-password" | "set-password" | "sent-success";

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

  // Forgot / OTP fields
  const [resetEmail, setResetEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New password fields (used for both first-login and forgot-password)
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

  // ── Forgot: send OTP ───────────────────────────────────────────────────────
  // Shared helper — sends the OTP email using the browser Supabase client directly.
  const sendOtp = async (emailAddress: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(error.message);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOtp(resetEmail);
      setOtpDigits(["", "", "", "", "", ""]);
      setView("verify-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtp(resetEmail);
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    }
    setLoading(false);
  };

  // ── OTP: handle digit input ────────────────────────────────────────────────
  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── OTP: verify code ───────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: resetEmail,
      token,
      type: "email",
    });
    setLoading(false);

    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      return;
    }

    // Code verified — session is now active, proceed to set new password
    setNewPassword("");
    setConfirmPassword("");
    setView("new-password");
  };

  // ── New password (post-OTP) ────────────────────────────────────────────────
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (pwError) {
      setError(pwError.message || "Failed to update password.");
      return;
    }

    await supabase.auth.signOut();
    setView("sent-success");
  };

  // ── Shared components ──────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex justify-center mb-10">
      <span className="font-signature text-6xl font-bold text-slate-900">
        {settings.companyName || "Prutam"}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-slate-600">Stay logged in</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setResetEmail(email);
                  setView("forgot");
                }}
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
            <KeyRound size={15} className="shrink-0" />
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

      {/* ── FORGOT: enter email ─────────────────────────────────────────────── */}
      {view === "forgot" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your account email — we&apos;ll send a 6-digit verification code.
            </p>
          </div>
          <ErrorBanner />
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
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
              {loading ? "Sending code…" : "Send Verification Code"}
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

      {/* ── VERIFY OTP ─────────────────────────────────────────────────────── */}
      {view === "verify-otp" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="text-sm text-slate-500 mt-1">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-800">{resetEmail}</span>
            </p>
          </div>
          <ErrorBanner />
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP boxes */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-700/20 transition-all bg-white text-slate-900"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join("").length < 6}
              className="w-full py-3.5 bg-[#111827] text-white font-medium rounded hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Verifying…" : "Verify Code"}
            </button>

            <div className="flex flex-col items-center gap-2 text-sm">
              <button
                type="button"
                disabled={loading}
                onClick={handleResendOtp}
                className="text-slate-500 hover:text-slate-800 font-medium transition-colors disabled:opacity-40"
              >
                {loading ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => { setError(""); setView("forgot"); }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={13} /> Change email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── NEW PASSWORD (post-OTP) ─────────────────────────────────────────── */}
      {view === "new-password" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6">
          <Logo />
          <PasswordFields
            heading="Set New Password"
            subheading="Choose a strong password for your account."
            onSubmit={handleSetNewPassword}
            submitLabel="Update Password"
            submitLoadingLabel="Updating…"
          />
        </div>
      )}

      {/* ── SUCCESS ─────────────────────────────────────────────────────────── */}
      {view === "sent-success" && (
        <div className="w-full max-w-md bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-10 mb-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Password Updated!</h2>
          <p className="text-sm text-slate-500 mb-8">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => { setView("login"); setPassword(""); setError(""); }}
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
