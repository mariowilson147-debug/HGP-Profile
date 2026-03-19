"use client";

import { useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
    <div className="w-full bg-[#0a0a0a] min-h-[80vh] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-[#fefefe] mb-2">Company Settings</h1>
        <p className="text-[#888] text-sm mb-10">Customize your digital showroom branding.</p>

        <form onSubmit={handleSave} className="space-y-8 bg-[#0f0f0f] border border-[#222] p-8 md:p-12 rounded-sm shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Company Logo</label>
              <div className="flex items-center gap-6">
                {(logoFile || settings.companyLogoUrl) && (
                  <div className="w-16 h-16 bg-[#111] border border-[#333] rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoFile ? URL.createObjectURL(logoFile) : settings.companyLogoUrl} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#111] border border-[#333] text-[#888] px-4 py-3 rounded-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-[#1a1a1a] file:text-[#d4af37] hover:file:bg-[#222] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#222]">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-[#0f0f0f] font-medium uppercase tracking-[0.2em] text-xs rounded-sm hover:from-[#d4af37] hover:to-[#ebd483] transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
