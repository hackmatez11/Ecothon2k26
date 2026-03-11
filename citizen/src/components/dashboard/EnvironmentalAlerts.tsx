import { AlertTriangle, Droplets, Flame, CloudRain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const alerts = [
  {
    icon: AlertTriangle,
    title: "⚠ High Air Pollution Alert in Delhi",
    desc: "AQI exceeds 200 in several areas.",
    recs: ["Avoid outdoor activities", "Wear N95 masks", "Use air purifiers indoors"],
    severity: "danger" as const,
  },
  {
    icon: Droplets,
    title: "Water Contamination Warning - Yamuna",
    desc: "Elevated levels of industrial discharge detected.",
    recs: ["Boil water before drinking", "Avoid river contact", "Report unusual discharge"],
    severity: "moderate" as const,
  },
  {
    icon: Flame,
    title: "Forest Fire Risk - Uttarakhand",
    desc: "Dry conditions increasing wildfire probability.",
    recs: ["Report smoke sightings", "Avoid forest campfires", "Follow evacuation notices"],
    severity: "danger" as const,
  },
  {
    icon: CloudRain,
    title: "Extreme Weather Advisory",
    desc: "Heavy rainfall expected in next 48 hours.",
    recs: ["Secure loose objects", "Avoid waterlogged areas", "Keep emergency kit ready"],
    severity: "moderate" as const,
  },
];

const severityStyles = {
  danger: "border-l-status-danger bg-status-danger/5",
  moderate: "border-l-status-moderate bg-status-moderate/5",
};

export function EnvironmentalAlerts() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Environmental Alerts</h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.title} className={`border-l-4 ${severityStyles[alert.severity]}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <alert.icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <p className="font-semibold text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.desc}</p>
                  <ul className="mt-2 space-y-1">
                    {alert.recs.map((r) => (
                      <li key={r} className="text-xs text-muted-foreground">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
