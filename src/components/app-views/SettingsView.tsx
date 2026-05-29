"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateMyProfile } from "@/lib/auth-actions";
import { Loader2, Camera, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SettingsView({ returnPath }: { returnPath: string }) {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAuth, setIsSavingAuth] = useState(false);
  
  const [profileMessage, setProfileMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [authMessage, setAuthMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      await updateMyProfile(nickname);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      window.location.reload(); // Force full reload to update AuthProvider cache
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAuthMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    
    setIsSavingAuth(true);
    setAuthMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setAuthMessage({ type: 'success', text: 'Password updated successfully.' });
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setAuthMessage({ type: 'error', text: msg });
    } finally {
      setIsSavingAuth(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link href={returnPath} className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-display font-bold text-slate-900">Settings</h1>
        </Link>
        <p className="text-slate-500 mt-2">Manage your personal profile and account security.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Camera size={20} className="text-slate-400" />
            Public Profile
          </h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="text" 
                disabled 
                value={user?.email || ""}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Your email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            {profileMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {profileMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {profileMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSavingProfile}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
              Save Profile
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Lock size={20} className="text-slate-400" />
            Security
          </h2>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              />
            </div>

            {authMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${authMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {authMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {authMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSavingAuth || !password}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSavingAuth && <Loader2 size={16} className="animate-spin" />}
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
