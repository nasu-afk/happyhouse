"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Area } from "@/lib/types";

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    setAreas(await api.admin.areas.list());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.admin.areas.create({ name: newName.trim(), display_order: areas.length });
      setNewName("");
      toast(`Added "${newName.trim()}"`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add area", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(area: Area, patch: Partial<Area>) {
    try {
      await api.admin.areas.update(area.id, patch);
      setAreas((prev) => prev.map((a) => (a.id === area.id ? { ...a, ...patch } : a)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update area", "error");
    }
  }

  async function handleDelete(area: Area) {
    if (!confirm(`Delete "${area.name}"? This can't be undone.`)) return;
    try {
      await api.admin.areas.remove(area.id);
      toast(`Deleted "${area.name}"`, "success");
      setAreas((prev) => prev.filter((a) => a.id !== area.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete area", "error");
    }
  }

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8 max-w-6xl">
        <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink mb-2">Areas we serve</h1>
        <p className="text-stone mb-8">
          Add a photo for each locality — these show on the public &ldquo;Areas&rdquo; page.
          Only active areas appear publicly.
        </p>

        <form onSubmit={handleCreate} className="flex gap-2 mb-8">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a new area, e.g. Kolshet"
            className="flex-1 border border-line rounded-card px-3 py-2.5 bg-paper"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-lake text-paper px-5 py-2.5 rounded-card font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
          >
            {creating ? "Adding…" : "Add area"}
          </button>
        </form>
        </div>

        {loading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : areas.length === 0 ? (
          <p className="text-stone text-sm">No areas yet — add your first one above.</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {areas.map((area) => (
              <div key={area.id} className="border border-line rounded-card p-5 grid sm:grid-cols-[160px_1fr] gap-5">
                <SingleImageUpload
                  imageUrl={area.image_url}
                  onChange={(url) => handleUpdate(area, { image_url: url })}
                />
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <input
                      defaultValue={area.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== area.name && handleUpdate(area, { name: e.target.value.trim() })}
                      className="font-display text-lg text-ink bg-transparent border-b border-transparent hover:border-line focus:border-lake outline-none w-full"
                    />
                    <button onClick={() => handleDelete(area)} className="text-sm text-red-700 hover:underline whitespace-nowrap">
                      Delete
                    </button>
                  </div>
                  <textarea
                    defaultValue={area.description ?? ""}
                    onBlur={(e) => handleUpdate(area, { description: e.target.value || null })}
                    placeholder="Short description (optional)"
                    rows={2}
                    className="w-full text-sm border border-line rounded-card px-3 py-2 bg-paper mb-3"
                  />
                  <label className="flex items-center gap-2 text-sm text-stone">
                    <input
                      type="checkbox"
                      checked={area.active}
                      onChange={(e) => handleUpdate(area, { active: e.target.checked })}
                    />
                    Active (visible on the public site)
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
