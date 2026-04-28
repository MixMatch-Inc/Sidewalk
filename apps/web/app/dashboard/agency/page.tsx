"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../../lib/auth-fetch";

interface AgencySummary {
  unassigned: number;
  assigned: number;
  overdue: number;
  acknowledged: number;
  resolved: number;
}

const CARDS = [
  { key: "unassigned", label: "Unassigned", href: "/dashboard/agency/queue?status=unassigned" },
  { key: "assigned", label: "Assigned", href: "/dashboard/agency/queue?status=assigned" },
  { key: "overdue", label: "Overdue", href: "/dashboard/agency/queue?status=overdue" },
  { key: "acknowledged", label: "Acknowledged", href: "/dashboard/agency/queue?status=acknowledged" },
  { key: "resolved", label: "Resolved", href: "/dashboard/agency/queue?status=resolved" },
] as const;

export default function AgencyDashboardPage() {
  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch("/api/agency/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setError("Failed to load summary"));
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Agency Operations</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ key, label, href }) => (
          <Link key={key} href={href} className="rounded-xl border p-4 hover:bg-gray-50 transition">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">
              {summary ? summary[key] : "—"}
            </p>
          </Link>
        ))}
      </div>
      <nav className="flex gap-4 text-sm">
        <Link href="/dashboard/agency/queue" className="underline">Queue</Link>
        <Link href="/dashboard/agency/assignments" className="underline">Assignments</Link>
        <Link href="/dashboard/agency/moderation" className="underline">Moderation</Link>
      </nav>
    </main>
  );
}
