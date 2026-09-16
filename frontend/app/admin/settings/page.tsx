"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get().then((s) => { setForm(s); setLoading(false); });
  }, []);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api.admin.settings.update(form);
    setSaving(false);
    setSaved(true);
  }

  const inputClass = "mt-1 w-full border border-line rounded-card px-3 py-2 bg-paper";
  const labelClass = "text-sm text-stone";

  if (loading) return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8 max-w-2xl space-y-4">
        <Skeleton className="h-9 w-40 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </div>
  );

  return (
    <div>
      <AdminNav />
      <div className="px-6 lg:px-10 py-8 max-w-2xl">
        <h1 className="font-display text-3xl text-ink mb-8">Settings</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block"><span className={labelClass}>Business name</span><input value={form.business_name ?? ""} onChange={(e) => update("business_name", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Tagline</span><input value={form.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Consultant name</span><input value={form.consultant_name ?? ""} onChange={(e) => update("consultant_name", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Phone</span><input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>WhatsApp number</span><input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Email</span><input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Address</span><input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>About text</span><textarea rows={5} value={form.about_text ?? ""} onChange={(e) => update("about_text", e.target.value)} className={inputClass} /></label>

          <button
            type="submit" disabled={saving}
            className="bg-ink text-paper px-6 py-3 rounded-card font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <span className="ml-3 text-sm text-lake-dark">Saved.</span>}
        </form>

        <ChangePasswordSection />
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      await api.auth.changePassword(current, next);
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mt-14 pt-10 border-t border-line">
      <h2 className="font-display text-xl text-ink mb-4">Change password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-stone">Current password</span>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full border border-line rounded-card px-3 py-2 bg-paper" />
        </label>
        <label className="block">
          <span className="text-sm text-stone">New password</span>
          <input type="password" required value={next} onChange={(e) => setNext(e.target.value)}
            className="mt-1 w-full border border-line rounded-card px-3 py-2 bg-paper" />
        </label>
        <label className="block">
          <span className="text-sm text-stone">Confirm new password</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full border border-line rounded-card px-3 py-2 bg-paper" />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit" disabled={busy}
          className="bg-ink text-paper px-6 py-3 rounded-card font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
        >
          {busy ? "Changing…" : "Change password"}
        </button>
        {success && <span className="ml-3 text-sm text-lake-dark">Password changed.</span>}
      </form>
    </div>
  );
}
