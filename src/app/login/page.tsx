"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  CircleDot
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

    // Check role in user_profiles
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || 'wholesale';
    
    if (role === 'admin' || user.id === process.env.NEXT_PUBLIC_ADMIN_UID) {
      router.push('/admin');
    } else if (['manager', 'ceo'].includes(role)) {
      router.push('/manager');
    } else if (role === 'seller') {
      router.push('/seller');
    } else {
      router.push('/');
    }
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
    if (!user) {
      router.push('/');
      return;
    }

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || 'wholesale';

    if (role === 'admin' || user.id === process.env.NEXT_PUBLIC_ADMIN_UID) {
      router.push('/admin');
    } else if (['manager', 'ceo'].includes(role)) {
      router.push('/manager');
    } else if (role === 'seller') {
      router.push('/seller');
    } else {
      router.push('/');
    }
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
      <div className="flex flex-col items-center gap-1 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight text-center">{heading}</h2>
        <p className="text-sm text-slate-500 text-center">{subheading}</p>
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
              className="w-full bg-white border-0 text-slate-800 px-6 py-4 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors text-sm font-medium placeholder:text-slate-500 placeholder:font-normal"
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
              className={`w-full bg-white border-0 text-slate-800 px-6 py-4 pr-12 rounded-full focus:outline-none focus:ring-2 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-sm font-medium placeholder:text-slate-500 placeholder:font-normal ${
                confirmPassword && confirmPassword !== newPassword
                  ? "focus:ring-red-400"
                  : "focus:ring-slate-900"
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
          className="w-full py-4 bg-[#222222] text-white font-medium rounded-full hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-sm"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? submitLoadingLabel : submitLabel}
        </button>
      </form>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB] px-4 font-sans">
      
      {/* ── LOGIN ─────────────────────────────────────────────────────────── */}
      {view === "login" && (
        <div className="w-full max-w-[320px] flex flex-col items-center">
          
          <div className="mb-10 flex flex-col items-center justify-center gap-1">
             <Link href="/">
               <Image 
                 src="/ifs-logo-large.jpg" 
                 alt="IFS Logo" 
                 width={280} 
                 height={140} 
                 className="w-auto h-28 object-contain hover:opacity-80 transition-opacity mb-2" 
               />
             </Link>
             <div className="flex flex-col items-center justify-center text-center">
               <h1 className="text-[22px] font-extrabold text-black tracking-tight uppercase leading-none">
                 Interior Finishes
               </h1>
               <h2 className="text-[13px] font-bold text-slate-800 tracking-[0.15em] uppercase mt-1">
                 Supermarket
               </h2>
             </div>
          </div>

          <div className="w-full">
            <ErrorBanner />
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border-0 text-slate-900 px-5 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all text-sm font-medium placeholder:text-slate-500 placeholder:font-medium"
                  placeholder="Email"
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border-0 text-slate-900 px-5 py-3.5 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all text-sm font-medium placeholder:text-slate-500 placeholder:font-medium"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#222222] text-white text-sm font-medium rounded-full hover:bg-black transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Logging in…" : "Log in"}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => openChat("Hi Support Team, I forgot my password:")}
                  className="w-full py-3.5 bg-[#333333] text-white text-sm font-medium rounded-full hover:bg-black transition-all flex items-center justify-center shadow-sm"
                >
                  Forgot Password
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-600 space-y-1 font-medium">
            <p>
              Don&apos;t have an account? <button onClick={() => openChat("Hi Support Team, I want to sign up for an account:")} className="font-bold text-slate-900 hover:underline cursor-pointer">Sign Up</button>
            </p>
            <p>
              Need help? <button onClick={() => openChat("Hi Support Team, I need help accessing my account:")} className="font-bold text-slate-900 hover:underline cursor-pointer">Contact Support</button>
            </p>
          </div>
        </div>
      )}

      {/* ── SET PASSWORD (first login) ──────────────────────────────────────── */}
      {view === "set-password" && (
        <div className="w-full max-w-[320px] flex flex-col items-center">
          <div className="mb-10 flex flex-col items-center justify-center gap-1">
             <Link href="/">
               <Image 
                 src="/ifs-logo-large.jpg" 
                 alt="IFS Logo" 
                 width={280} 
                 height={140} 
                 className="w-auto h-28 object-contain hover:opacity-80 transition-opacity mb-2" 
               />
             </Link>
             <div className="flex flex-col items-center justify-center text-center">
               <h1 className="text-[22px] font-extrabold text-black tracking-tight uppercase leading-none">
                 Interior Finishes
               </h1>
               <h2 className="text-[13px] font-bold text-slate-800 tracking-[0.15em] uppercase mt-1">
                 Supermarket
               </h2>
             </div>
          </div>
          
          <div className="mb-6 p-4 bg-white text-slate-800 text-xs rounded-2xl flex items-start gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] font-medium text-center justify-center w-full">
            <span className="leading-relaxed">Welcome! Please set a personal password before continuing.</span>
          </div>

          <div className="w-full">
            <PasswordFields
              heading="Create Password"
              subheading="Choose a strong password."
              onSubmit={handleFirstLoginPassword}
              submitLabel="Save Password"
              submitLoadingLabel="Saving…"
            />
          </div>
        </div>
      )}
    </div>
  );
}
