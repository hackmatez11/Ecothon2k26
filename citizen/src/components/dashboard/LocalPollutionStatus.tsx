import { Wind, Droplets, Volume2, Thermometer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const pollutionData = [
  {
    title: "Air Quality Index",
    icon: Wind,
    value: "145",
    label: "Moderate",
    detail: "PM2.5: 55 µg/m³",
    progress: 58,
    status: "moderate" as const,
  },
  {
    title: "Water Quality",
    icon: Droplets,
    value: "pH 7.2",
    label: "Safe",
    detail: "Contamination Risk: Low",
    progress: 28,
    status: "safe" as const,
  },
  {
    title: "Noise Pollution",
    icon: Volume2,
    value: "72 dB",
    label: "Moderate",
    detail: "Residential limit: 55 dB",
    progress: 65,
    status: "moderate" as const,
  },
  {
    title: "Weather Data",
    icon: Thermometer,
    value: "34°C",
    label: "Humid",
    detail: "Humidity: 78% • Wind: 12 km/h",
    progress: 40,
    status: "safe" as const,
  },
];

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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Local Pollution Status</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pollutionData.map((item) => (
          <Card key={item.title}>
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
