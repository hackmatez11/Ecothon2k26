const SENTINEL_API_URL = import.meta.env.VITE_SENTINEL_API_URL || 'http://localhost:8000';

export interface OilSpill {
  latitude:  number;
  longitude: number;
  area_km2:  number;
  severity:  'Minor' | 'Moderate' | 'Major';
}

export interface OilSpillResponse {
  bbox:             [number, number, number, number];
  spill_count:      number;
  spills:           OilSpill[];
  detection_image:  string | null;
  source:           string;
  generated_at:     string;
}

export async function fetchOilSpills(
  lat: number,
  lng: number,
  radiusDeg = 1.5,
): Promise<OilSpillResponse> {
  const min_lat = lat - radiusDeg;
  const max_lat = lat + radiusDeg;
  const min_lon = lng - radiusDeg;
  const max_lon = lng + radiusDeg;

  const url = `${SENTINEL_API_URL}/detect-oil-spill?min_lon=${min_lon}&min_lat=${min_lat}&max_lon=${max_lon}&max_lat=${max_lat}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Oil spill API error ${res.status}`);
  }
  return res.json();
}
