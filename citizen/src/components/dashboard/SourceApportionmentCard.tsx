import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { fetchSourceAttribution, SourceAttributionResponse } from "@/lib/environmental";
import { Badge } from "@/components/ui/badge";

export function SourceApportionmentCard() {
  const { profile, loading: profileLoading } = useProfile();
  const [sourceData, setSourceData] = useState<SourceAttributionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (cityName: string) => {
    setLoading(true);
    const data = await fetchSourceAttribution(cityName);
    setSourceData(data);
    setLoading(false);
  };

  useEffect(() => {
    if (profileLoading) return;
    loadData(profile?.city || "New Delhi");
  }, [profile, profileLoading]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Local Source Apportionment</CardTitle>
          <div className="flex items-center gap-3">
            {sourceData && (
              <Badge variant="outline" className="text-[10px] uppercase">
                LIVE SENSORS
              </Badge>
            )}
            <button 
              onClick={() => loadData(profile?.city || "New Delhi")}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading || profileLoading || !sourceData ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
             <Loader2 className="h-8 w-8 animate-spin mb-4" />
             <p className="text-sm">Analyzing Local Infrastructure...</p>
             <p className="text-xs opacity-70 mt-2 text-center max-w-[250px]">Correlating satellite imagery with localized traffic data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sourceData.sources}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {sourceData.sources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}%`, 'Contribution']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
