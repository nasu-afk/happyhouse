/**
 * Real embedded, interactive map via OpenStreetMap's free embed endpoint —
 * no API key, no billing account needed (unlike Google Maps). Users can
 * pan/zoom within the iframe; "View larger map" opens the full OSM site.
 */
export function EmbeddedMap({
  latitude,
  longitude,
  zoomDelta = 0.01,
  label,
}: {
  latitude: number;
  longitude: number;
  zoomDelta?: number;
  label?: string;
}) {
  const bbox = [
    longitude - zoomDelta,
    latitude - zoomDelta,
    longitude + zoomDelta,
    latitude + zoomDelta,
  ].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const largerMapHref = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className="rounded-card overflow-hidden border border-line">
      <iframe
        title={label || "Map"}
        src={src}
        className="w-full aspect-video"
        style={{ border: 0 }}
        loading="lazy"
      />
      <div className="px-3 py-2 text-xs bg-paper">
        <a href={largerMapHref} target="_blank" rel="noopener noreferrer" className="text-lake-dark hover:underline">
          View larger map ↗
        </a>
      </div>
    </div>
  );
}
