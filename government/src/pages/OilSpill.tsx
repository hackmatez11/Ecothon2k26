import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship, AlertTriangle, MapPin, Users } from "lucide-react";

const spills = [
  { id: 1, location: "Arabian Sea - Mumbai Coast", date: "2026-03-08", severity: "High", area: "15 sq km", status: "Active" },
  { id: 2, location: "Bay of Bengal - Chennai", date: "2026-03-05", severity: "Medium", area: "8 sq km", status: "Cleanup In Progress" },
  { id: 3, location: "Gulf of Kutch", date: "2026-02-28", severity: "Low", area: "3 sq km", status: "Contained" },
];

const OilSpill = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Oil Spill Detection</h1>

      <Card>
        <CardHeader><CardTitle>Satellite Monitoring View</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-[16/7] bg-gradient-to-b from-secondary/20 to-info/10 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Ship className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Satellite-based oil spill detection imagery</p>
              </div>
            </div>
            {spills.filter(s => s.status === "Active").map((s, i) => (
              <div key={s.id} className="absolute animate-pulse" style={{ left: `${30 + i * 20}%`, top: `${40 + i * 10}%` }}>
                <div className="h-6 w-6 rounded-full bg-destructive/80 flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detected Spills</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spills.map((s) => (
              <div key={s.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{s.location}</span>
                  </div>
                  <span className={`gov-badge ${s.severity === "High" ? "bg-destructive/10 text-destructive" : s.severity === "Medium" ? "bg-warning/10 text-warning" : "bg-accent text-accent-foreground"}`}>
                    {s.severity} Severity
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Date: {s.date} | Area: {s.area} | Status: {s.status}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><AlertTriangle className="mr-1 h-3 w-3" /> Alert Authorities</Button>
                  <Button size="sm" variant="outline"><Users className="mr-1 h-3 w-3" /> Deploy Cleanup</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OilSpill;
