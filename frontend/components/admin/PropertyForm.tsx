"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { PropertyDetail } from "@/lib/types";
import { ImageUploader, type UploaderImage } from "./ImageUploader";

const AMENITY_OPTIONS = [
  "Lift", "Power backup", "Security", "Gym", "Swimming pool", "Clubhouse",
  "Children's play area", "Garden", "CCTV", "Intercom", "Vaastu compliant",
];

interface Props {
  initialData?: PropertyDetail;
  propertyId?: number;
}

export function PropertyForm({ initialData, propertyId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(propertyId);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    property_type: initialData?.property_type ?? "apartment",
    listing_type: initialData?.listing_type ?? "buy",
    status: initialData?.status ?? "available",
    price: initialData?.price ?? "",
    price_display: initialData?.price_display ?? "",
    area_sqft: initialData?.area_sqft ?? "",
    carpet_area_sqft: initialData?.carpet_area_sqft ?? "",
    bedrooms: initialData?.bedrooms ?? "",
    bathrooms: initialData?.bathrooms ?? "",
    balconies: initialData?.balconies ?? "",
    floor: initialData?.floor ?? "",
    total_floors: initialData?.total_floors ?? "",
    furnishing_status: initialData?.furnishing_status ?? "",
    parking: initialData?.parking ?? "",
    address: initialData?.address ?? "",
    locality: initialData?.locality ?? "",
    city: initialData?.city ?? "Thane",
    district: initialData?.district ?? "Thane",
    pincode: initialData?.pincode ?? "",
    featured: initialData?.featured ?? false,
    published: initialData?.published ?? false,
  });
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities ?? []);
  const [images, setImages] = useState<UploaderImage[]>(
    initialData?.images.map((i) => ({
      id: i.id, image_url: i.image_url, display_order: i.display_order, is_primary: i.is_primary,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAmenity(name: string) {
    setAmenities((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const imagePayload = images.map((img, i) => ({
      image_url: img.image_url, public_id: img.public_id, display_order: i, is_primary: img.is_primary,
    }));

    const payload = {
      ...form,
      price: Number(form.price),
      area_sqft: form.area_sqft ? Number(form.area_sqft) : undefined,
      carpet_area_sqft: form.carpet_area_sqft ? Number(form.carpet_area_sqft) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      balconies: form.balconies ? Number(form.balconies) : undefined,
      total_floors: form.total_floors ? Number(form.total_floors) : undefined,
      furnishing_status: form.furnishing_status || undefined,
      amenities,
      // In edit mode, images are already persisted individually by
      // ImageUploader as they're uploaded/removed — don't resend them here.
      ...(isEdit ? {} : { images: imagePayload }),
    };

    try {
      if (isEdit && propertyId) {
        await api.admin.properties.update(propertyId, payload);
        toast("Changes saved", "success");
      } else {
        await api.admin.properties.create(payload);
        toast("Property created", "success");
      }
      router.push("/admin/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1 w-full border border-line rounded-card px-3 py-2 bg-paper";
  const labelClass = "text-sm text-stone";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
      {/* Basic information */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Basic information</h2>
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Title</span>
            <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className={labelClass}>Property type</span>
              <select value={form.property_type} onChange={(e) => update("property_type", e.target.value as typeof form.property_type)} className={inputClass}>
                {["apartment", "flat", "house", "villa", "plot", "shop", "office", "commercial", "other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Listing type</span>
              <select value={form.listing_type} onChange={(e) => update("listing_type", e.target.value as typeof form.listing_type)} className={inputClass}>
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Status</span>
              <select value={form.status} onChange={(e) => update("status", e.target.value as typeof form.status)} className={inputClass}>
                {["available", "sold", "rented", "on_hold"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Property details */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Property details</h2>
        <div className="grid grid-cols-3 gap-4">
          <label className="block"><span className={labelClass}>Bedrooms</span><input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Bathrooms</span><input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Balconies</span><input type="number" value={form.balconies} onChange={(e) => update("balconies", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Area (sq.ft)</span><input type="number" value={form.area_sqft} onChange={(e) => update("area_sqft", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Carpet area (sq.ft)</span><input type="number" value={form.carpet_area_sqft} onChange={(e) => update("carpet_area_sqft", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Floor</span><input value={form.floor} onChange={(e) => update("floor", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Total floors</span><input type="number" value={form.total_floors} onChange={(e) => update("total_floors", e.target.value)} className={inputClass} /></label>
          <label className="block">
            <span className={labelClass}>Furnishing</span>
            <select value={form.furnishing_status} onChange={(e) => update("furnishing_status", e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi_furnished">Semi-furnished</option>
              <option value="fully_furnished">Fully furnished</option>
            </select>
          </label>
          <label className="block"><span className={labelClass}>Parking</span><input value={form.parking} onChange={(e) => update("parking", e.target.value)} className={inputClass} /></label>
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block"><span className={labelClass}>Price (₹)</span><input required type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className={inputClass} /></label>
          <label className="block"><span className={labelClass}>Display price (optional)</span><input placeholder="e.g. ₹85 Lakh" value={form.price_display} onChange={(e) => update("price_display", e.target.value)} className={inputClass} /></label>
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Location</h2>
        <div className="space-y-4">
          <label className="block"><span className={labelClass}>Address</span><input value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} /></label>
          <div className="grid grid-cols-4 gap-4">
            <label className="block"><span className={labelClass}>Locality</span><input required value={form.locality} onChange={(e) => update("locality", e.target.value)} className={inputClass} /></label>
            <label className="block"><span className={labelClass}>City</span><input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} /></label>
            <label className="block"><span className={labelClass}>District</span><input value={form.district} onChange={(e) => update("district", e.target.value)} className={inputClass} /></label>
            <label className="block"><span className={labelClass}>Pincode</span><input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className={inputClass} /></label>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((name) => (
            <button
              type="button" key={name} onClick={() => toggleAmenity(name)}
              className={`px-3 py-1.5 rounded-card text-sm border ${
                amenities.includes(name) ? "bg-lake text-paper border-lake" : "border-line text-stone"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Images */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Images</h2>
        <ImageUploader images={images} onChange={setImages} propertyId={propertyId} />
      </section>

      {/* Publishing */}
      <section>
        <h2 className="font-display text-xl text-ink mb-4">Publishing</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} />
            <span>Published (visible on the public site)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            <span>Featured (shown on homepage)</span>
          </label>
        </div>
      </section>

      {error && <p className="text-red-700 text-sm">{error}</p>}

      <button
        type="submit" disabled={saving}
        className="bg-ink text-paper px-6 py-3 rounded-card font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : isEdit ? "Save changes" : "Create property"}
      </button>
    </form>
  );
}
