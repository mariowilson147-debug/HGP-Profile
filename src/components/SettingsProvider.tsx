"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Settings = {
  companyName: string;
  companyLogoUrl: string;
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  isMounted: boolean;
}

const defaultSettings: Settings = {
  companyName: "Premium.",
  companyLogoUrl: "",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("catalog_settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        // Syntax error mapping fallback
      }
    }
    setIsMounted(true);
  }, []);

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
