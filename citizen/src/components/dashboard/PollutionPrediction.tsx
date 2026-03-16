import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { 
  fetchAQIData, 
  generateForecast, 
  PredictionData, 
  resolveCityCoords, 
  fetchSourceAttribution,
  SourceData
} from "@/lib/environmental";
import { Loader2, Brain, Satellite } from "lucide-react";

export function PollutionPrediction() {
  const { profile, loading: profileLoading } = useProfile();
  const [forecast, setForecast] = useState<PredictionData[]>([]);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastCity, setForecastCity] = useState<string>("");
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    async function loadData() {
      const lat  = profile?.latitude  ?? null;
      const lng  = profile?.longitude ?? null;
      const city = profile?.city      ?? "New Delhi";

      if (!profileLoading) {
        setLoading(true);
        try {
          // 1. Fetch AQI and Forecast
          const data = await fetchAQIData(city, lat, lng);
          const fc = await generateForecast(data.aqi, lat, lng, city);
          setForecast(fc);
          setForecastCity(data.city || city);

          // 2. Fetch Real Source Attribution
          const sourceResponse = await fetchSourceAttribution(city);
          if (sourceResponse && sourceResponse.sources.length > 0) {
            setSources(sourceResponse.sources);
          } else {
            // Minimal fallback if API is empty
            setSources([
              { name: "Vehicular", value: 40, color: "#ef4444" },
              { name: "Industrial", value: 35, color: "#f97316" },
              { name: "Construction", value: 15, color: "#eab308" },
              { name: "Waste Burning", value: 10, color: "#8b5cf6" }
            ]);
          }

          // Resolve coords for satellite badge
          let resolvedLat = lat;
          let resolvedLng = lng;
          if (!resolvedLat || !resolvedLng) {
            const coords = await resolveCityCoords(city);
            if (coords) [resolvedLat, resolvedLng] = coords;
          }
          setIsSatellite(!!(resolvedLat && resolvedLng));

        } catch (err) {
          console.error("Failed to load pollution data", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadData();
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[350px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></Card>
        <Card className="h-[350px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Air Pollution Forecast (7 Days)
            {isSatellite && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full ring-1 ring-inset ring-sky-500/20">
                <Satellite className="h-3 w-3" /> Sentinel-5P
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              />
              <Area 
                type="monotone" 
                dataKey="aqi" 
                stroke="hsl(var(--primary))" 
                fill="url(#aqiGrad)" 
                strokeWidth={3} 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-70">
            Real-time Predictions for {forecastCity || profile?.city || "your region"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pollution Sources Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
          <div className="relative h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={sources} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={75} 
                  paddingAngle={5} 
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1800}
                >
                  {sources.map((s) => (
                    <Cell key={s.name} fill={s.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground font-medium">Top Source</span>
              <span className="text-lg font-bold text-foreground">{sources[0]?.value}%</span>
            </div>
          </div>
          
          <div className="space-y-4 w-full max-w-[200px]">
            {sources.map((s) => (
              <div key={s.name} className="group flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-tight">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s.name}</span>
                  </div>
                  <span className="text-foreground">{s.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ backgroundColor: s.color, width: `${s.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
