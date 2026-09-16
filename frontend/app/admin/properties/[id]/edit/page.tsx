"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { api } from "@/lib/api";
import type { PropertyDetail } from "@/lib/types";

export default function EditPropertyPage() {
  const params = useParams();
  const id = Number(params.id);
  const [property, setProperty] = useState<PropertyDetail | null>(null);

  useEffect(() => {
    api.admin.properties.list().then((all) => {
      setProperty(all.find((p) => p.id === id) ?? null);
    });
  }, [id]);

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8">
        <h1 className="font-display text-3xl text-ink mb-8">Edit property</h1>
        {property ? (
          <PropertyForm initialData={property} propertyId={id} />
        ) : (
          <p className="text-stone">Loading…</p>
        )}
      </div>
    </div>
  );
}
