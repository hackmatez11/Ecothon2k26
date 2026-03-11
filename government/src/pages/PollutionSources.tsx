import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus } from "lucide-react";

const sourceData = [
  { name: "Vehicles", value: 35, color: "#3b82f6" },
  { name: "Factories", value: 28, color: "#ef4444" },
  { name: "Construction", value: 18, color: "#f59e0b" },
  { name: "Garbage Burning", value: 12, color: "#8b5cf6" },
  { name: "Other", value: 7, color: "#6b7280" },
];

const cityData = [
  { city: "Delhi", vehicles: 40, factories: 25, construction: 20, burning: 15 },
  { city: "Mumbai", vehicles: 35, factories: 30, construction: 15, burning: 20 },
  { city: "Kolkata", vehicles: 30, factories: 35, construction: 20, burning: 15 },
  { city: "Chennai", vehicles: 25, factories: 20, construction: 30, burning: 25 },
];

const actions = [
  { source: "Vehicles", action: "Implement odd-even traffic restrictions", status: "Proposed" },
  { source: "Factories", action: "Schedule factory inspection drive", status: "Active" },
  { source: "Construction", action: "Enforce dust control measures", status: "Active" },
  { source: "Garbage Burning", action: "Deploy waste collection teams", status: "Proposed" },
];

const PollutionSources = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pollution Source Analysis</h1>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Control Plan</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Source Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {sourceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>City-wise Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="city" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="vehicles" fill="#3b82f6" name="Vehicles" stackId="a" />
                <Bar dataKey="factories" fill="#ef4444" name="Factories" stackId="a" />
                <Bar dataKey="construction" fill="#f59e0b" name="Construction" stackId="a" />
                <Bar dataKey="burning" fill="#8b5cf6" name="Burning" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Control Plans</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">{a.action}</p>
                  <p className="text-sm text-muted-foreground">Source: {a.source}</p>
                </div>
                <span className={`gov-badge ${a.status === "Active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollutionSources;
