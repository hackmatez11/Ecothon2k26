import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Brain, Car, Factory, Building2, Flame } from "lucide-react";
import { useState } from "react";

const forecastData = [
  { day: "Today", actual: 185, predicted: 185 },
  { day: "Tomorrow", actual: null, predicted: 192 },
  { day: "Day 3", actual: null, predicted: 178 },
  { day: "Day 4", actual: null, predicted: 165 },
  { day: "Day 5", actual: null, predicted: 170 },
  { day: "Day 6", actual: null, predicted: 155 },
  { day: "Day 7", actual: null, predicted: 148 },
];

const sources = [
  { icon: Car, name: "Traffic", contribution: 35, trend: "↑" },
  { icon: Factory, name: "Industrial", contribution: 28, trend: "→" },
  { icon: Building2, name: "Construction", contribution: 18, trend: "↓" },
  { icon: Flame, name: "Waste Burning", contribution: 19, trend: "↑" },
];

const PollutionPrediction = () => {
  const [city, setCity] = useState("delhi");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Pollution Prediction</h1>

      <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
        <div className="space-y-2">
          <Label>City</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="delhi">Delhi</SelectItem>
              <SelectItem value="mumbai">Mumbai</SelectItem>
              <SelectItem value="kolkata">Kolkata</SelectItem>
              <SelectItem value="chennai">Chennai</SelectItem>
              <SelectItem value="bangalore">Bangalore</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Select defaultValue="all">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="center">City Center</SelectItem>
              <SelectItem value="industrial">Industrial Zone</SelectItem>
              <SelectItem value="residential">Residential Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Current AQI", value: "185", status: "Unhealthy" },
          { label: "Tomorrow Prediction", value: "192", status: "Very Unhealthy" },
          { label: "7-Day Forecast", value: "148-192", status: "Improving Trend" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> AI Pollution Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Main Pollution Sources</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sources.map((s) => (
              <div key={s.name} className="p-4 rounded-lg border border-border bg-muted/30">
                <s.icon className="h-8 w-8 text-primary mb-3" />
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-2xl font-bold text-foreground">{s.contribution}%</p>
                <p className="text-sm text-muted-foreground">Trend: {s.trend}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollutionPrediction;
