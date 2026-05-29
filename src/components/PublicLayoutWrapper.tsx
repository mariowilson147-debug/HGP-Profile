"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/seller") || pathname?.startsWith("/manager") || pathname === "/login";

  if (isAppRoute) {
    return <main className="flex-grow flex flex-col">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
