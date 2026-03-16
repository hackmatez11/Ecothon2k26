import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Factory, MessageCircle, Zap, Search, Loader2, Wind, Flame, Droplets } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";
import {
  fetchAQIData, fetchOpenAQReadings, fetchIndustrialSiteCount, resolveCityCoords,
  getAQIColor, AQIData, OpenAQReading,
} from "@/lib/environmental";

const complianceData = [
  { month: "Jan", compliant: 45, nonCompliant: 12 },
  { month: "Feb", compliant: 48, nonCompliant: 9 },
  { month: "Mar", compliant: 42, nonCompliant: 15 },
  { month: "Apr", compliant: 50, nonCompliant: 7 },
  { month: "May", compliant: 46, nonCompliant: 11 },
  { month: "Jun", compliant: 52, nonCompliant: 5 },
];

const complaintData = [
  { name: "Air Pollution", value: 42, color: "#3b82f6" },
  { name: "Water Pollution", value: 28, color: "#06b6d4" },
  { name: "Noise Pollution", value: 18, color: "#f59e0b" },
  { name: "Waste Disposal", value: 12, color: "#8b5cf6" },
];

// Major Indian industrial cities to show in the live table
const INDUSTRIAL_CITIES = ["Kanpur", "Surat", "Ahmedabad", "Nagpur", "Ludhiana", "Vadodara"];

interface CityPollution {
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  industrialSites: number;
  status: string;
}

function getStatus(aqi: number) {
  if (aqi <= 50) return "Compliant";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Warning";
  return "Violation";
}

function statusColor(s: string) {
  if (s === "Compliant") return "bg-green-500/10 text-green-500 border-green-500/30";
  if (s === "Moderate") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
  if (s === "Warning") return "bg-orange-500/10 text-orange-500 border-orange-500/30";
  return "bg-red-500/10 text-red-500 border-red-500/30";
}
const IndustrialRegulationDashboard = () => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === "Industrial Regulation Department")!;

  const [searchCity, setSearchCity] = useState("Delhi");
  const [searchInput, setSearchInput] = useState("Delhi");
  const [cityData, setCityData] = useState<AQIData | null>(null);
  const [cityReadings, setCityReadings] = useState<OpenAQReading[]>([]);
  const [industrialSites, setIndustrialSites] = useState(0);
  const [cityLoading, setCityLoading] = useState(false);

  // City search handler
  async function handleSearch() {
    const city = searchInput.trim();
    if (!city) return;
    setSearchCity(city);
    setCityLoading(true);
    setCityData(null);
    setCityReadings([]);
    setIndustrialSites(0);
    try {
      const coords = await resolveCityCoords(city);
      const lat = coords?.[0] ?? 28.6;
      const lng = coords?.[1] ?? 77.2;
      const [aqiData, readings, siteCount] = await Promise.all([
        fetchAQIData(city, lat, lng),
        fetchOpenAQReadings(lat, lng, 30),
        fetchIndustrialSiteCount(lat, lng, 8000),
      ]);
      setCityData(aqiData);
      setCityReadings(readings.slice(0, 6));
      setIndustrialSites(siteCount);
    } catch (err) {
      console.error(err);
    } finally {
      setCityLoading(false);
    }
  }

  const radarData = cityData
    ? [
        { subject: "PM2.5", value: Math.min(cityData.pm25, 200) },
        { subject: "PM10",  value: Math.min(cityData.pm10, 200) },
        { subject: "NO₂",   value: Math.min(cityData.no2, 200) },
        { subject: "SO₂",   value: Math.min(cityData.so2, 200) },
        { subject: "CO",    value: Math.min(cityData.co * 10, 200) },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-orange-500/5 p-6 rounded-xl border border-orange-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Factory className="h-6 w-6 text-orange-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Regulatory Compliance & Enforcement Division</p>
        </div>
      </div>

      {/* Live City Pollution Search */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wind className="h-5 w-5 text-orange-500" />
            Live Industrial Pollution Monitor
            <Badge variant="outline" className="ml-auto text-[10px] text-green-500 border-green-500/40">OpenAQ Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search city (e.g. Kanpur, Surat, Ludhiana...)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="max-w-sm"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              {cityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>

          {cityLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching live data for {searchCity}...
            </div>
          )}

          {cityData && !cityLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "AQI", value: cityData.aqi, icon: <Wind className="h-4 w-4" />, color: getAQIColor(cityData.aqi) },
                  { label: "PM2.5 µg/m³", value: cityData.pm25, icon: <Flame className="h-4 w-4" />, color: "#f97316" },
                  { label: "SO₂ µg/m³", value: cityData.so2, icon: <Droplets className="h-4 w-4" />, color: "#8b5cf6" },
                  { label: "Industrial Sites", value: industrialSites, icon: <Factory className="h-4 w-4" />, color: "#06b6d4" },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: stat.color }}>
                      {stat.icon}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pollutant Radar — {searchCity}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
                      <Radar name="Pollution" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nearby Monitoring Stations</p>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {cityReadings.length === 0 && <p className="text-xs text-muted-foreground">No nearby stations found.</p>}
                    {cityReadings.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 text-xs">
                        <span className="font-medium truncate max-w-[160px]">{r.locationName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-muted-foreground">AQI</span>
                          <span className="font-bold" style={{ color: getAQIColor(r.aqi) }}>{r.aqi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Existing charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Compliance Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="compliant" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonCompliant" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Complaint Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={complaintData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                  {complaintData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-orange-500" />
          Regulatory Enforcement Suite
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <CardTitle className="text-base mb-1.5">{feature.title}</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-orange-500/30 bg-orange-500/5 hover:border-orange-500" onClick={() => navigate("/citizen-complaints/pollution")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-orange-500 bg-opacity-10">
                  <MessageCircle className="h-6 w-6 text-orange-500" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">New Reports</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-base mb-1.5 text-orange-600">Citizen Complaints</CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">View and respond to AI-categorized industrial pollution complaints from citizens.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IndustrialRegulationDashboard;
