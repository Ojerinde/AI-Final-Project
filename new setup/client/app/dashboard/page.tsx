"use client";

import StarField from "@/components/StarField";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-space-void">
      <StarField />
      <div className="star-field" />
      <div className="relative z-10">
        <Dashboard />
      </div>
    </div>
  );
}
