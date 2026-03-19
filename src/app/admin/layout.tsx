import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
  title: "Admin Dashboard - Premium Product Range",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute reqRole="admin">
      <div className="flex-1 bg-[#0a0a0a]">
        {children}
      </div>
    </ProtectedRoute>
  );
}
