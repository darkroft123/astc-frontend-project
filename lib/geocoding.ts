const cache: Record<string, string> = {};

export async function getDistrictFromCoords(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "es-PE,es;q=0.9",
        },
      }
    );
    const data = await res.json();
    const addr = data.address || {};
    const district =
      addr.city_district ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.town ||
      addr.village ||
      addr.city ||
      addr.county ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    cache[key] = district;
    return district;
  } catch (err) {
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    cache[key] = fallback;
    return fallback;
  }
}
