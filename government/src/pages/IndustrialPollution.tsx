import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, AlertTriangle, FileText, ClipboardList } from "lucide-react";

const factories = [
  { name: "Tata Steel Plant", location: "Jamshedpur", emission: "Above Limit", co2: 450, so2: 120, status: "Violation" },
  { name: "Reliance Refinery", location: "Jamnagar", emission: "Normal", co2: 280, so2: 45, status: "Compliant" },
  { name: "NTPC Thermal", location: "Singrauli", emission: "Above Limit", co2: 520, so2: 180, status: "Violation" },
  { name: "Hindalco Industries", location: "Renukoot", emission: "Normal", co2: 200, so2: 35, status: "Compliant" },
  { name: "Indian Oil Refinery", location: "Mathura", emission: "Elevated", co2: 380, so2: 95, status: "Warning" },
];

const IndustrialPollution = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Industrial Pollution Detection</h1>

      <Card>
        <CardHeader><CardTitle>Factory Monitoring Map</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-[16/7] bg-accent rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Factory className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Interactive factory emissions monitoring map</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Total Monitored</p>
          <p className="text-3xl font-bold text-foreground">2,847</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Violations</p>
          <p className="text-3xl font-bold text-destructive">342</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Inspections Pending</p>
          <p className="text-3xl font-bold text-warning">89</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Factory Status</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {factories.map((f) => (
              <div key={f.name} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                <Factory className={`h-5 w-5 ${f.status === "Violation" ? "text-destructive" : f.status === "Warning" ? "text-warning" : "text-success"}`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{f.name}</p>
                  <p className="text-sm text-muted-foreground">{f.location} | CO₂: {f.co2} ppm | SO₂: {f.so2} ppm</p>
                </div>
                <span className={`gov-badge ${f.status === "Violation" ? "bg-destructive/10 text-destructive" : f.status === "Warning" ? "bg-warning/10 text-warning" : "bg-accent text-accent-foreground"}`}>
                  {f.status}
                </span>
                <div className="flex gap-1">
                  {f.status === "Violation" && (
                    <>
                      <Button size="sm" variant="outline"><FileText className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline"><ClipboardList className="h-3 w-3" /></Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustrialPollution;
