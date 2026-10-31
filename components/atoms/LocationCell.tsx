"use client";
import { useEffect, useState } from "react";
import { getDistrictFromCoords } from "@/lib/geocoding";
import { MapPin } from "lucide-react";

export function LocationCell({
  lat,
  lng,
  latitude,
  longitude,
}: {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const [district, setDistrict] = useState<string | null>(null);
  const effectiveLat = lat ?? latitude;
  const effectiveLng = lng ?? longitude;

  const isMockOrEmpty =
    effectiveLat == null ||
    effectiveLng == null ||
    (effectiveLat === 0 && effectiveLng === 0) ||
    (effectiveLat === -12 && effectiveLng === -77) ||
    (Number.isInteger(effectiveLat) && Number.isInteger(effectiveLng));

  useEffect(() => {
    if (!isMockOrEmpty && effectiveLat != null && effectiveLng != null) {
      getDistrictFromCoords(effectiveLat, effectiveLng).then(setDistrict);
    }
  }, [effectiveLat, effectiveLng, isMockOrEmpty]);

  if (isMockOrEmpty) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const parts = district ? district.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const primaryText = parts[0] || district || "Cargando...";
  const secondaryText = parts.length > 1 ? parts.slice(1).join(", ") : null;

  const mapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1.5 text-link hover:text-primary font-medium hover:underline text-xs max-w-[170px]"
      title={`Coordenadas: ${effectiveLat}, ${effectiveLng} (Ver en Google Maps)`}
    >
      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      <span className="flex flex-col leading-tight text-left">
        <span className="font-medium text-foreground">{primaryText}</span>
        {secondaryText && (
          <span className="text-[11px] text-muted-foreground font-normal">{secondaryText}</span>
        )}
      </span>
    </a>
  );
}
