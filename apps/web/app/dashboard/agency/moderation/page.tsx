"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "../../../lib/auth-fetch";

interface ModerationItem {
  id: string;
  title: string;
  integrityFlag: string;
  duplicateHint: boolean;
  submittedAt: string;
  district: string;
}

const FLAG_FILTERS = ["all", "suspicious", "duplicate"] as const;
type FlagFilter = (typeof FLAG_FILTERS)[number];

export default function ModerationQueuePage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filter, setFilter] = useState<FlagFilter>("all");

  useEffect(() => {
    const qs = new URLSearchParams(filter !== "all" ? { flag: filter } : {});
    authFetch(`/api/agency/moderation?${qs}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [filter]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Moderation Queue</h1>
      <div className="flex gap-2">
        {FLAG_FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded border text-sm ${filter === f ? "bg-gray-900 text-white" : ""}`}>
            {f}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="border rounded-lg p-3 flex justify-between items-start">
            <div>
              <Link href={`/dashboard/reports/${item.id}`} className="font-medium underline">{item.title}</Link>
              <p className="text-xs text-gray-500 mt-0.5">{item.district} · {new Date(item.submittedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 text-xs">
              {item.integrityFlag && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{item.integrityFlag}</span>}
              {item.duplicateHint && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">duplicate</span>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
