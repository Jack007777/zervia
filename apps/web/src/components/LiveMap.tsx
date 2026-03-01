type Props = {
  lat: number;
  lng: number;
};

function toBbox(lat: number, lng: number) {
  const delta = 0.08;
  const left = (lng - delta).toFixed(6);
  const right = (lng + delta).toFixed(6);
  const top = (lat + delta).toFixed(6);
  const bottom = (lat - delta).toFixed(6);
  return `${left},${bottom},${right},${top}`;
}

export function LiveMap({ lat, lng }: Props) {
  const bbox = toBbox(lat, lng);
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(
    6
  )}%2C${lng.toFixed(6)}`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <iframe
        title="Zervia map"
        src={src}
        className="h-64 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

