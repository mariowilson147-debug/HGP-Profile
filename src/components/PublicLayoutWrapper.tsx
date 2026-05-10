"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
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
