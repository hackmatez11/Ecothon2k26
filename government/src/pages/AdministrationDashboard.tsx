import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Wallet, TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { departments } from "@/lib/departments";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";

const budgetData = [
  { month: "Jan", allocated: 450, spent: 380 },
  { month: "Feb", allocated: 420, spent: 390 },
  { month: "Mar", allocated: 480, spent: 410 },
  { month: "Apr", allocated: 460, spent: 420 },
  { month: "May", allocated: 490, spent: 445 },
  { month: "Jun", allocated: 510, spent: 460 },
];

const taskData = [
  { name: "Completed", value: 156, color: "#22c55e" },
  { name: "In Progress", value: 89, color: "#3b82f6" },
  { name: "Pending", value: 45, color: "#f59e0b" },
  { name: "Overdue", value: 12, color: "#ef4444" },
];

const AdministrationDashboard = () => {
  const navigate = useNavigate();
  const deptData = departments.find(d => d.title === "Administration Department")!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-500/5 p-6 rounded-xl border border-purple-500/20">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-500" />
            {deptData.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">NEMAP Operational & Resource Administration</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Generate Report
          </button>
          <button className="px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> Manage Staff
          </button>
          <ChangePasswordButton deptPath="/administration" deptName="Administration Department" />
        </div>
      </div>


      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg font-bold">Budget Execution (Monthly)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="allocated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-bold">Operational Task Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={taskData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={4}>
                  {taskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {taskData.map((s) => (
                <div key={s.name} className="flex flex-col p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          Administrative Workflow Suite
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-purple-500/10">
          <CardHeader className="bg-purple-500/5"><CardTitle className="text-lg">Recent Administrative Feed</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { activity: "Budget allocation approved", dept: "Environmental", time: "2 hours ago", icon: Wallet, status: "success" },
                { activity: "Task assignment completed", dept: "Water Resources", time: "4 hours ago", icon: CheckCircle, status: "info" },
                { activity: "Personnel audit initiated", dept: "Industrial Reg.", time: "6 hours ago", icon: Users, status: "warning" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{item.activity}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{item.dept}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/10">
          <CardHeader className="bg-red-500/5"><CardTitle className="text-lg text-red-600">Priority Overdue Tasks</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { task: "Quarterly budget review", deadline: "Exp. 2d ago", priority: "critical", dept: "Admin" },
                { task: "Personnel health audit", deadline: "Exp. 5h ago", priority: "high", dept: "Forestry" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-bold text-sm text-red-950">{item.task}</p>
                      <p className="text-[10px] text-red-600 font-bold uppercase">{item.dept}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded">{item.deadline}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdministrationDashboard;
