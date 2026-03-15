import { Leaf, Brain, Mountain, Wind, TrendingUp, AlertTriangle, MessageCircle, MapPin, Loader2, Search } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";
import { useState, useEffect } from "react";
import { fetchAQIData, AQIData, getAQIColor, fetchPredictionData, PredictionResponse } from "@/lib/environmental";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AqiMap } from "@/components/AqiMap";
import { SatelliteMap } from "@/components/SatelliteMap";

const trendData = [
  { day: "Jan", aqi: 180 }, { day: "Feb", aqi: 160 }, { day: "Mar", aqi: 140 },
  { day: "Apr", aqi: 120 }, { day: "May", aqi: 150 }, { day: "Jun", aqi: 170 },
  { day: "Jul", aqi: 130 }, { day: "Aug", aqi: 110 }, { day: "Sep", aqi: 145 },
  { day: "Oct", aqi: 190 }, { day: "Nov", aqi: 220 }, { day: "Dec", aqi: 200 },
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
  const [city, setCity] = useState("Delhi");
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("Delhi");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [data, pred] = await Promise.all([
        fetchAQIData(city),
        fetchPredictionData(city)
      ]);
      setAqiData(data);
      setPredictionData(pred);
      setLoading(false);
    }
    loadData();
  }, [city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-green-500/5 p-6 rounded-xl border border-green-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Environmental Monitoring for {city}</p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 w-48 bg-white border-green-200" 
                placeholder="Enter city..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-white text-green-600 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors shadow-sm flex items-center gap-1">
              <Search className="h-4 w-4" />
              Set City
            </button>
          </form>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
            Issue Smog Alert
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Current AQI", 
            value: loading ? "..." : aqiData?.aqi.toString() || "N/A", 
            sub: aqiData?.category || "Fetching...", 
            icon: Wind, 
            color: aqiData ? `text-[${getAQIColor(aqiData.aqi)}]` : "text-muted-foreground",
            isPredicted: aqiData?.aqi === 0 && predictionData ? true : false
          },
          { 
            title: "Predicted Range", 
            value: predictionData ? `${Math.round(predictionData.current_aqi * 0.9)}-${Math.round(predictionData.current_aqi * 1.1)}` : "150-210", 
            sub: "Next 14 days", 
            icon: TrendingUp, 
            color: "text-warning" 
          },
          { title: "Active Alerts", value: "12", sub: "High priority", icon: AlertTriangle, color: "text-info" },
          { title: "Monitoring Sites", value: "89", sub: "All active", icon: Mountain, color: "text-primary" },
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{card.title}</span>
                {loading && card.title === "Current AQI" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <card.icon className={`${card.color.startsWith('text-[') ? '' : card.color}`} style={card.color.startsWith('text-[') ? { color: getAQIColor(aqiData?.aqi || (predictionData?.current_aqi || 0)) } : {}} />
                )}
              </div>
              <div className="text-3xl font-bold text-foreground">
                {card.title === "Current AQI" && card.isPredicted && predictionData 
                  ? Math.round(predictionData.current_aqi) 
                  : card.value}
                {card.title === "Current AQI" && card.isPredicted && (
                  <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded uppercase tracking-tighter align-middle font-bold">Model</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${card.color.replace('text-', 'bg-').startsWith('bg-[') ? '' : card.color.replace('text-', 'bg-')}`} style={card.color.startsWith('text-[') ? { backgroundColor: getAQIColor(aqiData?.aqi || (predictionData?.current_aqi || 0)) } : {}} />
                {card.title === "Current AQI" && card.isPredicted && predictionData ? predictionData.forecast[0].category : card.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AqiMap city={city} />
        <SatelliteMap city={city} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-primary/5 shadow-md">
          <CardHeader className="bg-primary/5 border-b py-3 px-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary text-center">
              Historical Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">Past 20 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={predictionData?.history || trendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-blue-500/10 shadow-md">
          <CardHeader className="bg-blue-500/5 border-b py-3 px-4">
            <CardTitle className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-blue-600">
              AI Forecast
              <Brain className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4 text-center">
              <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">14-Day Projection</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={predictionData?.forecast}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelFormatter={(label) => `Forecast: ${label}`}
                />
                <Area type="monotone" dataKey="aqi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 border-b bg-muted/30">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Source Attribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4}>
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[11px] group cursor-help">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
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
          
          <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500" onClick={() => navigate("/citizen-complaints/environment")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500 bg-opacity-10">
                  <MessageCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">New Reports</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-base mb-1.5 text-emerald-600">Citizen Complaints</CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">View and respond to AI-categorized environmental complaints from citizens.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
