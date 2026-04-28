"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authFetch } from "../../../lib/auth-fetch";

interface QueueItem {
  id: string;
  title: string;
  status: string;
  district: string;
  assignee: string | null;
  integrityFlag: boolean;
  createdAt: string;
}

export default function AssignmentQueuePage() {
  const params = useSearchParams();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [page, setPage] = useState(1);

  const status = params.get("status") ?? "";
  const district = params.get("district") ?? "";

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), ...(status && { status }), ...(district && { district }) });
    authFetch(`/api/agency/queue?${qs}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [page, status, district]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Assignment Queue</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-4">Report</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">District</th>
            <th className="py-2 pr-4">Assignee</th>
            <th className="py-2">Flag</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-4 font-medium">{item.title}</td>
              <td className="py-2 pr-4">{item.status}</td>
              <td className="py-2 pr-4">{item.district}</td>
              <td className="py-2 pr-4">{item.assignee ?? "Unassigned"}</td>
              <td className="py-2">{item.integrityFlag ? "⚠️" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">Next</button>
      </div>
    </main>
  );
}
