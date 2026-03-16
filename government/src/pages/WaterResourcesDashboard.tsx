import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Ship, AlertTriangle, Activity, MessageCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";

const waterQualityData = [
  { month: "Jan", quality: 72, contamination: 28 },
  { month: "Feb", quality: 75, contamination: 25 },
  { month: "Mar", quality: 68, contamination: 32 },
  { month: "Apr", quality: 70, contamination: 30 },
  { month: "May", quality: 65, contamination: 35 },
  { month: "Jun", quality: 62, contamination: 38 },
  { month: "Jul", quality: 60, contamination: 40 },
  { month: "Aug", quality: 64, contamination: 36 },
  { month: "Sep", quality: 69, contamination: 31 },
  { month: "Oct", quality: 73, contamination: 27 },
  { month: "Nov", quality: 76, contamination: 24 },
  { month: "Dec", quality: 78, contamination: 22 },
];

const spillData = [
  { month: "Jan", spills: 3 }, { month: "Feb", spills: 2 }, { month: "Mar", spills: 4 },
  { month: "Apr", spills: 1 }, { month: "May", spills: 3 }, { month: "Jun", spills: 5 },
  { month: "Jul", spills: 2 }, { month: "Aug", spills: 3 }, { month: "Sep", spills: 1 },
  { month: "Oct", spills: 2 }, { month: "Nov", spills: 3 }, { month: "Dec", spills: 2 },
];

const WaterResourcesDashboard = () => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === "Water Resources Department")!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-500/5 p-6 rounded-xl border border-blue-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Water Quality & Resource Management</p>
        </div>
      </div>


      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Water Quality Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={waterQualityData}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Area type="monotone" dataKey="quality" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorQuality)" strokeWidth={3} />
                <Area type="monotone" dataKey="contamination" stroke="hsl(var(--destructive))" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Oil Spill Incidents</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spillData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="spills" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-500" />
          Hydrological Monitoring Tools
        </h2>
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
                <CardTitle className="text-base mb-1.5">{feature.title}</CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
          
          <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-blue-500/30 bg-blue-500/5 hover:border-blue-500" onClick={() => navigate("/citizen-complaints/water")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-blue-500 bg-opacity-10">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">New Reports</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-base mb-1.5 text-blue-600">Citizen Complaints</CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">View and respond to AI-categorized water pollution reports from citizens.</p>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default WaterResourcesDashboard;
