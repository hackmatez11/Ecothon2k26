import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";

const budgetData = [
  { dept: "Air Pollution", allocated: 450, spent: 320 },
  { dept: "Waste Mgmt", allocated: 380, spent: 290 },
  { dept: "Water Treatment", allocated: 520, spent: 410 },
  { dept: "Forest Conservation", allocated: 280, spent: 220 },
  { dept: "Climate Action", allocated: 350, spent: 180 },
];

const simulations = [
  { measure: "Traffic Control in Delhi", cost: "₹120 Cr", reduction: "15% AQI reduction", before: 185, after: 157 },
  { measure: "Factory Emission Filters", cost: "₹280 Cr", reduction: "22% AQI reduction", before: 185, after: 144 },
  { measure: "Waste Processing Plants", cost: "₹450 Cr", reduction: "12% AQI reduction", before: 185, after: 163 },
];

const Budget = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Budget Planning</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <Wallet className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="text-3xl font-bold text-foreground">₹1,980 Cr</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <TrendingDown className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-3xl font-bold text-foreground">₹1,420 Cr</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <TrendingUp className="h-8 w-8 text-info mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-3xl font-bold text-foreground">₹560 Cr</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Budget Allocation vs Expenditure (₹ Crores)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dept" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="allocated" fill="hsl(var(--primary))" name="Allocated" />
              <Bar dataKey="spent" fill="hsl(var(--secondary))" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Before / After Simulation</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {simulations.map((s, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-foreground">{s.measure}</p>
                  <span className="gov-badge bg-accent text-accent-foreground">{s.cost}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Before</p>
                    <p className="text-2xl font-bold text-destructive">{s.before}</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">After</p>
                    <p className="text-2xl font-bold text-success">{s.after}</p>
                  </div>
                  <p className="ml-auto text-sm font-medium text-primary">{s.reduction}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Budget;
