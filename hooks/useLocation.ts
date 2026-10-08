import { useEffect, useState } from "react";

type Coords = {
  lat: number;
  lng: number;
};

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [nearestDistrict, setNearestDistrict] = useState("Detectando ubicación...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        // Query openstreetmap free reverse geocoding API to resolve actual district/city
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            const addr = data.address || {};
            const district = addr.suburb || addr.city_district || addr.district || addr.town || addr.city || "Ubicación detectada";
            setNearestDistrict(district);
          })
          .catch((err) => {
            console.error("[GPS] Reverse geocoding failed:", err);
            setNearestDistrict("Ubicación detectada");
          });
      },
      (err) => {
        console.warn("[GPS] Unavailable:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setNearestDistrict("Permiso de GPS denegado");
        } else {
          setNearestDistrict("GPS no disponible");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  return { coords, nearestDistrict };
}