import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle } from "lucide-react";

const actions = [
  { title: "Traffic Control Measures", area: "Central Delhi", before: 210, after: 150 },
  { title: "Factory Inspections", area: "Okhla Industrial", before: 180, after: 120 },
  { title: "Waste Cleanup Operations", area: "East Delhi", before: 195, after: 140 },
];

const chartData = actions.map((a) => ({ name: a.title.split(" ")[0], Before: a.before, After: a.after }));

export function GovernmentActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Government Action Transparency</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((a) => (
          <Card key={a.title}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.area}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-status-danger">Before: AQI {a.before}</span>
                    <span className="text-status-safe">After: AQI {a.after}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Before vs After Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Before" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="After" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
