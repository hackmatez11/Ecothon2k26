import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MessageCircle, AlertTriangle, CheckCircle, ShieldCheck, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";

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

const IndustrialRegulationDashboard = () => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === "Industrial Regulation Department")!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-orange-500/5 p-6 rounded-xl border border-orange-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Factory className="h-6 w-6 text-orange-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Regulatory Compliance & Enforcement Division</p>
        </div>
      </div>


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
