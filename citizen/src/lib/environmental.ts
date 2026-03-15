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

// WAQI API key should ideally be in .env
const WAQI_TOKEN = import.meta.env.VITE_WAQI_TOKEN || 'demo';

export async function fetchAQIData(city: string, lat?: number | null, lng?: number | null): Promise<AQIData> {
  try {
    let query = (lat && lng) ? `geo:${lat};${lng}` : city;
    
    // First attempt: Direct feed
    let response = await fetch(`https://api.waqi.info/feed/${encodeURIComponent(query)}/?token=${WAQI_TOKEN}`);
    let data = await response.json();

    // Fix: If demo token returns Shanghai for an Indian city, or if direct fetch fails
    const isShanghaiMismatch = data.status === 'ok' && 
                               data.data.city.name.toLowerCase().includes('shanghai') && 
                               city.toLowerCase().includes('delhi');

    if (data.status !== 'ok' || isShanghaiMismatch) {
      // Second attempt: Search for the station first
      const searchKeyword = city.toLowerCase().includes('india') ? city : `${city}, India`;
      const searchRes = await fetch(`https://api.waqi.info/search/?keyword=${encodeURIComponent(searchKeyword)}&token=${WAQI_TOKEN}`);
      const searchData = await searchRes.json();
      
      if (searchData.status === 'ok' && searchData.data.length > 0) {
        // Find the first station that mentions the city and isn't Shanghai
        const bestStation = searchData.data.find((s: any) => 
          !s.station.name.toLowerCase().includes('shanghai')
        ) || searchData.data[0];
        
        // Fetch specific station feed
        const stationResponse = await fetch(`https://api.waqi.info/feed/@${bestStation.uid}/?token=${WAQI_TOKEN}`);
        data = await stationResponse.json();
      }
    }

    if (data.status === 'ok') {
      const iaqi = data.data.iaqi;
      return {
        aqi: data.data.aqi,
        pm25: iaqi.pm25?.v || 0,
        pm10: iaqi.pm10?.v || 0,
        no2: iaqi.no2?.v || 0,
        so2: iaqi.so2?.v || 0,
        co: iaqi.co?.v || 0,
        category: getAQICategory(data.data.aqi),
        city: data.data.city.name
      };
    }
    throw new Error('Could not fetch AQI data');
  } catch (error) {
    console.error('AQI Fetch Error:', error);
    return getMockAQIData(city);
  }
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
    aqi: 145,
    pm25: 55,
    pm10: 82,
    no2: 12,
    so2: 5,
    co: 0.8,
    category: 'Unhealthy',
    city: city || 'Unknown City'
  };
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
  aqi: number;        // derived from PM2.5 if available, else best available
  pm25: number | null;
  parameter: string;
}

/**
 * Fetch real air quality readings near a coordinate via the local proxy → OpenAQ v3.
 */
export async function fetchOpenAQReadings(
  lat: number,
  lng: number,
  radiusKm = 25,
): Promise<OpenAQReading[]> {
  try {
    const sentinelBase = import.meta.env.VITE_SENTINEL_API_URL ?? 'http://localhost:8000';
    const url = `${sentinelBase}/openaq?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}&limit=20`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OpenAQ ${res.status}`);
    const data = await res.json();

    // v3 enriched: each result has sensors[] for metadata and latestReadings[] for values
    return (data.results ?? [])
      .filter((loc: any) => loc.coordinates?.latitude && loc.coordinates?.longitude)
      .map((loc: any) => {
        const sensors: any[]  = loc.sensors ?? [];
        const readings: any[] = loc.latestReadings ?? [];

        // Build a sensorId → value map from latest readings
        const valueMap: Record<number, number> = {};
        for (const r of readings) {
          if (r.sensorsId != null && r.value != null) valueMap[r.sensorsId] = r.value;
        }

        // Find best sensor by preference: pm25 > pm10 > no2
        const pm25Sensor = sensors.find((s: any) => s.parameter?.name === 'pm25');
        const pm10Sensor = sensors.find((s: any) => s.parameter?.name === 'pm10');
        const no2Sensor  = sensors.find((s: any) => s.parameter?.name === 'no2');
        const best       = pm25Sensor ?? pm10Sensor ?? no2Sensor ?? sensors[0];

        if (!best) return null;

        const param   = best.parameter?.name as string ?? 'unknown';
        const rawVal  = valueMap[best.id] ?? null;
        const pm25Val = pm25Sensor ? (valueMap[pm25Sensor.id] ?? null) : null;

        if (rawVal === null) return null;

        const aqi = pm25ToAQI(param === 'pm25' ? rawVal : rawVal * 0.6);

        return {
          lat:          loc.coordinates.latitude,
          lng:          loc.coordinates.longitude,
          locationName: loc.name ?? loc.locality ?? 'Unknown',
          aqi:          Math.round(aqi),
          pm25:         pm25Val,
          parameter:    param,
        } as OpenAQReading;
      })
      .filter((r: any): r is OpenAQReading => r !== null && r.aqi > 0);
  } catch (err) {
    console.warn('OpenAQ fetch failed:', err);
    return [];
  }
}

/** Convert PM2.5 µg/m³ to US AQI (EPA breakpoints) */
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
  bbox:         [number, number, number, number];
  spill_count:  number;
  spills:       OilSpill[];
  source:       string;
  generated_at: string;
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
