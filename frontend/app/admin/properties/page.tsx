"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { PropertyDetail } from "@/lib/types";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    const data = await api.admin.properties.list();
    setProperties(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.admin.properties.remove(id);
      toast(`Deleted "${title}"`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete property", "error");
    }
  }

  async function togglePublish(p: PropertyDetail) {
    try {
      await api.admin.properties.setPublished(p.id, !p.published);
      toast(!p.published ? `"${p.title}" is now live` : `"${p.title}" unpublished`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update property", "error");
    }
  }

  async function toggleFeatured(p: PropertyDetail) {
    try {
      await api.admin.properties.setFeatured(p.id, !p.featured);
      toast(!p.featured ? `Featured "${p.title}"` : `Unfeatured "${p.title}"`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update property", "error");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.admin.properties.importCsv(file);
      setImportResult({ created: result.created.length, errors: result.errors });
      load();
    } catch (err) {
      setImportResult({ created: 0, errors: [{ row: 0, error: err instanceof Error ? err.message : "Import failed" }] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-ink">Properties</h1>
          <div className="flex items-center gap-3">
            <a
              href={`${API_URL}/api/admin/properties/export.csv`}
              className="border border-line px-4 py-2.5 rounded-card font-medium text-sm hover:border-lake transition-colors"
            >
              Export CSV
            </a>
            <label className="border border-line px-4 py-2.5 rounded-card font-medium text-sm hover:border-lake transition-colors cursor-pointer">
              {importing ? "Importing…" : "Import CSV"}
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} disabled={importing} className="hidden" />
            </label>
            <Link href="/admin/properties/new" className="bg-lake text-paper px-5 py-2.5 rounded-card font-medium">
              Add property
            </Link>
          </div>
        </div>

        {importResult && (
          <div className={`mb-6 border rounded-card p-4 text-sm ${importResult.errors.length > 0 ? "border-clay" : "border-lake"}`}>
            <p className={importResult.errors.length > 0 ? "text-clay" : "text-lake-dark"}>
              Imported {importResult.created} {importResult.created === 1 ? "property" : "properties"} as drafts —
              review and publish each one individually.
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-red-700 list-disc pl-5">
                {importResult.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading ? (
          <div className="border border-line rounded-card overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border-b border-line last:border-0">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="border border-line rounded-card p-12 text-center text-stone">
            No properties yet. Add your first one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto border border-line rounded-card">
            <table className="w-full text-sm">
              <thead className="bg-line/40 text-left">
                <tr>
                  <th className="p-3">Property</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Published</th>
                  <th className="p-3">Featured</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3 font-medium text-ink">{p.title}</td>
                    <td className="p-3 text-stone">{p.locality}</td>
                    <td className="p-3 capitalize text-stone">{p.listing_type} · {p.property_type}</td>
                    <td className="p-3 text-stone">{p.price_display || p.price}</td>
                    <td className="p-3 capitalize text-stone">{p.status}</td>
                    <td className="p-3">
                      <button onClick={() => togglePublish(p)} className={p.published ? "text-lake" : "text-stone"}>
                        {p.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleFeatured(p)} className={p.featured ? "text-clay" : "text-stone"}>
                        {p.featured ? "Yes" : "No"}
                      </button>
                    </td>
                    <td className="p-3 space-x-3 whitespace-nowrap">
                      <Link href={`/admin/properties/${p.id}/edit`} className="text-lake-dark hover:underline">Edit</Link>
                      <button onClick={() => handleDelete(p.id, p.title)} className="text-red-700 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
