"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PropertyDetail } from "@/lib/types";

interface EnquiryRow { status: string }

const STATUS_SEGMENTS: { key: "available" | "sold" | "rented" | "on_hold"; label: string; color: string }[] = [
  { key: "available", label: "Available", color: "bg-lake" },
  { key: "sold", label: "Sold", color: "bg-clay" },
  { key: "rented", label: "Rented", color: "bg-lake-light" },
  { key: "on_hold", label: "On hold", color: "bg-stone" },
];

export default function AdminDashboard() {
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.admin.properties.list(), api.admin.enquiries.list()])
      .then(([props, enq]) => {
        setProperties(props);
        setEnquiries(enq);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = properties.length;
  const published = properties.filter((p) => p.published).length;
  const featured = properties.filter((p) => p.featured).length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;

  const statusCounts = STATUS_SEGMENTS.map((seg) => ({
    ...seg,
    count: properties.filter((p) => p.status === seg.key).length,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-10 max-w-3xl">
        {loading ? (
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48 mb-8" />
            <Skeleton className="h-20 w-full mb-8" />
            <Skeleton className="h-3 w-full mb-3" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-10">
              <div>
                <h1 className="font-display text-3xl text-ink">{greeting}.</h1>
                <p className="text-stone mt-1">Here&apos;s where things stand today.</p>
              </div>
              <Link
                href="/admin/properties/new"
                className="bg-ink text-paper px-5 py-2.5 rounded-card font-medium hover:bg-lake-dark transition-colors whitespace-nowrap"
              >
                Add property
              </Link>
            </div>

            {/* Enquiries — the one thing that actually needs attention */}
            {newEnquiries > 0 ? (
              <Link
                href="/admin/enquiries"
                className="block bg-clay text-paper rounded-card p-6 mb-10 hover:bg-clay/90 transition-colors"
              >
                <p className="font-display text-2xl">
                  {newEnquiries} new {newEnquiries === 1 ? "enquiry" : "enquiries"} waiting
                </p>
                <p className="text-paper/80 mt-1 text-sm">Review and respond →</p>
              </Link>
            ) : (
              <p className="text-stone mb-10 pb-6 border-b border-line">No new enquiries right now.</p>
            )}

            {/* Listings — proportion, not identical boxes */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-display text-xl text-ink">Listings</h2>
                <span className="text-sm text-stone">{published} of {total} published</span>
              </div>

              {total === 0 ? (
                <p className="text-stone text-sm border border-line rounded-card p-6 text-center">
                  No properties yet — add your first one to see it here.
                </p>
              ) : (
                <>
                  <div className="h-3 rounded-full overflow-hidden flex bg-line">
                    {statusCounts.filter((s) => s.count > 0).map((seg) => (
                      <div
                        key={seg.key}
                        className={seg.color}
                        style={{ width: `${(seg.count / total) * 100}%` }}
                        title={`${seg.label}: ${seg.count}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-stone">
                    {statusCounts.filter((s) => s.count > 0).map((seg) => (
                      <span key={seg.key} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${seg.color}`} aria-hidden />
                        {seg.label} {seg.count}
                      </span>
                    ))}
                    {featured > 0 && <span>· {featured} featured</span>}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
