import { MapPin, Wind, Droplets, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const statusCards = [
  { title: "Air Quality", value: "Good", metric: "AQI 42", icon: Wind, status: "safe" as const },
  { title: "Water Quality", value: "Moderate", metric: "pH 7.2", icon: Droplets, status: "moderate" as const },
  { title: "Active Alerts", value: "2 Alerts", metric: "In your area", icon: AlertTriangle, status: "danger" as const },
];

const statusColors = {
  safe: "bg-status-safe/10 text-status-safe border-status-safe/20",
  moderate: "bg-status-moderate/10 text-status-moderate border-status-moderate/20",
  danger: "bg-status-danger/10 text-status-danger border-status-danger/20",
};

export function WelcomeHeader() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
        <h1 className="text-2xl font-bold md:text-3xl">Welcome to the Environmental Citizen Portal</h1>
        <p className="mt-2 text-primary-foreground/80">
          Monitor environmental conditions, report pollution, and track government actions in your area.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-primary-foreground/70">
          <MapPin className="h-4 w-4" />
          <span>New Delhi, India • Environmental Status: Moderate</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
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
