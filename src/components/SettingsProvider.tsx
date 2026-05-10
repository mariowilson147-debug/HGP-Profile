"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CategoryConfig = {
  id: string;
  name: string;
  iconName: string;
  skuPrefix: string;
};

export type Settings = {
  companyName: string;
  companyLogoUrl: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  categories: CategoryConfig[];
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  isMounted: boolean;
}

const defaultSettings: Settings = {
  companyName: "Prutam Enterprise Limited",
  companyLogoUrl: "",
  theme: "light",
  accentColor: "#3b82f6",
  categories: [
    { id: "1", name: "Lighting", iconName: "Lightbulb", skuPrefix: "LGT" },
    { id: "2", name: "Bathroom & Plumbing", iconName: "Bath", skuPrefix: "BTH" },
    { id: "3", name: "Interior Decor", iconName: "Sofa", skuPrefix: "DEC" },
    { id: "4", name: "Electricals", iconName: "Plug", skuPrefix: "ELE" },
    { id: "5", name: "Work Wear", iconName: "Shirt", skuPrefix: "WRK" },
  ],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("catalog_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = defaultSettings.categories;
        }
        setSettings(parsed);
      } catch {
        // Syntax error mapping fallback
      }
    }
    setIsMounted(true);
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
        // system
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
    setSettings(newSettings);
    localStorage.setItem("catalog_settings", JSON.stringify(newSettings));
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
