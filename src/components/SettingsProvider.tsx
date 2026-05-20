"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDbCategories, getStoreSettings, Category } from "@/lib/actions";

export type { Category as CategoryConfig } from "@/lib/actions";

// Merge both for UI convenience, mapping store_settings to the old Settings format
export type Settings = {
  companyName: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  categories: Category[];
  whatsappNumber: string | null;
  enableWhatsapp: boolean;
  inquiryAutoReply: string | null;
  mediaWatermarkEnabled: boolean;
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  isMounted: boolean;
}

const defaultSettings: Settings = {
  companyName: "Interior Finishes Supermarket",
  theme: "light",
  accentColor: "#3b82f6",
  categories: [],
  whatsappNumber: null,
  enableWhatsapp: true,
  inquiryAutoReply: null,
  mediaWatermarkEnabled: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [dbCats, dbSettings] = await Promise.all([
          getDbCategories(),
          getStoreSettings()
        ]);
        
        setSettings({
          companyName: dbSettings?.company_name || defaultSettings.companyName,
          theme: (dbSettings?.theme as 'light' | 'dark' | 'system') || defaultSettings.theme,
          accentColor: dbSettings?.accent_color || defaultSettings.accentColor,
          categories: dbCats || [],
          whatsappNumber: dbSettings?.whatsapp_number || null,
          enableWhatsapp: dbSettings?.enable_whatsapp ?? true,
          inquiryAutoReply: dbSettings?.inquiry_auto_reply || null,
          mediaWatermarkEnabled: dbSettings?.media_watermark_enabled ?? false,
        });
      } catch (e) {
        console.error("Failed to load global settings", e);
      } finally {
        setIsMounted(true);
      }
    };
    
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else if (settings.theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }, [settings.theme, isMounted]);

  const updateSettings = (newSettings: Settings) => {
    // We only update local state here. 
    // Database updates must be handled explicitly via server actions (updateStoreSettings / updateDbCategory)
    // to ensure security and proper revalidation.
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isMounted }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
