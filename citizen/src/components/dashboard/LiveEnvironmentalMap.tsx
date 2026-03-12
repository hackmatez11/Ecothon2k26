import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Loader2, Layers } from "lucide-react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useProfile } from "@/hooks/useProfile";
import { fetchAQIData, getAQIColor, AQIData } from "@/lib/environmental";

const layers = ["Air Pollution", "Water Pollution", "Industrial", "Waste Dumping"];

// Helper to center map
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 12);
  return null;
}

export function LiveEnvironmentalMap() {
  const [activeLayer, setActiveLayer] = useState("Air Pollution");
  const { profile, loading: profileLoading } = useProfile();
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const center: [number, number] = profile?.latitude && profile?.longitude 
    ? [profile.latitude, profile.longitude] 
    : [28.6139, 77.2090]; // Default New Delhi

  useEffect(() => {
    async function loadData() {
      const city = profile?.city || "New Delhi";
      const data = await fetchAQIData(city);
      setAqiData(data);
      setLoading(false);
    }
    loadData();
  }, [profile]);

  if (profileLoading || loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Initializing Live Map...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-premium">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <MapPin className="h-5 w-5" /> Live Environmental Map
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
            {profile?.city || "New Delhi"} Center
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 bg-background border-b flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search specific location..." 
              className="pl-10 h-10 bg-muted/30 border-none focus-visible:ring-primary/20" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {layers.map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  activeLayer === layer
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {activeLayer === layer && <Layers className="h-3 w-3" />}
                {layer}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[400px] md:h-[500px] w-full z-0">
          <MapContainer 
            center={center} 
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <ChangeView center={center} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Real AQI marker for the city */}
            {aqiData && (
              <Circle
                center={center}
                pathOptions={{ 
                  fillColor: getAQIColor(aqiData.aqi), 
                  color: getAQIColor(aqiData.aqi),
                  fillOpacity: 0.4,
                  weight: 2
                }}
                radius={2000}
              >
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <h3 className="font-bold text-lg">{aqiData.city}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Main Station AQI:</span>
                      <span className="font-bold text-primary">{aqiData.aqi}</span>
                    </div>
                    <div className={`mt-2 text-center p-1 rounded text-xs font-bold text-white`} style={{ backgroundColor: getAQIColor(aqiData.aqi) }}>
                      {aqiData.category}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                      <div>PM2.5: {aqiData.pm25}</div>
                      <div>PM10: {aqiData.pm10}</div>
                      <div>NO₂: {aqiData.no2}</div>
                      <div>CO: {aqiData.co}</div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Simulated nearby sensors */}
            <Circle 
              center={[center[0] + 0.02, center[1] + 0.02]} 
              pathOptions={{ fillColor: '#ef4444', color: '#ef4444', fillOpacity: 0.3 }} 
              radius={800} 
            />
             <Circle 
              center={[center[0] - 0.015, center[1] + 0.03]} 
              pathOptions={{ fillColor: '#f59e0b', color: '#f59e0b', fillOpacity: 0.3 }} 
              radius={600} 
            />
            <Circle 
              center={[center[0] + 0.01, center[1] - 0.02]} 
              pathOptions={{ fillColor: '#10b981', color: '#10b981', fillOpacity: 0.3 }} 
              radius={1000} 
            />
          </MapContainer>

          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 z-[1000] space-y-2">
            <div className="bg-background/90 backdrop-blur-md p-3 rounded-xl border shadow-xl max-w-[200px]">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">AQI Legend</p>
              <div className="space-y-1.5">
                {[
                  { label: "Good", color: "bg-status-safe", range: "0-50" },
                  { label: "Moderate", color: "bg-status-moderate", range: "51-100" },
                  { label: "Unhealthy", color: "bg-orange-500", range: "101-200" },
                  { label: "Hazardous", color: "bg-status-danger", range: "201+" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 bg-muted/10">
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" /> Pollution hotspots near {profile?.city || "New Delhi"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
               {[
                { name: "Industrial Zone A", type: "Industrial", level: "Critical", color: "destructive" as const, val: "242" },
                { name: "Central Traffic Hub", type: "Vehicle", level: "High", color: "secondary" as const, val: "185" },
                { name: "Riverside North", type: "Water", level: "Moderate", color: "default" as const, val: "72" },
                { name: "Residential Park", type: "Air", level: "Good", color: "outline" as const, val: "34" },
              ].map((h) => (
                <div key={h.name} className="flex items-center justify-between rounded-xl bg-background border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div>
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{h.name}</p>
                    <p className="text-[10px] text-muted-foreground">{h.type} Pollution</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold mb-1">AQI {h.val}</p>
                    <Badge variant={h.color} className="text-[9px] uppercase">{h.level}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <h4 className="font-bold text-sm text-primary mb-2">Did you know?</h4>
            <p className="text-xs leading-relaxed text-muted-foreground italic">
              "Fine particulate matter (PM2.5) can penetrate deep into the lungs and enter the bloodstream. Using HEPA filters on hazardous days can reduce indoor exposure by up to 50%."
            </p>
            <button className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:shadow-lg transition-all">
              View Health Recommendations
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
