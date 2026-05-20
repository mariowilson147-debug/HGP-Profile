/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MessageSquare, Filter, Clock, Phone, Save } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { updateStoreSettings } from "@/lib/actions";
import { useState } from "react";

export default function InquiriesTab({ stats }: { stats: any }) {
  const { recentMessages } = stats;
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || "");
  const [enableWhatsapp, setEnableWhatsapp] = useState(settings.enableWhatsapp);

  const handleSaveSettings = async () => {
    setSaving(true);
    const updates = { whatsapp_number: whatsappNumber, enable_whatsapp: enableWhatsapp };
    const { error } = await updateStoreSettings(updates);
    if (!error) {
      updateSettings({ ...settings, whatsappNumber, enableWhatsapp });
      alert("WhatsApp settings saved.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Customer Interactions</h2>
        <p className="text-sm text-slate-500">Manage incoming inquiries and communication settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inquiries List (2/3 width) */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[#333] font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="text-[#1f4e79]" size={16} />
              Inquiries Raised
            </h3>
            <button className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors shadow-sm">
              <Filter size={14} /> Filter
            </button>
          </div>
          
          {recentMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No recent inquiries to display.</div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider w-1/2">Message Preview</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Date</th>
                    <th className="px-6 py-3 text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentMessages.map((msg: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded border border-slate-200 bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-xs">
                            {msg.name ? msg.name[0].toUpperCase() : '?'}
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{msg.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-1 group-hover:text-[#1f4e79] transition-colors">{msg.content}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          msg.is_admin_reply ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {msg.is_admin_reply ? 'Replied' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Settings Panel (1/3 width) */}
        <div className="bg-white shadow-sm rounded border border-slate-200 h-fit">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[#333] font-semibold text-sm flex items-center gap-2">
              <Phone className="text-emerald-600" size={16} />
              WhatsApp Integration
            </h3>
          </div>
          
          <div className="p-6 space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Enable WhatsApp chat on your public product pages to allow direct customer communication.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Enable Widget</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={enableWhatsapp}
                    onChange={(e) => setEnableWhatsapp(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number (inc. country code)</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 254700000000"
                  className="w-full bg-transparent border border-slate-300 px-3 py-2 rounded text-sm focus:outline-none focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] transition-all"
                />
              </div>
              
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1f4e79] text-white font-medium text-sm rounded hover:bg-[#183d5d] transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
