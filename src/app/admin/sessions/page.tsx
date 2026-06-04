"use client";

import SessionsView from "@/components/app-views/SessionsView";

export default function AdminSessions() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SessionsView returnPath="/admin" />
    </div>
  );
}
