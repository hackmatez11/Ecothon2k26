import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Brain, Mountain, Wind, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";

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

const EnvironmentalDashboard = () => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === "Environmental Department")!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-green-500/5 p-6 rounded-xl border border-green-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Environmental Monitoring & Protection Division</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
            Issue Smog Alert
          </button>
          <button className="px-4 py-2 bg-white text-green-600 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors shadow-sm">
            Deploy Mobile Station
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Current AQI", value: "185", sub: "Unhealthy", icon: Wind, color: "text-destructive" },
          { title: "Predicted Range", value: "150-210", sub: "Next 7 days", icon: TrendingUp, color: "text-warning" },
          { title: "Active Alerts", value: "12", sub: "High priority", icon: AlertTriangle, color: "text-info" },
          { title: "Monitoring Sites", value: "89", sub: "All active", icon: Mountain, color: "text-primary" },
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{card.title}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${card.color.replace('text-', 'bg-')}`} />
                {card.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pollution Trend (Monthly AQI)</CardTitle>
              <div className="flex gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">2026 Data</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAqi)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Source Attribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm group cursor-help">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Environmental Intelligence Tools
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {deptData.features.map((feature) => (
            <Card key={feature.title} className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border hover:border-primary/50" onClick={() => navigate(feature.path)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${feature.color} bg-opacity-10`}>
                    <feature.icon className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground bg-muted px-2 py-1 rounded-full">{feature.stats}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-base mb-1.5 group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
