import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, TrendingUp, MessageCircle, ClipboardList } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const trendData = [
  { month: "Jan", aqi: 180 }, { month: "Feb", aqi: 160 }, { month: "Mar", aqi: 140 },
  { month: "Apr", aqi: 120 }, { month: "May", aqi: 150 }, { month: "Jun", aqi: 170 },
  { month: "Jul", aqi: 130 }, { month: "Aug", aqi: 110 }, { month: "Sep", aqi: 145 },
  { month: "Oct", aqi: 190 }, { month: "Nov", aqi: 220 }, { month: "Dec", aqi: 200 },
];

const sourceData = [
  { name: "Vehicles", value: 35, color: "#3b82f6" },
  { name: "Factories", value: 28, color: "#ef4444" },
  { name: "Construction", value: 18, color: "#f59e0b" },
  { name: "Waste Burning", value: 12, color: "#8b5cf6" },
  { name: "Other", value: 7, color: "#6b7280" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Environmental Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Current AQI", value: "185", sub: "Unhealthy", icon: Wind, color: "text-destructive" },
          { title: "Predicted Range", value: "150-210", sub: "Next 7 days", icon: TrendingUp, color: "text-warning" },
          { title: "Active Complaints", value: "342", sub: "+28 today", icon: MessageCircle, color: "text-info" },
          { title: "Active Tasks", value: "89", sub: "12 overdue", icon: ClipboardList, color: "text-primary" },
        ].map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.title}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Pollution Trend (Monthly AQI)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pollution Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Real-Time Pollution Map</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-[16/7] bg-accent rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Wind className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Interactive pollution map with real-time sensor data</p>
              <p className="text-xs mt-1">Integration with mapping service required</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
