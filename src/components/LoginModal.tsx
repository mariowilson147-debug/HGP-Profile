"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useSettings } from "./SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ModalView = "login" | "set-password";

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

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // First-login password change fields
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
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Sign in ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
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

    // First-login: force password change
    if (user.user_metadata?.must_change_password) {
      setView("set-password");
      return;
    }

    onClose();
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (user.id === ADMIN_UID) {
      router.push("/admin");
    }
  };

  // ── First-login: set new password ─────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
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

    if (pwError) {
      setError(pwError.message || "Failed to update password.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    onClose();
    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;
    if (user?.id === ADMIN_UID) router.push("/admin");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-10"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-8 mt-2">
            <span className="font-signature text-5xl font-bold text-slate-900">
              {settings.companyName || "Prutam"}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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

              <div className="flex items-center pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                  <span className="text-sm text-slate-600">Stay logged in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* ── SET PASSWORD VIEW (first login) ── */}
          {view === "set-password" && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">Create your password</p>
                  <p className="text-xs text-slate-500">Set a personal password to continue.</p>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowNewPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strength.label} password</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-white border text-slate-800 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-1 transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button type="button" onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Saving…" : "Save Password & Continue"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
