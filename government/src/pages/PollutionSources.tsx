import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchSourceAttribution, fetchControlPlan, SourceAttributionResponse, ControlPlanItem } from "@/lib/environmental";


const COMPARISON_CITIES = ["Delhi", "Mumbai", "Kolkata", "Chennai"];

const PollutionSources = () => {
  const [city, setCity] = useState("Delhi");
  const [searchInput, setSearchInput] = useState("Delhi");
  const [sourceData, setSourceData] = useState<SourceAttributionResponse | null>(null);
  const [cityData, setCityData] = useState<any[] | null>(null);
  const [actions, setActions] = useState<ControlPlanItem[] | null>(null);

  useEffect(() => {
    async function loadData() {
      setSourceData(null);
      setCityData(null);
      setActions(null);
      
      // Load current city pie chart data
      const data = await fetchSourceAttribution(city);
      setSourceData(data);
      if (data && data.sources) {
        // Load AI generated control plans
        const planData = await fetchControlPlan(city, data.sources);
        setActions(planData);
      }

      // Load comparison bar chart data for multiple cities concurrently
      const comparisonPromises = COMPARISON_CITIES.map(c => fetchSourceAttribution(c));
      const comparisonResults = await Promise.all(comparisonPromises);
      
      const mappedCityData = comparisonResults.map((res, index) => {
        if (!res) return null;
        return {
          city: COMPARISON_CITIES[index],
          vehicles: res.sources.find(s => s.name === "Vehicular Traffic")?.value || 0,
          factories: res.sources.find(s => s.name === "Industrial Emissions")?.value || 0,
          construction: res.sources.find(s => s.name === "Dust & Construction")?.value || 0,
          burning: res.sources.find(s => s.name === "Waste Burning")?.value || 0,
        };
      }).filter(Boolean);
      
      setCityData(mappedCityData);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pollution Source Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed breakdown for {city}</p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-9 w-48" 
                placeholder="Enter city..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="flex items-center gap-1">
              <Search className="h-4 w-4" />
              Analyze City
            </Button>
          </form>
          <Button><Plus className="mr-2 h-4 w-4" /> Create Control Plan</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Source Distribution</CardTitle>
              {sourceData && (
                 <Badge variant="outline" className="text-[10px] uppercase">
                   LIVE ANALYSIS
                 </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!sourceData ? (
               <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                 <Loader2 className="h-8 w-8 animate-spin mb-4" />
                 <p className="text-sm">Analyzing Local Source Apportionment...</p>
                 <p className="text-xs opacity-70 mt-2 text-center max-w-[200px]">Querying OpenStreetMap landuse & TomTom traffic</p>
               </div>
            ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={sourceData.sources} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={4}>
                        {sourceData.sources.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(value) => [`${value}%`, 'Contribution']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 mt-6">
                    {sourceData.sources.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-sm group cursor-help">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full shadow-sm" style={{ background: s.color }} />
                          <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">{s.name}</span>
                        </div>
                        <span className="font-bold text-foreground text-base">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">City-wise Breakdown</CardTitle>
              {cityData && (
                 <Badge variant="outline" className="text-[10px] uppercase">
                   LIVE ANALYSIS
                 </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!cityData ? (
               <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                 <Loader2 className="h-8 w-8 animate-spin mb-4" />
                 <p className="text-sm">Fetching Inter-city Apportionment Data...</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="city" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="vehicles" fill="#ef4444" name="Vehicles" stackId="a" />
                  <Bar dataKey="factories" fill="#f97316" name="Factories" stackId="a" />
                  <Bar dataKey="construction" fill="#eab308" name="Construction" stackId="a" />
                  <Bar dataKey="burning" fill="#8b5cf6" name="Burning" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Recommended Control Plans</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!actions ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
               <Loader2 className="h-8 w-8 animate-spin mb-4" />
               <p className="text-sm">Analyzing pollution source data...</p>
               <p className="text-xs opacity-70 mt-2 text-center max-w-[250px]">Generating optimal mitigation strategies based on Live Data</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
               <p className="text-sm">Action generation failed. Please try again later.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">{a.action}</p>
                    <p className="text-sm text-muted-foreground">Targeting Source: <span className="font-semibold">{a.source}</span></p>
                  </div>
                  <span className={`gov-badge shrink-0 ms-4 ${a.status === "Active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PollutionSources;
