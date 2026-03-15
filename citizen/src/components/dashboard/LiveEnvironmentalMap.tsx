import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Layers, Satellite, Wind } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { useProfile } from "@/hooks/useProfile";
import {
  fetchAQIData, getAQIColor, AQIData,
  fetchSentinelForecast, resolveCityCoords, ForecastResponse,
  fetchOpenAQReadings, fetchOverpassPlaces,
  OverpassPlace,
} from "@/lib/environmental";

// ── Types ──────────────────────────────────────────────────────────────────────
interface HotspotPoint {
  lat: number;
  lng: number;
  aqi: number;
  label: string;
  type: string;
  category: string;
  color: string;
  source: 'openaq' | 'overpass';
  pm25?: number | null;
  parameter?: string;
}

// ── Leaflet heatmap augmentation ───────────────────────────────────────────────
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      minOpacity?: number; maxZoom?: number; max?: number;
      radius?: number; blur?: number; gradient?: Record<string, string>;
    }
  ): L.Layer & { setLatLngs: (pts: Array<[number, number, number]>) => void };
}

// ── AQI helpers ────────────────────────────────────────────────────────────────
const AQI_GRADIENT = {
  0.0: "#00e400", 0.2: "#ffff00", 0.4: "#ff7e00",
  0.6: "#ff0000", 0.8: "#8f3f97", 1.0: "#7e0023",
};

function aqiMeta(aqi: number): { label: string; color: string; category: string } {
  if (aqi <= 50)  return { label: "Good",                           color: "#00e400", category: "Good" };
  if (aqi <= 100) return { label: "Moderate",                       color: "#ffff00", category: "Moderate" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#ff7e00", category: "Unhealthy for Sensitive Groups" };
  if (aqi <= 200) return { label: "Unhealthy",                      color: "#ff0000", category: "Unhealthy" };
  if (aqi <= 300) return { label: "Very Unhealthy",                 color: "#8f3f97", category: "Very Unhealthy" };
  return           { label: "Hazardous",                            color: "#7e0023", category: "Hazardous" };
}

// ── Type icon map ──────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  industrial:  "Industrial",
  traffic:     "Traffic",
  park:        "Park / Green",
  residential: "Residential",
  commercial:  "Commercial",
  power:       "Power Plant",
  openaq:      "Air Monitor",
};

// ── Custom marker icon ─────────────────────────────────────────────────────────
function makeIcon(color: string, source: 'openaq' | 'overpass') {
  const shape = source === 'openaq'
    ? `border-radius:3px;width:13px;height:13px;`
    : `border-radius:50%;width:13px;height:13px;`;
  return L.divIcon({
    className: "",
    html: `<div style="${shape}background:${color};border:2px solid white;box-shadow:0 0 6px ${color}88;"></div>`,
    iconSize:   [13, 13],
    iconAnchor: [6, 6],
  });
}

// ── Heatmap layer ──────────────────────────────────────────────────────────────
function HeatLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap();
  const ref = useRef<ReturnType<typeof L.heatLayer> | null>(null);

  useEffect(() => {
    ref.current = L.heatLayer(points, {
      radius: 45, blur: 35, maxZoom: 13, max: 300, minOpacity: 0.35,
      gradient: AQI_GRADIENT,
    });
    ref.current.addTo(map);
    return () => { if (ref.current) map.removeLayer(ref.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (ref.current && points.length) {
      ref.current.setLatLngs(points);
      (ref.current as any)._update?.();
    }
  }, [points]);

  return null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 12); }, [center, map]);
  return null;
}

const LAYERS = ["Heatmap", "Hotspots"];

// ── Main component ─────────────────────────────────────────────────────────────
export function LiveEnvironmentalMap() {
  const { profile, loading: profileLoading } = useProfile();
  const [activeLayer, setActiveLayer] = useState("Heatmap");
  const [aqiData,     setAqiData]     = useState<AQIData | null>(null);
  const [forecast,    setForecast]    = useState<ForecastResponse | null>(null);
  const [hotspots,    setHotspots]    = useState<HotspotPoint[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isSatellite, setIsSatellite] = useState(false);
  const [dataSource,  setDataSource]  = useState<string>("loading…");

  const center: [number, number] =
    profile?.latitude && profile?.longitude
      ? [profile.latitude, profile.longitude]
      : [28.6139, 77.209];

  useEffect(() => {
    async function load() {
      const city = profile?.city || "New Delhi";
      let lat = profile?.latitude  ?? null;
      let lng = profile?.longitude ?? null;

      if (!lat || !lng) {
        const coords = await resolveCityCoords(city);
        if (coords) [lat, lng] = coords;
      }

      const aqi = await fetchAQIData(city, lat, lng);
      setAqiData(aqi);

      if (!lat || !lng) { setLoading(false); return; }

      let baseAqi = aqi.aqi;
      try {
        const fc = await fetchSentinelForecast(lat, lng);
        setForecast(fc);
        setIsSatellite(true);
        baseAqi = fc.current_aqi;
      } catch { /* use WAQI aqi as base */ }

      const [openaqReadings, overpassPlaces] = await Promise.all([
        fetchOpenAQReadings(lat, lng, 25),
        fetchOverpassPlaces(lat, lng, 8000),
      ]);

      const points: HotspotPoint[] = [];

      for (const r of openaqReadings) {
        const meta = aqiMeta(r.aqi);
        points.push({
          lat:       r.lat,
          lng:       r.lng,
          aqi:       r.aqi,
          label:     r.locationName,
          type:      'openaq',
          source:    'openaq',
          pm25:      r.pm25,
          parameter: r.parameter,
          category:  meta.category,
          color:     meta.color,
        });
      }

      for (const p of overpassPlaces) {
        const aqiVal = Math.max(0, Math.round(baseAqi * p.aqiMultiplier));
        const meta = aqiMeta(aqiVal);
        points.push({
          lat:      p.lat,
          lng:      p.lng,
          aqi:      aqiVal,
          label:    p.name,
          type:     p.type,
          source:   'overpass',
          category: meta.category,
          color:    meta.color,
        });
      }

      if (points.length === 0) {
        const offsets: Array<[number, number, number, string, OverpassPlace['type']]> = [
          [ 0.00,  0.00, baseAqi,        "City Center",    "residential"],
          [ 0.03,  0.04, baseAqi * 1.40, "Industrial Zone","industrial"],
          [-0.02,  0.05, baseAqi * 1.25, "Traffic Hub",    "traffic"],
          [ 0.05, -0.03, baseAqi * 0.50, "City Park",      "park"],
          [-0.04, -0.04, baseAqi * 0.80, "Residential",    "residential"],
          [ 0.04,  0.06, baseAqi * 1.55, "Power Plant",    "power"],
        ];
        for (const [dlat, dlng, aq, label, type] of offsets) {
          const clamped = Math.max(0, Math.round(aq));
          const meta    = aqiMeta(clamped);
          points.push({ lat: lat! + dlat, lng: lng! + dlng, aqi: clamped, label, type, source: 'overpass', category: meta.category, color: meta.color });
        }
        setDataSource("estimated");
      } else {
        const src = [
          openaqReadings.length > 0 ? `${openaqReadings.length} OpenAQ stations` : '',
          overpassPlaces.length > 0 ? `${overpassPlaces.length} OSM places`      : '',
        ].filter(Boolean).join(' + ');
        setDataSource(src);
      }

      setHotspots(points);
      setLoading(false);
    }

    if (!profileLoading) load();
  }, [profile, profileLoading]);

  const heatPoints: Array<[number, number, number]> = hotspots.map(h => [h.lat, h.lng, h.aqi]);
  const todayForecast = forecast?.forecast[0];

  if (profileLoading || loading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching satellite + ground data…</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 border-b py-3 px-4">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <MapPin className="h-4 w-4" /> Live Environmental Map
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isSatellite && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                <Satellite className="h-3 w-3" /> Sentinel-5P
              </span>
            )}
            {dataSource !== "loading…" && dataSource !== "estimated" && (
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {dataSource}
              </span>
            )}
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
              {profile?.city || "New Delhi"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Layer switcher */}
        <div className="px-4 py-2 bg-background border-b flex gap-2 overflow-x-auto">
          {LAYERS.map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                activeLayer === layer
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {activeLayer === layer && <Layers className="h-3 w-3" />}
              {layer}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative h-[420px] w-full">
          <MapContainer
            center={center} zoom={12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <ChangeView center={center} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {activeLayer === "Heatmap" && heatPoints.length > 0 && (
              <HeatLayer points={heatPoints} />
            )}

            {activeLayer === "Air Quality" && aqiData && (
              <Circle
                center={center}
                pathOptions={{
                  fillColor: getAQIColor(aqiData.aqi),
                  color:     getAQIColor(aqiData.aqi),
                  fillOpacity: 0.35, weight: 2,
                }}
                radius={2500}
              >
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <p className="font-bold">{aqiData.city}</p>
                    <p className="text-xs mt-1">AQI: <strong>{aqiData.aqi}</strong></p>
                    <div className="mt-1 text-[10px] rounded px-2 py-0.5 text-white text-center font-bold"
                      style={{ background: getAQIColor(aqiData.aqi) }}>
                      {aqiData.category}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                      <span>PM2.5: {aqiData.pm25}</span>
                      <span>PM10: {aqiData.pm10}</span>
                      <span>NO₂: {aqiData.no2}</span>
                      <span>CO: {aqiData.co}</span>
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}

            {(activeLayer === "Hotspots" || activeLayer === "Heatmap") &&
              hotspots.map((h, i) => (
                <Marker
                  key={`${h.source}-${i}`}
                  position={[h.lat, h.lng]}
                  icon={makeIcon(h.color, h.source)}
                >
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 12 }}>{h.label}</strong>
                        <span style={{ fontSize: 9, marginLeft: 6, opacity: 0.6 }}>
                          {h.source === 'openaq' ? '📡 OpenAQ' : '🗺 OSM'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11 }}>{TYPE_LABELS[h.type] ?? h.type}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>
                        AQI: <strong>{h.aqi}</strong>
                        {h.pm25 != null && <span style={{ opacity: 0.7, marginLeft: 6 }}>PM2.5: {h.pm25.toFixed(1)}</span>}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 10, background: h.color, color: '#fff', borderRadius: 4, padding: '2px 6px', textAlign: 'center', fontWeight: 700 }}>
                        {h.category}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            }
          </MapContainer>

          {/* AQI Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded-xl border p-3 shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AQI Scale</p>
            <div className="space-y-1">
              {[
                { label: "Good",           color: "#00e400", range: "0–50"    },
                { label: "Moderate",       color: "#ffff00", range: "51–100"  },
                { label: "Unhealthy*",     color: "#ff7e00", range: "101–150" },
                { label: "Unhealthy",      color: "#ff0000", range: "151–200" },
                { label: "Very Unhealthy", color: "#8f3f97", range: "201–300" },
                { label: "Hazardous",      color: "#7e0023", range: "300+"    },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">{l.range}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0 bg-sky-400" />
                <span className="text-[10px] text-muted-foreground">📡 OpenAQ station</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-slate-400" />
                <span className="text-[10px] text-muted-foreground">🗺 OSM place</span>
              </div>
            </div>
          </div>

          {/* Today's forecast pill */}
          {todayForecast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm rounded-full border px-3 py-1 shadow flex items-center gap-2">
              <Wind className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold">Today:</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: todayForecast.color }}>
                AQI {todayForecast.aqi} — {todayForecast.category}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
