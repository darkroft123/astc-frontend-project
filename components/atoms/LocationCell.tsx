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

  const mapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline text-xs"
      title={`Coordenadas: ${effectiveLat}, ${effectiveLng} (Ver en Google Maps)`}
    >
      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      <span className="truncate max-w-[140px]">{district || "Cargando..."}</span>
    </a>
  );
}
