/**
 * Typed fetch client for the HappyHouse API.
 * Server Components call these directly; client components (forms, admin
 * actions) can use the same functions since they're plain fetch wrappers.
 *
 * IMPORTANT — two different base URLs are needed:
 *  - Server-side (Server Components, route handlers like sitemap.ts) run
 *    as Node.js code. In Docker, that's *inside the frontend container*,
 *    so "localhost:8000" would mean "this container", not the backend
 *    container — it must use the Docker network name instead ("backend:8000").
 *  - Client-side (the browser, "use client" components) always uses
 *    "localhost:8000" (or whatever's publicly reachable), since the
 *    browser runs on the host machine, outside Docker's network.
 * SERVER_API_URL is a plain (non-NEXT_PUBLIC_) env var, so it's only
 * readable server-side and never leaks into the client bundle.
 */
import type {
  PaginatedProperties, PropertyDetail, PropertySearchParams,
  SiteSettings, Area, EnquiryPayload,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SERVER_API_URL = process.env.SERVER_API_URL || API_URL;

function resolveApiUrl(): string {
  return typeof window === "undefined" ? SERVER_API_URL : API_URL;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Reads the CSRF token from its cookie (set by the login response,
 * deliberately non-httpOnly so this can read it) and echoes it back as a
 * header on mutating requests — see auth.verify_csrf on the backend for
 * why. No-op server-side (no cookies to read there) and harmless on
 * public/unauthenticated endpoints (no cookie exists, header is just
 * omitted, and those routes don't check for it anyway).
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )happyhouse_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "X-CSRF-Token": token } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const res = await fetch(`${resolveApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(MUTATING_METHODS.has(method) ? csrfHeaders() : {}),
      ...init?.headers,
    },
    credentials: "include", // send the session cookie for admin routes
  });

  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    // Session missing/expired mid-use — send back to login rather than
    // leaving the page in a broken, half-loaded state.
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    return new Promise<T>(() => {}); // navigation is happening; never resolve
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      usp.set(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  admin: {
    properties: {
      list: () => apiFetch<PropertyDetail[]>("/api/admin/properties", { cache: "no-store" }),
      create: (payload: Record<string, unknown>) =>
        apiFetch<PropertyDetail>("/api/admin/properties", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: number, payload: Record<string, unknown>) =>
        apiFetch<PropertyDetail>(`/api/admin/properties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: number) => apiFetch(`/api/admin/properties/${id}`, { method: "DELETE" }),
      setPublished: (id: number, published: boolean) =>
        apiFetch(`/api/admin/properties/${id}/publish?published=${published}`, { method: "PATCH" }),
      setFeatured: (id: number, featured: boolean) =>
        apiFetch(`/api/admin/properties/${id}/featured?featured=${featured}`, { method: "PATCH" }),
      setStatus: (id: number, status_value: string) =>
        apiFetch(`/api/admin/properties/${id}/status?status_value=${status_value}`, { method: "PATCH" }),
      importCsv: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_URL}/api/admin/properties/import.csv`, {
          method: "POST",
          credentials: "include",
          headers: csrfHeaders(),
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Import failed: ${res.status}`);
        }
        return res.json() as Promise<{ created: { row: number; title: string; id: number }[]; errors: { row: number; error: string }[] }>;
      },
      addImage: (propertyId: number, payload: { image_url: string; public_id?: string; display_order?: number; is_primary?: boolean }) =>
        apiFetch<{ id: number; image_url: string; display_order: number; is_primary: boolean }>(
          `/api/admin/properties/${propertyId}/images`, { method: "POST", body: JSON.stringify(payload) }
        ),
      removeImage: (propertyId: number, imageId: number) =>
        apiFetch(`/api/admin/properties/${propertyId}/images/${imageId}`, { method: "DELETE" }),
      setPrimaryImage: (propertyId: number, imageId: number) =>
        apiFetch(`/api/admin/properties/${propertyId}/images/${imageId}?is_primary=true`, { method: "PATCH" }),
    },
    uploads: {
      getSignature: () =>
        apiFetch<{ timestamp: number; signature: string; api_key: string; cloud_name: string; folder: string; max_size_mb: number }>(
          "/api/admin/uploads/sign", { method: "POST" }
        ),
    },
    enquiries: {
      list: () => apiFetch<any[]>("/api/admin/enquiries", { cache: "no-store" }),
      updateStatus: (id: number, status: string) =>
        apiFetch(`/api/admin/enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    },
    settings: {
      update: (payload: Partial<SiteSettings>) =>
        apiFetch<SiteSettings>("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) }),
    },
    areas: {
      list: () => apiFetch<Area[]>("/api/admin/areas", { cache: "no-store" }),
      create: (payload: Partial<Area> & { name: string }) =>
        apiFetch<Area>("/api/admin/areas", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: number, payload: Partial<Area>) =>
        apiFetch<Area>(`/api/admin/areas/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: number) => apiFetch(`/api/admin/areas/${id}`, { method: "DELETE" }),
    },
  },
  properties: {
    list: (params: PropertySearchParams = {}) =>
      apiFetch<PaginatedProperties>(`/api/properties${toQuery(params as Record<string, unknown>)}`, {
        cache: "no-store", // listings change often; skip the RSC fetch cache
      }),
    bySlug: (slug: string) =>
      apiFetch<PropertyDetail>(`/api/properties/${slug}`, { cache: "no-store" }),
  },
  areas: {
    // Areas rarely change — cache for a minute instead of hitting the
    // DB on every single page load (this was previously running on
    // every request via the (site) layout's force-dynamic export).
    list: () => apiFetch<Area[]>("/api/areas", { next: { revalidate: 60 } }),
  },
  settings: {
    get: () => apiFetch<SiteSettings>("/api/settings", { next: { revalidate: 60 } }),
  },
  enquiries: {
    submit: (payload: EnquiryPayload) =>
      apiFetch("/api/enquiries", { method: "POST", body: JSON.stringify(payload) }),
  },
  auth: {
    login: (email: string, password: string) =>
      apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiFetch("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }),
  },
};
