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
      addr.city ||
      addr.town ||
      addr.city_district ||
      addr.suburb ||
      addr.municipality ||
      addr.county ||
      addr.neighbourhood ||
      addr.quarter ||
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const state = addr.state || addr.region;
    const result = state && district && !district.includes(state) && district !== state
      ? `${district}, ${state}`
      : district;

    cache[key] = result;
    return result;
  } catch (err) {
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    cache[key] = fallback;
    return fallback;
  }
}
