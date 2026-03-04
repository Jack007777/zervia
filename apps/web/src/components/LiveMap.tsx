type Props = {
  lat: number;
  lng: number;
  markers?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
};

function toBbox(lat: number, lng: number) {
  const delta = 0.08;
  const left = (lng - delta).toFixed(6);
  const right = (lng + delta).toFixed(6);
  const top = (lat + delta).toFixed(6);
  const bottom = (lat - delta).toFixed(6);
  return `${left},${bottom},${right},${top}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildSrcDoc(lat: number, lng: number, markers: Props['markers']) {
  const markerData =
    markers && markers.length
      ? markers.map((item) => ({ id: item.id, name: escapeHtml(item.name), lat: item.lat, lng: item.lng }))
      : [{ id: 'center', name: 'Search center', lat, lng }];

  const markerJson = JSON.stringify(markerData);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; width: 100%; height: 100%; }
      .leaflet-popup-content { margin: 8px 10px; font: 12px/1.3 system-ui, sans-serif; }
      .leaflet-control-attribution {
        font-size: 10px;
        line-height: 1.2;
        background: rgba(255, 255, 255, 0.65);
        color: rgba(71, 85, 105, 0.8);
        padding: 1px 4px;
      }
      .leaflet-control-attribution a {
        color: rgba(37, 99, 235, 0.75);
        text-decoration: none;
      }
      .leaflet-control-attribution a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map', { zoomControl: true }).setView([${lat.toFixed(6)}, ${lng.toFixed(6)}], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      const points = ${markerJson};
      const bounds = [];
      points.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        marker.bindPopup('<b>' + p.name + '</b>');
        bounds.push([p.lat, p.lng]);
      });
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    </script>
  </body>
</html>`;
}

export function LiveMap({ lat, lng, markers }: Props) {
  const bbox = toBbox(lat, lng);
  const fallbackSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(
    6
  )}%2C${lng.toFixed(6)}`;
  const srcDoc = buildSrcDoc(lat, lng, markers);

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <iframe
        title="Zervia map"
        src={fallbackSrc}
        srcDoc={srcDoc}
        className="h-64 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
