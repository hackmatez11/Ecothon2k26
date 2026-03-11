import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MessageCircle, AlertTriangle, CheckCircle, ShieldCheck, Zap, Gavel, Search } from "lucide-react";
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
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-2">
            <Search className="h-4 w-4" /> Schedule Inspection
          </button>
          <button className="px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors shadow-sm flex items-center gap-2">
            <Gavel className="h-4 w-4" /> Issue Citation
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Regulated Industries", value: "57", sub: "All monitored", icon: Factory, color: "text-orange-500" },
          { title: "Compliance Rate", value: "91%", sub: "+3% this month", icon: ShieldCheck, color: "text-green-500" },
          { title: "Active Complaints", value: "342", sub: "28 today", icon: MessageCircle, color: "text-blue-500" },
          { title: "Violations", value: "12", sub: "This week", icon: AlertTriangle, color: "text-red-500" },
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">{card.title}</span>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
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
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Critical Enforcement Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { company: "ABC Manufacturing", action: "Notice Issued", date: "2 hours ago", status: "pending", priority: "high" },
              { company: "XYZ Chemicals", action: "Fine Imposed", date: "5 hours ago", status: "completed", priority: "critical" },
              { company: "PQR Industries", action: "Inspection Scheduled", date: "1 day ago", status: "scheduled", priority: "low" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    item.priority === 'critical' ? 'bg-red-100' : 'bg-muted'
                  }`}>
                    <Factory className={`h-5 w-5 ${
                      item.priority === 'critical' ? 'text-red-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.company}</p>
                    <p className="text-sm text-muted-foreground">{item.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{item.date}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-700' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustrialRegulationDashboard;
