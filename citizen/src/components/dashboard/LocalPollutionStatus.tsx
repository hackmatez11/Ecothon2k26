import { Wind, Droplets, Volume2, Thermometer, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { fetchAQIData, AQIData } from "@/lib/environmental";

const statusBarColor = {
  safe: "[&>div]:bg-status-safe",
  moderate: "[&>div]:bg-status-moderate",
  danger: "[&>div]:bg-status-danger",
};

const statusDot = {
  safe: "bg-status-safe",
  moderate: "bg-status-moderate",
  danger: "bg-status-danger",
};

export function LocalPollutionStatus() {
  const { profile, loading: profileLoading } = useProfile();
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAQI() {
      if (profile?.city) {
        const data = await fetchAQIData(profile.city, profile.latitude, profile.longitude);
        setAqiData(data);
        setLoading(false);
      } else if (!profileLoading) {
        const data = await fetchAQIData("New Delhi", 28.6139, 77.2090);
        setAqiData(data);
        setLoading(false);
      }
    }
    loadAQI();
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-muted/10 border border-dashed">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading local status...</span>
      </div>
    );
  }

  const pollutionData = [
    {
      title: "PM2.5",
      icon: Wind,
      value: `${aqiData?.pm25} µg/m³`,
      label: aqiData?.category || "Moderate",
      detail: "Fine particulate matter",
      progress: Math.min(100, (aqiData?.pm25 || 0) * 1.5),
      status: (aqiData?.pm25 || 0) < 35 ? "safe" : (aqiData?.pm25 || 0) < 75 ? "moderate" : "danger" as const,
    },
    {
      title: "PM10",
      icon: Wind,
      value: `${aqiData?.pm10} µg/m³`,
      label: "Concentration",
      detail: "Inhalable particles",
      progress: Math.min(100, (aqiData?.pm10 || 0)),
      status: (aqiData?.pm10 || 0) < 50 ? "safe" : (aqiData?.pm10 || 0) < 150 ? "moderate" : "danger" as const,
    },
    {
      title: "NO₂ & SO₂",
      icon: Wind,
      value: `${aqiData?.no2} / ${aqiData?.so2}`,
      label: "NO₂ / SO₂ ppb",
      detail: "Gaseous pollutants",
      progress: Math.min(100, (aqiData?.no2 || 0) * 2),
      status: (aqiData?.no2 || 0) < 40 ? "safe" : "moderate" as const,
    },
    {
      title: "CO Levels",
      icon: Wind,
      value: `${aqiData?.co} mg/m³`,
      label: "Carbon Monoxide",
      detail: "Combustion byproduct",
      progress: Math.min(100, (aqiData?.co || 0) * 10),
      status: (aqiData?.co || 0) < 4 ? "safe" : "moderate" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Detailed Air Quality: {profile?.city || "New Delhi"}</h2>
        <span className="text-xs text-muted-foreground italic">Source: OpenAQ / WAQI</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pollutionData.map((item) => (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <item.icon className="h-5 w-5 text-secondary" />
                <span className={`inline-block h-2 w-2 rounded-full ${statusDot[item.status]}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              </div>
              <Progress value={item.progress} className={`h-1.5 ${statusBarColor[item.status]}`} />
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
