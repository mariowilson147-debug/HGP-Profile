"use client";

import { useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Building2, Image as ImageIcon } from "lucide-react";

export default function SettingsDashboard() {
  const { settings, updateSettings } = useSettings();
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalLogoUrl = settings.companyLogoUrl;

    if (logoFile) {
      const supabase = createSupabaseBrowserClient();
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `logos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('images') // Will attempt to upload to the "images" bucket
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        alert("Failed to upload logo: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      finalLogoUrl = data.publicUrl;
    }

    updateSettings({ companyName, companyLogoUrl: finalLogoUrl });
    setLoading(false);
    alert("Settings saved successfully!");
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800 tracking-tight">Company Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Customize your digital showroom branding and appearance.</p>
        </div>
      </header>

      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 md:p-10 space-y-8 flex-1">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Building2 size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="Enter company name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Company Logo</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {(logoFile || settings.companyLogoUrl) && (
                  <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0 p-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoFile ? URL.createObjectURL(logoFile) : settings.companyLogoUrl} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  </div>
                )}
                
                <div className="flex-1 w-full">
                  <label className="cursor-pointer group flex items-center justify-center w-full bg-slate-50 border-2 border-dashed border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/50 rounded-xl px-4 py-6 transition-all">
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                      <ImageIcon size={24} />
                      <span className="text-sm font-medium">Click to upload or drag and drop</span>
                      <span className="text-xs text-slate-400 font-light">PNG, JPG, SVG up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 md:px-10 py-5 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-xl hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
