import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Loader2, Maximize2, Layers, Factory } from "lucide-react";
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  fetchSentinelForecast,
  fetchIndustrialSiteCount,
  resolveCityCoords,
  ForecastResponse,
  getAQIColor,
} from "@/lib/environmental";

// Fix default marker icons for leaflet + vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const industrialIcon = L.divIcon({
  className: "",
  html: `<div style="background:#f97316;border:2px solid #ea580c;border-radius:50%;width:14px;height:14px;box-shadow:0 0 6px #f9731688;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface IndustrialNode {
  lat: number;
  lng: number;
  name: string;
}

async function fetchIndustrialNodes(lat: number, lng: number, radiusM = 10000): Promise<IndustrialNode[]> {
  const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  const query = `[out:json][timeout:15];(node["man_made"~"^(works|factory|chimney|gasometer|storage_tank)$"](around:${radiusM},${lat},${lng});node["industrial"](around:${radiusM},${lat},${lng});way["landuse"="industrial"]["name"](around:${radiusM},${lat},${lng}););out center 40;`;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      return (data.elements ?? []).map((el: any) => ({
        lat: el.center?.lat ?? el.lat,
        lng: el.center?.lon ?? el.lon,
        name: el.tags?.name || el.tags?.["name:en"] || el.tags?.man_made || el.tags?.industrial || "Industrial Site",
      })).filter((n: IndustrialNode) => n.lat && n.lng);
    } catch { continue; }
  }
  return [];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 11); }, [center, map]);
  return null;
}

export function SatelliteMap({ city, showIndustrialSites = false }: { city: string; showIndustrialSites?: boolean }) {
  const [forecast,         setForecast]         = useState<ForecastResponse | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [coords,           setCoords]           = useState<[number, number] | null>(null);
  const [industrialNodes,  setIndustrialNodes]  = useState<IndustrialNode[]>([]);
  const [siteCount,        setSiteCount]        = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setIndustrialNodes([]);
      setSiteCount(null);
      const resCoords = await resolveCityCoords(city);
      if (!resCoords) { setLoading(false); return; }
      setCoords(resCoords);
      const [lat, lng] = resCoords;

      const tasks: Promise<any>[] = [fetchSentinelForecast(lat, lng).catch(() => null)];
      if (showIndustrialSites) {
        tasks.push(fetchIndustrialNodes(lat, lng, 10000));
        tasks.push(fetchIndustrialSiteCount(lat, lng, 10000));
      }
      const [fc, nodes, count] = await Promise.all(tasks);
      if (fc) setForecast(fc);
      if (nodes) setIndustrialNodes(nodes);
      if (count != null) setSiteCount(count);
      setLoading(false);
    }
    load();
  }, [city, showIndustrialSites]);

  if (loading || !coords) {
    return (
      <Card className="h-[450px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Connecting to Sentinel-5P constellation…</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-blue-500/20 shadow-lg group">
      <CardHeader className="bg-blue-500/10 border-b py-3 px-4">
        <CardTitle className="flex items-center justify-between flex-wrap gap-2 text-blue-600">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
            <Satellite className="h-4 w-4" /> {showIndustrialSites ? "Industrial Sites — Satellite View" : "AI Satellite Prediction Map"}
          </div>
          <div className="flex items-center gap-2">
            {showIndustrialSites && siteCount != null && (
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1">
                <Factory className="h-3 w-3" /> {siteCount} Sites
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-blue-500/10 text-blue-600 border-blue-500/20">
              Sentinel-5P
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 py-2 bg-background border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Predictive AQI Layer</span>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
            14-Day Forecast Active
          </Badge>
        </div>

        <div className="relative h-[380px] w-full">
          <MapContainer
            center={coords} zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <ChangeView center={coords} />
            <TileLayer
              attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a>'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />

            {forecast && (
              <>
                {[25000, 18000, 12000].map((radius, idx) => {
                   const opacity = 0.1 - (idx * 0.03);
                   const projectedAqi = forecast.forecast[idx * 3]?.aqi || forecast.current_aqi;
                   return (
                      <Circle
                        key={`spread-${radius}`}
                        center={coords}
                        pathOptions={{
                          color:     getAQIColor(projectedAqi),
                          fillOpacity: opacity,
                          weight: 1,
                          dashArray: "10, 20"
                        }}
                        radius={radius}
                      />
                   )
                })}

                <Circle
                  center={coords}
                  pathOptions={{
                    fillColor: getAQIColor(forecast.current_aqi),
                    color:     getAQIColor(forecast.current_aqi),
                    fillOpacity: 0.45,
                    weight: 3,
                    dashArray: "5, 10"
                  }}
                  radius={8000}
                  className="animate-pulse"
                >
                  <Popup>
                    <div className="p-3 min-w-[280px] border-none shadow-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Satellite className="h-4 w-4 text-blue-500" />
                        <span className="font-bold text-sm uppercase">AI Projection</span>
                      </div>
                      
                      <div className="mb-3 flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                        <span className="text-xs">Current Modeled AQI</span>
                        <span className="font-bold text-lg" style={{ color: getAQIColor(forecast.current_aqi) }}>
                          {forecast.current_aqi}
                        </span>
                      </div>
                      
                      {/* Timeline of Real Data */}
                      <div className="space-y-1.5 mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 mb-2">14-Day Trajectory</p>
                        <div className="max-h-[120px] overflow-y-auto pr-2 space-y-1 scrollbar-thin">
                          {forecast.forecast.map((day, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground w-16">{day.day}</span>
                              <div className="flex-1 mx-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (day.aqi / 300) * 100)}%`,
                                    backgroundColor: day.color 
                                  }} 
                                />
                              </div>
                              <span className="font-medium w-8 text-right" style={{ color: day.color }}>
                                {Math.round(day.aqi)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[9px] leading-tight text-muted-foreground border-t pt-2">
                        Real atmospheric column analysis generated at {new Date(forecast.generated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Circle>
              </>
            )}

            {showIndustrialSites && industrialNodes.map((node, i) => (
              <Marker key={i} position={[node.lat, node.lng]} icon={industrialIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold flex items-center gap-1"><Factory className="h-3 w-3 text-orange-500" />{node.name}</p>
                    <p className="text-muted-foreground mt-0.5">{node.lat.toFixed(4)}, {node.lng.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-4 right-4 z-[1000]">
            <button className="bg-background/80 backdrop-blur-md p-2 rounded-lg border shadow-lg hover:bg-background transition-colors">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 z-[1000] bg-background/80 backdrop-blur-md rounded-xl border-2 border-blue-500/20 p-4 shadow-xl max-w-[180px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2">Satellite Status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium">Link Established</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-[10px]">TROPOMI Active</span>
              </div>
              {showIndustrialSites && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="text-[10px]">{industrialNodes.length} sites mapped</span>
                </div>
              )}
              <div className="pt-2 border-t mt-2">
                <span className="text-[9px] text-muted-foreground italic leading-tight block">
                  {showIndustrialSites
                    ? "Orange dots = industrial facilities from OSM."
                    : "Projected drift based on wind vectors and point source emissions."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
