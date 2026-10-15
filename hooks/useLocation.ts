"use client";
import { useEffect, useState } from "react";

type Coords = {
  lat: number;
  lng: number;
};

const DEFAULT_COORDS: Coords = {
  lat: -12.0298,
  lng: -77.0678,
};
const DEFAULT_DISTRICT = "Condevilla Señor";

export function useLocation() {
  const [coords, setCoords] = useState<Coords>(DEFAULT_COORDS);
  const [nearestDistrict, setNearestDistrict] = useState(DEFAULT_DISTRICT);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator?.geolocation) {
      setCoords(DEFAULT_COORDS);
      setNearestDistrict(DEFAULT_DISTRICT);
      return;
    }

    try {
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
              const district =
                addr.suburb ||
                addr.city_district ||
                addr.district ||
                addr.town ||
                addr.city ||
                DEFAULT_DISTRICT;
              setNearestDistrict(district);
            })
            .catch(() => {
              setNearestDistrict(DEFAULT_DISTRICT);
            });
        },
        (_err) => {
          // Gracefully fallback without console error or broken UI
          setCoords(DEFAULT_COORDS);
          setNearestDistrict(DEFAULT_DISTRICT);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } catch {
      setCoords(DEFAULT_COORDS);
      setNearestDistrict(DEFAULT_DISTRICT);
    }
  }, []);

  return { coords, nearestDistrict };
}