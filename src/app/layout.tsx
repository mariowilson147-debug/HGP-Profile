import type { Metadata } from "next";
import { Inter, Outfit, Dancing_Script } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { ChatProvider } from "@/components/ChatProvider";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Premium Product Range",
  description: "Supplying Quality Lighting, Electronics, Bathroom Ware & Interior Décor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${inter.variable} ${outfit.variable} ${dancingScript.variable} antialiased min-h-screen flex flex-col bg-[#f8fafc] text-slate-700 selection:bg-blue-100 selection:text-blue-900`}
      >
        <SettingsProvider>
          <AuthProvider>
            <ChatProvider>
              <PublicLayoutWrapper>
                {children}
              </PublicLayoutWrapper>
            </ChatProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
