import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const predictionData = [
  { day: "Today", aqi: 145 },
  { day: "Tomorrow", aqi: 160 },
  { day: "Day 3", aqi: 155 },
  { day: "Day 4", aqi: 140 },
  { day: "Day 5", aqi: 130 },
  { day: "Day 6", aqi: 120 },
  { day: "Day 7", aqi: 110 },
];

const sources = [
  { name: "Traffic", value: 45, color: "hsl(210, 100%, 50%)" },
  { name: "Industrial", value: 30, color: "hsl(0, 84%, 60%)" },
  { name: "Construction", value: 15, color: "hsl(45, 93%, 47%)" },
  { name: "Waste Burning", value: 10, color: "hsl(142, 71%, 45%)" },
];

export function PollutionPrediction() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Air Pollution Forecast (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={predictionData}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="aqi" stroke="hsl(142, 71%, 35%)" fill="url(#aqiGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pollution Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie data={sources} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {sources.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-foreground">{s.name}</span>
                <span className="font-bold text-foreground">{s.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
