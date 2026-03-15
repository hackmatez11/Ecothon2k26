import { AlertTriangle, Droplets, Flame, CloudRain, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchAQIData, getAQICategory, STATIC_ALERTS, sendTwilioAlert } from "@/lib/environmental";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const alertIcons: Record<string, any> = {
  "Water Contamination Warning - Yamuna": Droplets,
  "Forest Fire Risk - Uttarakhand": Flame,
  "Extreme Weather Advisory": CloudRain,
};

const severityStyles = {
  danger: "border-l-status-danger bg-status-danger/5",
  moderate: "border-l-status-moderate bg-status-moderate/5",
  success: "border-l-status-success bg-status-success/5",
  warning: "border-l-status-warning bg-status-warning/5",
};

export function EnvironmentalAlerts() {
  const { profile } = useProfile();
  const [aqiAlert, setAqiAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    async function loadAqi() {
      if (!profile?.city) return;
      try {
        const data = await fetchAQIData(profile.city, profile.latitude, profile.longitude);
        const category = getAQICategory(data.aqi);
        setAqiAlert({
          icon: AlertTriangle,
          title: `Daily AQI Prediction for ${profile.city}`,
          desc: `Today's predicted AQI is ${data.aqi} which is considered ${category}.`,
          recs: data.aqi > 100 ? ["Wear a mask", "Limit outdoor exertion"] : ["Air quality is acceptable"],
          severity: data.aqi > 150 ? "danger" : (data.aqi > 100 ? "moderate" : "success"),
          aqi: data.aqi
        });
      } catch (err) {
        console.error("Failed to load AQI alert", err);
      } finally {
        setLoading(false);
      }
    }
    loadAqi();
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
      toast.success("AQI Alert sent to your phone!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS alert.");
    } finally {
      setSendingAlert(false);
    }
  };

  const allAlerts = aqiAlert ? [aqiAlert, ...STATIC_ALERTS] : STATIC_ALERTS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Environmental Alerts</h2>
        {aqiAlert && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            onClick={handleSendSms}
            disabled={sendingAlert}
          >
            {sendingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Alerts to Phone
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!loading && allAlerts.map((alert) => (
          <Card key={alert.title} className={`border-l-4 ${(severityStyles as any)[alert.severity]}`}>
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
