/**
 * Geocodes an address string to coordinates using OpenStreetMap's
 * Nominatim service — free, no API key, but usage-policy-gated: requires
 * a descriptive User-Agent and reasonable request volume. Since a
 * business address changes rarely, results are cached for 24h so this
 * essentially never runs more than once a day regardless of traffic.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  if (!address.trim()) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "HappyHouse-PropertyConsultancy/1.0 (contact page map)",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const { lat, lon } = results[0];
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
  } catch {
    return null; // network issue, rate limit, etc. — caller falls back gracefully
  }
}
