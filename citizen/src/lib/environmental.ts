export interface WaterQualityData {
  ph: number;
  status: 'Safe' | 'Moderate' | 'Poor';
  label: string;
}

export interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  category: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  city: string;
}

export interface EnvironmentalAlert {
  icon?: any;
  title: string;
  desc: string;
  recs: string[];
  severity: 'danger' | 'moderate' | 'success' | 'warning';
  aqi?: number;
}

export const STATIC_ALERTS: EnvironmentalAlert[] = [
  {
    title: "Water Contamination Warning - Yamuna",
    desc: "Elevated levels of industrial discharge detected.",
    recs: ["Boil water before drinking", "Avoid river contact", "Report unusual discharge"],
    severity: "moderate",
  },
  {
    title: "Forest Fire Risk - Uttarakhand",
    desc: "Dry conditions increasing wildfire probability.",
    recs: ["Report smoke sightings", "Avoid forest campfires", "Follow evacuation notices"],
    severity: "danger",
  },
  {
    title: "Extreme Weather Advisory",
    desc: "Heavy rainfall expected in next 48 hours.",
    recs: ["Secure loose objects", "Avoid waterlogged areas", "Keep emergency kit ready"],
    severity: "moderate",
  },
];

export interface PredictionData {
  day: string;
  aqi: number;
  category?: string;
  color?: string;
  date?: string;
}

export interface ForecastResponse {
  lat: number;
  lng: number;
  current_aqi: number;
  forecast: PredictionData[];
  source: string;
  generated_at: string;
}

// Point to your local FastAPI server (update for production)
const SENTINEL_API_URL = import.meta.env.VITE_SENTINEL_API_URL || 'http://localhost:8000';

// Known Indian city coordinates — used when profile has city name but no lat/lng
const CITY_COORDS: Record<string, [number, number]> = {
  'new delhi':  [28.6139, 77.2090],
  'delhi':      [28.6139, 77.2090],
  'mumbai':     [19.0760, 72.8777],
  'bangalore':  [12.9716, 77.5946],
  'bengaluru':  [12.9716, 77.5946],
  'hyderabad':  [17.3850, 78.4867],
  'chennai':    [13.0827, 80.2707],
  'kolkata':    [22.5726, 88.3639],
  'pune':       [18.5204, 73.8567],
  'ahmedabad':  [23.0225, 72.5714],
  'jaipur':     [26.9124, 75.7873],
  'lucknow':    [26.8467, 80.9462],
  'surat':      [21.1702, 72.8311],
  'kanpur':     [26.4499, 80.3319],
  'nagpur':     [21.1458, 79.0882],
  'indore':     [22.7196, 75.8577],
  'bhopal':     [23.2599, 77.4126],
  'patna':      [25.5941, 85.1376],
  'vadodara':   [22.3072, 73.1812],
  'coimbatore': [11.0168, 76.9558],
};

/**
 * Resolve coordinates for a city name.
 * First checks the local lookup table, then falls back to Nominatim geocoding.
 */
export async function resolveCityCoords(city: string): Promise<[number, number] | null> {
  const key = city.toLowerCase().trim();
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch {
    // silently fall through
  }
  return null;
}

const aqiDataCache = new Map<string, { data: AQIData; ts: number }>();
const pendingAqiRequests = new Map<string, Promise<AQIData>>();
const AQI_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchAQIData(city: string, lat?: number | null, lng?: number | null): Promise<AQIData> {
  const cacheKey = city.toLowerCase().trim();
  
  // 1. Coalesce simultaneous requests for the same city
  const inFlight = pendingAqiRequests.get(cacheKey);
  if (inFlight) return inFlight;

  // 2. Check cache
  const cached = aqiDataCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < AQI_CACHE_TTL) {
    return cached.data;
  }

  // 3. Initiate fetch with de-duplication
  const fetchPromise = (async () => {
    try {
      // Resolve coords from city name if not provided
      let resolvedLat = lat;
      let resolvedLng = lng;
      if (!resolvedLat || !resolvedLng) {
        const coords = await resolveCityCoords(city);
        if (coords) [resolvedLat, resolvedLng] = coords;
      }

      if (resolvedLat && resolvedLng) {
        const readings = await fetchOpenAQReadings(resolvedLat, resolvedLng, 25);
        if (readings.length > 0) {
          const getAvg = (vals: (number | null)[]) => {
            const filtered = vals.filter((v): v is number => v !== null);
            return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : 0;
          };

          const aqiAvg = Math.round(getAvg(readings.map(r => r.aqi)));
          
          const result = {
            aqi:      aqiAvg,
            pm25:     Math.round(getAvg(readings.map(r => r.pm25)) * 10) / 10,
            pm10:     Math.round(getAvg(readings.map(r => r.pm10)) * 10) / 10,
            no2:      Math.round(getAvg(readings.map(r => r.no2)) * 10) / 10,
            so2:      Math.round(getAvg(readings.map(r => r.so2)) * 10) / 10,
            co:       Math.round(getAvg(readings.map(r => r.co)) * 100) / 100,
            category: getAQICategory(aqiAvg),
            city,
          };
          // Update cache with a fresh successful result
          aqiDataCache.set(cacheKey, { data: result, ts: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.warn('OpenAQ fetch failed:', err);
    } finally {
      // Always cleanup pending map so future requests can proceed
      pendingAqiRequests.delete(cacheKey);
    }

    // Fallback 1: Return stale cache if available (even if expired) to prevent "N/A" flickering
    if (cached) return cached.data;

    // Fallback 2: Return empty mock data
    return getMockAQIData(city);
  })();

  pendingAqiRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}


/** Convert PM2.5 µg/m³ → US AQI (EPA breakpoints) — used for OpenAQ direct path */
function pm25ToAQI(pm25: number): number {
  const bp = [
    [0,    12,    0,   50],
    [12.1, 35.4,  51,  100],
    [35.5, 55.4,  101, 150],
    [55.5, 150.4, 151, 200],
    [150.5,250.4, 201, 300],
    [250.5,500.4, 301, 500],
  ];
  for (const [cLo, cHi, iLo, iHi] of bp) {
    if (pm25 >= cLo && pm25 <= cHi) {
      return Math.round(((iHi - iLo) / (cHi - cLo)) * (pm25 - cLo) + iLo);
    }
  }
  return Math.min(500, Math.round(pm25 * 2));
}

export function getAQICategory(aqi: number): AQIData['category'] {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  return 'Hazardous';
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#10b981'; // Green (emerald-500)
  if (aqi <= 100) return '#f59e0b'; // Yellow (amber-500)
  if (aqi <= 200) return '#f97316'; // Orange (orange-500)
  return '#ef4444'; // Red (red-500)
}

function getMockAQIData(city: string): AQIData {
  return {
    aqi: 0,
    pm25: 0,
    pm10: 0,
    no2: 0,
    so2: 0,
    co: 0,
    category: 'Good',
    city: city || 'Unknown City'
  };
}

/**
 * Simulates deterministic water quality data based on city name.
 */
export function simulateWaterQuality(city: string): WaterQualityData {
  const cityName = city || 'New Delhi';
  // Deterministic seed from city name
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use hash to derive a pH between 6.5 and 8.5
  // (hash % 20) / 10 gives 0.0 to 1.9, added to 6.6
  const phOffset = Math.abs(hash % 20) / 10;
  const ph = Math.round((6.6 + phOffset) * 10) / 10;
  
  let status: WaterQualityData['status'] = 'Safe';
  let label = 'Stable (Excellent)';

  if (ph < 6.8 || ph > 8.0) {
    status = 'Moderate';
    label = 'Balanced (Good)';
  }
  if (ph < 6.5 || ph > 8.5) {
    status = 'Poor';
    label = 'Attention (Check Filters)';
  }

  return { ph, status, label };
}

/**
 * Fetch a real 14-day AQI forecast from the Sentinel-5P FastAPI backend.
 * Falls back to a seeded deterministic estimate if the API is unreachable.
 */
export async function fetchSentinelForecast(
  lat: number,
  lng: number
): Promise<ForecastResponse> {
  const res = await fetch(
    `${SENTINEL_API_URL}/predict?lat=${lat}&lng=${lng}`
  );
  if (!res.ok) throw new Error(`Sentinel API error: ${res.status}`);
  return res.json();
}

// ── OpenAQ ─────────────────────────────────────────────────────────────────────

export interface OpenAQReading {
  lat: number;
  lng: number;
  locationName: string;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  parameter: string;
}

/**
 * Fetch real air quality readings near a coordinate via the local proxy → OpenAQ v3.
 */
export async function fetchOpenAQReadings(
  lat: number,
  lng: number,
  initialRadiusKm = 25,
): Promise<OpenAQReading[]> {
  const radii = [initialRadiusKm, 50, 100]; // Multi-step expansion
  
  for (const radiusKm of radii) {
    try {
      const sentinelBase = import.meta.env.VITE_SENTINEL_API_URL ?? 'http://localhost:8000';
      const url = `${sentinelBase}/openaq?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}&limit=20`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`OpenAQ ${res.status}`);
      const data = await res.json();

      const results = (data.results ?? [])
        .filter((loc: any) => loc.coordinates?.latitude && loc.coordinates?.longitude)
        .map((loc: any) => {
          const sensors: any[]  = loc.sensors ?? [];
          const readings: any[] = loc.latestReadings ?? [];

          const valueMap: Record<number, number> = {};
          for (const r of readings) {
            if (r.sensorsId != null && r.value != null) valueMap[r.sensorsId] = r.value;
          }

          const pm25Sensor = sensors.find((s: any) => s.parameter?.name === 'pm25');
          const pm10Sensor = sensors.find((s: any) => s.parameter?.name === 'pm10');
          const no2Sensor  = sensors.find((s: any) => s.parameter?.name === 'no2');
          const best       = pm25Sensor ?? pm10Sensor ?? no2Sensor ?? sensors[0];

          if (!best) return null;

          const param   = best.parameter?.name as string ?? 'unknown';
          const rawVal  = valueMap[best.id] ?? null;
          const pm25Val = sensors.find((s: any) => s.parameter?.name === 'pm25') ? (valueMap[sensors.find((s: any) => s.parameter?.name === 'pm25').id] ?? null) : null;
          const pm10Val = sensors.find((s: any) => s.parameter?.name === 'pm10') ? (valueMap[sensors.find((s: any) => s.parameter?.name === 'pm10').id] ?? null) : null;
          const no2Val  = sensors.find((s: any) => s.parameter?.name === 'no2')  ? (valueMap[sensors.find((s: any) => s.parameter?.name === 'no2').id] ?? null) : null;
          const so2Val  = sensors.find((s: any) => s.parameter?.name === 'so2')  ? (valueMap[sensors.find((s: any) => s.parameter?.name === 'so2').id] ?? null) : null;
          const coVal   = sensors.find((s: any) => s.parameter?.name === 'co')   ? (valueMap[sensors.find((s: any) => s.parameter?.name === 'co').id] ?? null) : null;

          const aqi = pm25ToAQI(param === 'pm25' ? rawVal : rawVal * 0.6);

          return {
            lat:          loc.coordinates.latitude,
            lng:          loc.coordinates.longitude,
            locationName: loc.name ?? loc.locality ?? 'Unknown',
            aqi:          Math.round(aqi),
            pm25:         pm25Val,
            pm10:         pm10Val,
            no2:          no2Val,
            so2:          so2Val,
            co:           coVal,
            parameter:    param,
          } as OpenAQReading;
        })
        .filter((r: any): r is OpenAQReading => r !== null && r.aqi > 0);

      if (results.length > 0) return results;
      console.log(`No results at ${radiusKm}km, expanding...`);
    } catch (err) {
      console.warn(`OpenAQ fetch failed at ${radiusKm}km:`, err);
    }
  }

  return [];
}

// ── Overpass API ───────────────────────────────────────────────────────────────

export interface OverpassPlace {
  lat: number;
  lng: number;
  name: string;
  type: 'industrial' | 'traffic' | 'park' | 'residential' | 'commercial' | 'power';
  aqiMultiplier: number;
}

// In-memory cache with timestamp — avoids repeat Overpass hits within a session
const overpassCache = new Map<string, { places: OverpassPlace[]; ts: number }>();
const OVERPASS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Mirror endpoints — tried in order if the primary is rate-limited
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * Query Overpass API for real OSM features near a coordinate.
 * Tries multiple mirror endpoints and caches results for 10 minutes.
 */
export async function fetchOverpassPlaces(
  lat: number,
  lng: number,
  radiusM = 8000,
): Promise<OverpassPlace[]> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < OVERPASS_CACHE_TTL) return cached.places;

  // Single-pass query — one filter, small radius, hard limit to avoid timeout
  const r = Math.min(radiusM, 4000); // cap at 4km — larger radii cause timeouts
  const query = `[out:json][timeout:8];node["landuse"~"^(industrial|commercial|retail|residential)$"]["name"](around:${r},${lat},${lng});out 10;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        body:    `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal:  AbortSignal.timeout(12000),
      });

      if (res.status === 429) {
        console.warn(`Overpass rate limited on ${endpoint} — trying next mirror`);
        continue; // try next mirror
      }
      if (!res.ok) throw new Error(`Overpass ${res.status}`);

      const data = await res.json();
      const seen  = new Set<string>();
      const places: OverpassPlace[] = [];

      for (const el of data.elements ?? []) {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        const name  = el.tags?.name ?? el.tags?.['name:en'];
        if (!elLat || !elLng || !name) continue;

        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const tags = el.tags ?? {};
        let type: OverpassPlace['type'] = 'residential';
        let multiplier = 0.85;

        if (tags.power === 'plant')             { type = 'power';      multiplier = 1.55; }
        else if (tags.landuse === 'industrial') { type = 'industrial'; multiplier = 1.40; }
        else if (tags.landuse === 'commercial' ||
                 tags.landuse === 'retail')     { type = 'commercial'; multiplier = 1.10; }
        else if (tags.landuse === 'residential'){ type = 'residential'; multiplier = 0.85; }
        else if (tags.leisure === 'park')       { type = 'park';       multiplier = 0.50; }

        places.push({ lat: elLat, lng: elLng, name, type, aqiMultiplier: multiplier });
        if (places.length >= 10) break;
      }

      overpassCache.set(cacheKey, { places, ts: Date.now() });
      return places;
    } catch (err) {
      console.warn(`Overpass fetch failed on ${endpoint}:`, err);
      // continue to next mirror
    }
  }

  // All mirrors failed — return empty (fallback grid will kick in)
  console.warn('All Overpass mirrors failed — using fallback grid');
  return [];
}

/**
 * generateForecast — calls the real Sentinel-5P model API using the citizen's
 * coordinates. If coords are missing, resolves them from the city name first.
 * Falls back to a deterministic estimate when the API is unavailable.
 */
export async function generateForecast(
  baseAQI: number,
  lat?: number | null,
  lng?: number | null,
  city?: string | null,
): Promise<PredictionData[]> {
  let resolvedLat = lat;
  let resolvedLng = lng;

  // If no coords but we have a city name, try to resolve coords
  if ((!resolvedLat || !resolvedLng) && city) {
    const coords = await resolveCityCoords(city);
    if (coords) {
      [resolvedLat, resolvedLng] = coords;
    }
  }

  if (resolvedLat && resolvedLng) {
    try {
      const result = await fetchSentinelForecast(resolvedLat, resolvedLng);
      // API returns 14 days; slice to 7 for the chart
      return result.forecast.slice(0, 7);
    } catch (err) {
      console.warn('Sentinel API unavailable, using fallback forecast:', err);
    }
  }

  // Deterministic fallback (no random noise)
  return generateFallbackForecast(baseAQI);
}

function generateFallbackForecast(baseAQI: number): PredictionData[] {
  const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  // Simple sine-wave variation so it looks realistic without being random
  return days.map((day, i) => ({
    day,
    aqi: Math.max(0, Math.round(baseAQI + Math.sin(i * 0.9) * 15)),
  }));
}

// ── Oil Spill Detection ────────────────────────────────────────────────────────

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

/**
 * Call the FastAPI /detect-oil-spill endpoint with a bounding box derived
 * from a center point + radius in degrees.
 */
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
/**
 * Send an SMS alert via Twilio using the backend proxy.
 */
export async function sendTwilioAlert(phone: string, city: string, lat?: number | null, lng?: number | null): Promise<{ status: string; message_sid?: string }> {
  const query = new URLSearchParams({ phone, city });
  if (lat) query.append('lat', lat.toString());
  if (lng) query.append('lng', lng.toString());

  const res = await fetch(`${SENTINEL_API_URL}/send-aqi-alert?${query.toString()}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Twilio API error ${res.status}`);
  }
  return res.json();
}
