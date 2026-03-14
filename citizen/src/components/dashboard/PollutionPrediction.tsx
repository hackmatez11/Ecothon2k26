import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { fetchAQIData, generateForecast, PredictionData, resolveCityCoords } from "@/lib/environmental";
import { Loader2, Brain, Satellite } from "lucide-react";

const sources = [
  { name: "Traffic", value: 45, color: "hsl(210, 100%, 50%)" },
  { name: "Industrial", value: 30, color: "hsl(0, 84%, 60%)" },
  { name: "Construction", value: 15, color: "hsl(45, 93%, 47%)" },
  { name: "Waste Burning", value: 10, color: "hsl(142, 71%, 45%)" },
];

export function PollutionPrediction() {
  const { profile, loading: profileLoading } = useProfile();
  const [forecast, setForecast] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastCity, setForecastCity] = useState<string>("");
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    async function loadForecast() {
      const lat  = profile?.latitude  ?? null;
      const lng  = profile?.longitude ?? null;
      const city = profile?.city      ?? "New Delhi";

      if (!profileLoading) {
        const data = await fetchAQIData(city, lat, lng);

        // Resolve coords so we know if satellite data will be used
        let resolvedLat = lat;
        let resolvedLng = lng;
        if (!resolvedLat || !resolvedLng) {
          const coords = await resolveCityCoords(city);
          if (coords) [resolvedLat, resolvedLng] = coords;
        }

        // Pass city name so generateForecast can geocode if lat/lng are missing
        const fc = await generateForecast(data.aqi, lat, lng, city);
        setForecast(fc);
        setForecastCity(data.city || city);
        setIsSatellite(!!(resolvedLat && resolvedLng));
        setLoading(false);
      }
    }
    loadForecast();
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-[350px] flex items-center justify-center"><Loader2 className="animate-spin" /></Card>
        <Card className="h-[350px] flex items-center justify-center"><Loader2 className="animate-spin" /></Card>
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
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} 
              />
              <Area 
                type="monotone" 
                dataKey="aqi" 
                stroke="hsl(var(--primary))" 
                fill="url(#aqiGrad)" 
                strokeWidth={2} 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
            Predicted AQI levels for {forecastCity || profile?.city || "your region"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pollution Sources Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie data={sources} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {sources.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 w-full">
            {sources.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-bold text-foreground">{s.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
