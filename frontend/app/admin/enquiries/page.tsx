"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

interface EnquiryRow {
  id: number;
  property_id: number | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  enquiry_type: string;
  status: string;
  created_at: string;
}

const STATUSES = ["new", "contacted", "follow_up", "closed"];

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setEnquiries(await api.admin.enquiries.list());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: number, status: string) {
    await api.admin.enquiries.updateStatus(id, status);
    load();
  }

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8">
        <h1 className="font-display text-3xl text-ink mb-8">Enquiries</h1>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : enquiries.length === 0 ? (
          <div className="border border-line rounded-card p-12 text-center text-stone">
            No enquiries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {enquiries.map((e) => (
              <div key={e.id} className="border border-line rounded-card p-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-ink">{e.name} · {e.phone}</div>
                  {e.email && <div className="text-sm text-stone">{e.email}</div>}
                  {e.message && <p className="text-sm text-ink/80 mt-1 max-w-lg">{e.message}</p>}
                  <div className="text-xs text-stone mt-1">
                    {e.enquiry_type} · {new Date(e.created_at).toLocaleString()}
                    {e.property_id && ` · Property #${e.property_id}`}
                  </div>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => updateStatus(e.id, ev.target.value)}
                  className="border border-line rounded-card px-3 py-2 text-sm capitalize"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
