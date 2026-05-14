"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck,
  CheckCircle2, Mail, ArrowLeft, KeyRound,
} from "lucide-react";
import { useSettings } from "./SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/auth-actions";

type ModalView = "login" | "set-password" | "forgot" | "verify-otp" | "new-password" | "success";

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

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<ModalView>("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / OTP
  const [resetEmail, setResetEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New password (first-login + post-OTP)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { settings } = useSettings();
  const strength = usePasswordStrength(newPassword);

  const reset = () => {
    setView("login");
    setEmail(""); setPassword(""); setShowPassword(false);
    setResetEmail(""); setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword(""); setConfirmPassword("");
    setError(""); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Sign in ────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message || "Invalid credentials."); return; }
    const user = data.user;
    if (!user) return;
    if (user.user_metadata?.must_change_password) { setView("set-password"); return; }
    onClose();
    if (user.id === process.env.NEXT_PUBLIC_ADMIN_UID) router.push("/admin");
  };

  // ── First-login: set password ──────────────────────────────────────────
  const handleFirstLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });
    setLoading(false);
    if (pwError) { setError(pwError.message || "Failed to update password."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    onClose();
    if (user?.id === process.env.NEXT_PUBLIC_ADMIN_UID) router.push("/admin");
  };

  // ── Forgot: send OTP ───────────────────────────────────────────────────
  // Server action validates user exists first, then triggers recovery email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      if (!res.success) {
        setError(res.error || "Failed to send code.");
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setView("verify-otp");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError(""); setLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      if (!res.success) {
        setError(res.error || "Failed to resend.");
      } else {
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend.");
    }
    setLoading(false);
  };

  // ── OTP digit helpers ──────────────────────────────────────────────────
  const handleOtpInput = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtpDigits(pasted.split("")); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError(""); setLoading(true);
    // type: 'recovery' matches the token sent by admin.generateLink({ type: 'recovery' })
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: resetEmail, token, type: "recovery" });
    setLoading(false);
    if (verifyError) { setError("Invalid or expired code. Please try again."); return; }
    setNewPassword(""); setConfirmPassword("");
    setView("new-password");
  };

  // ── Set new password (post-OTP) ────────────────────────────────────────
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (pwError) { setError(pwError.message || "Failed to update password."); return; }
    await supabase.auth.signOut();
    setView("success");
  };

  if (!isOpen) return null;

  // ── Shared subcomponents ───────────────────────────────────────────────
  const Logo = () => (
    <div className="flex justify-center mb-8 mt-2">
      <span className="font-signature text-5xl font-bold text-slate-900">
        {settings.companyName || "Prutam"}
      </span>
    </div>
  );

  const ErrorBanner = () => error ? (
    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-lg flex items-center gap-2">
      <AlertCircle size={14} className="shrink-0" /> {error}
    </div>
  ) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto">

          <button onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>

          <Logo />
          <ErrorBanner />

          {/* ── LOGIN ── */}
          {view === "login" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                  <span className="text-sm text-slate-600">Stay logged in</span>
                </label>
                <button type="button" onClick={() => { setError(""); setResetEmail(email); setView("forgot"); }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* ── FIRST LOGIN: SET PASSWORD ── */}
          {view === "set-password" && (
            <>
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-sm border border-amber-100 rounded-lg flex items-center gap-2">
                <KeyRound size={14} className="shrink-0" />
                Welcome! Please create a personal password to continue.
              </div>
              <form onSubmit={handleFirstLoginPassword} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Create Your Password</p>
                    <p className="text-xs text-slate-500">Choose a strong password for your account.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showNewPw ? "text" : "password"} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                      className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">{strength.label} password</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} required
                      className={`w-full bg-white border text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-1 transition-colors ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                      placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Passwords don&apos;t match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Saving…" : "Save & Continue"}
                </button>
              </form>
            </>
          )}

          {/* ── FORGOT: ENTER EMAIL ── */}
          {view === "forgot" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="mb-2">
                <h3 className="text-base font-bold text-slate-900">Reset your password</h3>
                <p className="text-sm text-slate-500 mt-1">Enter your email — we&apos;ll send a 6-digit code.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                    className="w-full bg-white border border-slate-300 text-slate-800 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="name@company.com" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Sending…" : "Send Verification Code"}
              </button>
              <button type="button" onClick={() => { setError(""); setView("login"); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={13} /> Back to Sign In
              </button>
            </form>
          )}

          {/* ── VERIFY OTP ── */}
          {view === "verify-otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={20} className="text-slate-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Check your email</h3>
                <p className="text-sm text-slate-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-slate-800">{resetEmail}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">Enter Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otpDigits.map((d, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      className="w-11 h-13 text-center text-xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-700/20 transition-all bg-white text-slate-900 py-2.5" />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading || otpDigits.join("").length < 6}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Verifying…" : "Verify Code"}
              </button>
              <div className="flex flex-col items-center gap-2 text-sm">
                <button type="button" disabled={loading} onClick={handleResendOtp}
                  className="text-slate-500 hover:text-slate-800 font-medium transition-colors disabled:opacity-40">
                  {loading ? "Sending…" : "Resend code"}
                </button>
                <button type="button" onClick={() => { setError(""); setView("forgot"); }}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors">
                  <ArrowLeft size={12} /> Change email
                </button>
              </div>
            </form>
          )}

          {/* ── NEW PASSWORD (post-OTP) ── */}
          {view === "new-password" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Set New Password</p>
                  <p className="text-xs text-slate-500">Choose a strong password for your account.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strength.label} password</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required
                    className={`w-full bg-white border text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-1 transition-colors ${confirmPassword && confirmPassword !== newPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Passwords don&apos;t match</p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          )}

          {/* ── SUCCESS ── */}
          {view === "success" && (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Password Updated!</h3>
              <p className="text-sm text-slate-500 mb-6">Sign in with your new password.</p>
              <button onClick={() => { setError(""); setView("login"); setPassword(""); }}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
