import { AlertTriangle, Droplets, Flame, CloudRain, Send, Loader2, Factory, Car, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { 
  fetchAQIData, 
  getAQICategory, 
  fetchOilSpills, 
  fetchSourceAttribution, 
  simulateWaterQuality,
  fetchSentinelForecast,
  sendTwilioAlert,
  EnvironmentalAlert
} from "@/lib/environmental";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const alertIcons: Record<string, any> = {
  "Water Contamination Warning": Droplets,
  "Forest Fire Risk - Uttarakhand": Flame,
  "Extreme Weather Advisory": CloudRain,
  "Oil Spill Detected": Waves,
  "High Urban Pollution": Factory,
  "Traffic Congestion Alert": Car,
};

const severityStyles = {
  danger: "border-l-status-danger bg-status-danger/5",
  moderate: "border-l-status-moderate bg-status-moderate/5",
  success: "border-l-status-success bg-status-success/5",
  warning: "border-l-status-warning bg-status-warning/5",
};

export function EnvironmentalAlerts() {
  const { profile } = useProfile();
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    async function loadAllAlerts() {
      if (!profile?.city || !profile?.latitude || !profile?.longitude) {
        setLoading(false);
        return;
      }

      try {
        const newAlerts: EnvironmentalAlert[] = [];

        // 1. AQI Alert (Primary - using Sentinel-5P /predict)
        try {
          const forecastData = await fetchSentinelForecast(profile.latitude, profile.longitude);
          const currentAqi = forecastData.current_aqi;
          const category = getAQICategory(currentAqi);
          newAlerts.push({
            icon: AlertTriangle,
            title: `Daily AQI Prediction for ${profile.city}`,
            desc: `Today's predicted AQI is ${Math.round(currentAqi)} (${category}) via Sentinel-5P.`,
            recs: currentAqi > 100 ? ["Wear a mask", "Limit outdoor exertion"] : ["Air quality is acceptable"],
            severity: currentAqi > 150 ? "danger" : (currentAqi > 100 ? "moderate" : "success"),
            aqi: currentAqi
          });
        } catch (e) { 
          console.error("AQI forecast failed", e);
          // Fallback to simpler mock if needed? No, let's just log and skip.
        }

        // 2. Oil Spill Alert (Satellite Detection)
        try {
          const oilData = await fetchOilSpills(profile.latitude, profile.longitude);
          if (oilData.spill_count > 0) {
            const majorSpills = oilData.spills.filter(s => s.severity === 'Major');
            newAlerts.push({
              icon: Waves,
              title: "Oil Spill Detected",
              desc: `Satellite data detected ${oilData.spill_count} spills nearby.`,
              recs: ["Avoid coastal activities", "Support local cleanup", "Check water advisories"],
              severity: majorSpills.length > 0 ? "danger" : "moderate"
            });
          }
        } catch (e) { console.error("Oil spill fetch failed", e); }

        // 3. Source Attribution Alerts (TomTom + OSM)
        try {
          const sourceData = await fetchSourceAttribution(profile.city);
          if (sourceData) {
            const topSource = sourceData.sources[0];
            if (topSource.value > 40) {
              const isTraffic = topSource.name.includes("Traffic");
              newAlerts.push({
                icon: isTraffic ? Car : Factory,
                title: isTraffic ? "Traffic Congestion Alert" : "High Urban Pollution",
                desc: `${topSource.name} is contributing ${topSource.value}% of local pollution.`,
                recs: isTraffic ? ["Avoid peak hours", "Use public transit"] : ["Keep windows closed", "Use air purifiers"],
                severity: "moderate"
              });
            }
          }
        } catch (e) { console.error("Source attribution fetch failed", e); }

        // 4. Water Quality Alert (Simulation)
        try {
          const waterData = simulateWaterQuality(profile.city);
          if (waterData.status !== 'Safe') {
            newAlerts.push({
              icon: Droplets,
              title: "Water Quality Notice",
              desc: `Local water pH is ${waterData.ph} - Status: ${waterData.label}`,
              recs: ["Boil water before drinking", "Check filtration systems"],
              severity: waterData.status === 'Poor' ? "danger" : "moderate"
            });
          }
        } catch (e) { console.error("Water quality simulation failed", e); }

        setAlerts(newAlerts);
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllAlerts();
  }, [profile]);

  const handleSendSms = async () => {
    if (!profile?.phone_number) {
      toast.error("Please add a phone number to your profile first.");
      return;
    }
    if (!profile?.city) return;

    setSendingAlert(true);
    try {
      await sendTwilioAlert(profile.phone_number, profile.city, profile.latitude, profile.longitude);
      toast.success("Environmental Alerts sent to your phone!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS alert.");
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {loading ? "Checking Alerts..." : `${alerts.length} ${alerts.length === 1 ? 'Alert' : 'Alerts'}`}
            </h2>
            {!loading && alerts.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-danger"></span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium">In your area</p>
        </div>
        {!loading && alerts.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary/20 hover:bg-primary/5 transition-all duration-300" 
            onClick={handleSendSms}
            disabled={sendingAlert}
          >
            {sendingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Alert Phone</span>
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No active environmental alerts in your area.</p>
        )}
        {!loading && alerts.map((alert, idx) => (
          <Card key={`${alert.title}-${idx}`} className={`border-l-4 ${(severityStyles as any)[alert.severity]}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = alert.icon || (alertIcons as any)[alert.title] || AlertTriangle;
                  return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />;
                })()}
                <div>
                  <p className="font-semibold text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.desc}</p>
                  <ul className="mt-2 space-y-1">
                    {alert.recs.map((r: string) => (
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
