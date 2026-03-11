import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const waterBodies = [
  { name: "Yamuna River", ph: 7.8, do: 3.2, contamination: "High", status: "Critical" },
  { name: "Ganga River", ph: 7.5, do: 5.1, contamination: "Moderate", status: "Warning" },
  { name: "Dal Lake", ph: 7.2, do: 6.8, contamination: "Low", status: "Good" },
  { name: "Hussain Sagar", ph: 8.1, do: 2.8, contamination: "High", status: "Critical" },
  { name: "Chilika Lake", ph: 7.4, do: 7.2, contamination: "Low", status: "Good" },
];

const chartData = waterBodies.map(w => ({ name: w.name, pH: w.ph, DO: w.do }));

const WaterQuality = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Water Quality Monitoring</h1>

      <Card>
        <CardHeader><CardTitle>Water Bodies Map</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-[16/7] bg-accent rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Interactive water quality map - Rivers, Lakes, Reservoirs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Water Quality Metrics</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="pH" fill="hsl(var(--primary))" name="pH Level" />
              <Bar dataKey="DO" fill="hsl(var(--secondary))" name="Dissolved Oxygen" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Water Body Status</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {waterBodies.map((w) => (
              <div key={w.name} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                {w.status === "Critical" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Droplets className="h-5 w-5 text-primary" />}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{w.name}</p>
                  <p className="text-sm text-muted-foreground">pH: {w.ph} | DO: {w.do} mg/L | Contamination: {w.contamination}</p>
                </div>
                <span className={`gov-badge ${w.status === "Critical" ? "bg-destructive/10 text-destructive" : w.status === "Warning" ? "bg-warning/10 text-warning" : "bg-accent text-accent-foreground"}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterQuality;
