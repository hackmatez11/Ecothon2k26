import { MapPin, Wind, Droplets, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState } from "react";
import { fetchAQIData, AQIData, simulateWaterQuality, WaterQualityData } from "@/lib/environmental";

const statusColors = {
  safe: "bg-status-safe/10 text-status-safe border-status-safe/20",
  moderate: "bg-status-moderate/10 text-status-moderate border-status-moderate/20",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
  poor: "bg-status-danger/10 text-status-danger border-status-danger/20",
};

export function WelcomeHeader() {
  const { profile, loading: profileLoading } = useProfile();
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [waterData, setWaterData] = useState<WaterQualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const city = profile?.city || "New Delhi";
      const lat = profile?.latitude || 28.6139;
      const lng = profile?.longitude || 77.2090;

      const [aqi, water] = await Promise.all([
        fetchAQIData(city, lat, lng),
        Promise.resolve(simulateWaterQuality(city))
      ]);

      setAqiData(aqi);
      setWaterData(water);
      setLoading(false);
    }
    
    if (!profileLoading) {
      loadData();
    }
  }, [profile, profileLoading]);

  const statusCards = [
    { 
      title: "Air Quality", 
      value: aqiData?.category || "N/A", 
      metric: aqiData && aqiData.aqi > 0 ? `AQI ${aqiData.aqi}` : "No Sensor Data", 
      icon: Wind, 
      status: aqiData && aqiData.aqi > 0 ? (aqiData.aqi < 100 ? "safe" : aqiData.aqi < 200 ? "moderate" : "danger") : "safe" as const 
    },
    { 
      title: "Water Quality", 
      value: waterData?.status || "Good", 
      metric: waterData ? `pH ${waterData.ph} (${waterData.label})` : "pH 7.0 (Stable)", 
      icon: Droplets, 
      status: (waterData?.status.toLowerCase() || "safe") as any 
    },
  ];

  if (profileLoading || loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back, Citizen</h1>
          <p className="mt-2 text-primary-foreground/80">
            Monitor environmental conditions, report pollution, and track government actions in your area.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/70">
            <MapPin className="h-4 w-4" />
            <span>{profile?.city || "New Delhi"}, India • Environmental Status: {aqiData?.category || "Moderate"}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wind className="h-32 w-32" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {statusCards.map((card) => (
          <Card key={card.title} className={`border ${statusColors[card.status]}`}>
            <CardContent className="flex items-center gap-4 p-4">
              <card.icon className="h-8 w-8 shrink-0" />
              <div>
                <p className="text-sm font-medium">{card.title}</p>
                <p className="text-lg font-bold">{card.value}</p>
                <p className="text-xs opacity-70">{card.metric}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
