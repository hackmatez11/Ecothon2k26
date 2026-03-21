const SENTINEL_API_URL = import.meta.env.VITE_SENTINEL_API_URL || 'http://localhost:8000';

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

export interface PredictionDay {
  day: string;
  date: string;
  aqi: number;
  category: string;
  color: string;
}

export interface PredictionResponse {
  lat: number;
  lng: number;
  current_aqi: number;
  history: PredictionDay[];
  forecast: PredictionDay[];
  source: string;
  generated_at: string;
}

export type ForecastResponse = PredictionResponse;

export interface OverpassPlace {
  lat: number;
  lng: number;
  name: string;
  type: 'industrial' | 'traffic' | 'park' | 'residential' | 'commercial' | 'power';
  aqiMultiplier: number;
}



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

// Known Indian city coordinates
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

export interface SourceData {
  name: string;
  value: number;
  color: string;
}

export interface SourceAttributionResponse {
  lat: number;
  lng: number;
  sources: SourceData[];
  metrics: {
    traffic_congestion_multiplier: number;
    osm_industrial_nodes: number;
    osm_construction_nodes: number;
  };
  generated_at: string;
}

export async function fetchSourceAttribution(city: string): Promise<SourceAttributionResponse | null> {
  try {
    const coords = await resolveCityCoords(city);
    if (!coords) return null;
    
    const [lat, lng] = coords;
    const url = `${SENTINEL_API_URL}/source-attribution?lat=${lat}&lng=${lng}`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Source attribution fetch failed:', err);
  }
  return null;
}

export interface ControlPlanItem {
  source: string;
  action: string;
  status: 'Proposed' | 'Active';
}

export async function fetchControlPlan(city: string, sources: SourceData[]): Promise<ControlPlanItem[] | null> {
  try {
    const url = `${SENTINEL_API_URL}/generate-control-plan`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, sources })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Control plan generation failed:', err);
  }
  return null;
}

/**
 * Resolve coordinates for a city name.
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
  
  const inFlight = pendingAqiRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const cached = aqiDataCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < AQI_CACHE_TTL) {
    return cached.data;
  }

  const fetchPromise = (async () => {
    try {
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
          
          const result: AQIData = {
            aqi:      aqiAvg,
            pm25:     Math.round(getAvg(readings.map(r => r.pm25)) * 10) / 10,
            pm10:     Math.round(getAvg(readings.map(r => r.pm10)) * 10) / 10,
            no2:      Math.round(getAvg(readings.map(r => r.no2)) * 10) / 10,
            so2:      Math.round(getAvg(readings.map(r => r.so2)) * 10) / 10,
            co:       Math.round(getAvg(readings.map(r => r.co)) * 100) / 100,
            category: getAQICategory(aqiAvg),
            city,
          };
          aqiDataCache.set(cacheKey, { data: result, ts: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.warn('OpenAQ fetch failed:', err);
    } finally {
      pendingAqiRequests.delete(cacheKey);
    }

    if (cached) return cached.data;
    return getMockAQIData(city);
  })();

  pendingAqiRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

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

export async function fetchOpenAQReadings(
  lat: number,
  lng: number,
  initialRadiusKm = 25,
): Promise<OpenAQReading[]> {
  const radii = [initialRadiusKm, 50, 100];
  
  for (const radiusKm of radii) {
    try {
      const url = `${SENTINEL_API_URL}/openaq?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}&limit=20`;

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
    } catch (err) {
      console.warn(`OpenAQ fetch failed at ${radiusKm}km:`, err);
    }
  }
  return [];
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

export async function fetchPredictionData(city: string, lat?: number | null, lng?: number | null): Promise<PredictionResponse | null> {
  try {
    let resolvedLat = lat;
    let resolvedLng = lng;
    if (!resolvedLat || !resolvedLng) {
      const coords = await resolveCityCoords(city);
      if (coords) [resolvedLat, resolvedLng] = coords;
    }

    if (resolvedLat && resolvedLng) {
      const url = `${SENTINEL_API_URL}/predict?lat=${resolvedLat}&lng=${resolvedLng}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('Prediction fetch failed:', err);
  }
  return null;
}

export const fetchSentinelForecast = async (lat: number, lng: number): Promise<ForecastResponse> => {
  const res = await fetch(`${SENTINEL_API_URL}/predict?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error(`Sentinel API error: ${res.status}`);
  return res.json();
};

const overpassCache = new Map<string, { places: OverpassPlace[]; ts: number }>();
const OVERPASS_CACHE_TTL = 10 * 60 * 1000;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function fetchIndustrialSiteCount(lat: number, lng: number, radiusM = 8000): Promise<number> {
  const r = Math.min(radiusM, 8000);
  // Query ways + relations with landuse=industrial (no name required)
  const query = `[out:json][timeout:10];(way["landuse"="industrial"](around:${r},${lat},${lng});relation["landuse"="industrial"](around:${r},${lat},${lng});node["industrial"](around:${r},${lat},${lng});node["man_made"~"^(works|factory|chimney|gasometer|storage_tank)$"](around:${r},${lat},${lng}););out count;`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      // Overpass "out count" returns a single element with tags.total
      const total = data.elements?.[0]?.tags?.total;
      if (total != null) return parseInt(total, 10);
    } catch { continue; }
  }
  return 0;
}

export async function fetchOverpassPlaces(lat: number, lng: number, radiusM = 8000): Promise<OverpassPlace[]> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < OVERPASS_CACHE_TTL) return cached.places;

  const r = Math.min(radiusM, 4000);
  const query = `[out:json][timeout:8];node["landuse"~"^(industrial|commercial|retail|residential)$"]["name"](around:${r},${lat},${lng});out 10;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        body:    `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const places: OverpassPlace[] = [];
      const seen = new Set<string>();

      for (const el of data.elements ?? []) {
        const name = el.tags?.name || el.tags?.['name:en'];
        if (!el.lat || !el.lon || !name) continue;
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        let type: OverpassPlace['type'] = 'residential';
        let multiplier = 0.85;
        const tags = el.tags || {};

        if (tags.power === 'plant') { type = 'power'; multiplier = 1.55; }
        else if (tags.landuse === 'industrial') { type = 'industrial'; multiplier = 1.40; }
        else if (tags.landuse === 'commercial') { type = 'commercial'; multiplier = 1.10; }
        else if (tags.leisure === 'park') { type = 'park'; multiplier = 0.50; }

        places.push({ lat: el.lat, lng: el.lon, name, type, aqiMultiplier: multiplier });
      }
      overpassCache.set(cacheKey, { places, ts: Date.now() });
      return places;
    } catch { continue; }
  }
  return [];
}


