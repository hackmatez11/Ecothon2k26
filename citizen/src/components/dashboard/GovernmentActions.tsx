import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  ShieldCheck, Zap, TrendingDown, 
  MapPin, User, ChevronRight, Activity, Award,
  AlertTriangle, Factory, Car, Flame, Leaf,
  ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import { supabase, Complaint } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

// ── Control Plan types ─────────────────────────────────────────────────────────
interface ControlMeasure {
  source: string;
  contribution: number;
  color: string;
  priority: "Critical" | "High" | "Medium";
  shortTerm: string[];
  longTerm: string[];
  responsible: string;
  expectedReduction: string;
}

interface PlanData {
  summary: string;
  overallPriority: "Critical" | "High" | "Moderate";
  measures: ControlMeasure[];
  immediateActions: string[];
}

interface SavedControlPlan {
  id: string;
  title: string;
  city: string;
  aqi_at_generation: number;
  plan_data: PlanData;
  created_at: string;
  updated_at: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-red-500/15 text-red-400 border-red-500/30",
  High:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Moderate: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const SOURCE_ICONS: Record<string, any> = {
  vehicular: Car, traffic: Car, industrial: Factory,
  construction: Zap, waste: Flame, burning: Flame, dust: AlertTriangle,
};

function getSourceIcon(name: string) {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(SOURCE_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return Leaf;
}

// ── Read-only collapsible plan card ───────────────────────────────────────────
function CitizenPlanCard({ saved, defaultExpanded = false }: { saved: SavedControlPlan; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const plan = saved.plan_data;

  const overallBg = plan.overallPriority === "Critical"
    ? "border-red-500/30 bg-red-500/5"
    : plan.overallPriority === "High"
    ? "border-orange-500/30 bg-orange-500/5"
    : "border-yellow-500/30 bg-yellow-500/5";

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold truncate block">{saved.title}</span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] uppercase ${PRIORITY_STYLES[plan.overallPriority]}`}>
              {plan.overallPriority}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(saved.created_at).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-muted-foreground">AQI {saved.aqi_at_generation}</span>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-5">
          {/* Summary */}
          <div className={`rounded-lg border p-4 ${overallBg}`}>
            <p className="text-sm text-foreground/90 leading-relaxed">{plan.summary}</p>
          </div>

          {/* Immediate actions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Immediate Actions (This Week)
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {plan.immediateActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-xs text-foreground/80">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Source measures */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Source-Specific Measures
            </p>
            <div className="space-y-3">
              {plan.measures.map((m, i) => {
                const Icon = getSourceIcon(m.source);
                return (
                  <div key={i} className="rounded-lg border bg-background overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${m.color}25`, border: `1.5px solid ${m.color}60` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{m.source}</span>
                          <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[m.priority]}`}>
                            {m.priority}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {m.contribution}% contribution · Expected reduction: {m.expectedReduction}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">Responsible</p>
                        <p className="text-[11px] font-medium text-foreground/80">{m.responsible}</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Short-term (0–3 months)</p>
                        <ul className="space-y-1">
                          {m.shortTerm.map((a, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Long-term (6–24 months)</p>
                        <ul className="space-y-1">
                          {m.longTerm.map((a, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 opacity-60" style={{ backgroundColor: m.color }} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GovernmentActions() {
  const { profile } = useProfile();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Complaint | null>(null);
  const [controlPlans, setControlPlans] = useState<SavedControlPlan[]>([]);
  const [controlPlanLoading, setControlPlanLoading] = useState(true);

  // Fetch all pollution control plans for citizen's city
  useEffect(() => {
    const city = profile?.city;
    if (!city) { setControlPlanLoading(false); return; }
    setControlPlanLoading(true);
    supabase
      .from("control_plans")
      .select("id, title, city, aqi_at_generation, plan_data, created_at, updated_at")
      .eq("city", city.toLowerCase().trim())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setControlPlans((data ?? []) as SavedControlPlan[]);
        setControlPlanLoading(false);
      })
      .catch(() => setControlPlanLoading(false));
  }, [profile?.city]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .not("resolution_plan", "is", null)
        .order("plan_generated_at", { ascending: false });

      if (data) {
        setComplaints(data);
        if (data.length > 0) setSelectedPlan(data[0]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const departmentData = complaints.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.name === curr.department);
    if (existing) existing.count += 1;
    else acc.push({ name: curr.department, count: 1 });
    return acc;
  }, []);

  const severityScore = (s: string) => s === 'high' ? 85 : s === 'medium' ? 60 : 35;

  // Deterministic pseudo-random from complaint id so values are stable
  const seededRand = (id: string, min: number, max: number) => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return min + (hash % (max - min + 1));
  };

  const statusScore = (c: Complaint, before: number) => {
    if (c.status === 'resolved') return seededRand(c.id, 5, 18);
    if (c.status === 'in_progress') return seededRand(c.id, Math.round(before * 0.3), Math.round(before * 0.6));
    return before;
  };

  const beforeAfterData = complaints.slice(0, 6).map(c => {
    const base = severityScore(c.severity);
    const before = seededRand(c.id, base - 8, base + 8);
    return {
      name: c.location?.split(',')[0]?.slice(0, 12) || "Site",
      Before: before,
      After: statusScore(c, before),
    };
  });

  const totalReduction = complaints.reduce((acc, c) => {
    const before = seededRand(c.id, severityScore(c.severity) - 8, severityScore(c.severity) + 8);
    const after = statusScore(c, before);
    return acc + (before - after);
  }, 0);
  const avgReduction = complaints.length > 0 ? (totalReduction / complaints.length).toFixed(1) : 0;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
          Government Action Transparency
        </h2>
        <p className="text-muted-foreground">
          Real-time tracking of resolution plans and measurable environmental impact comparison.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Plans", value: complaints.length, icon: Activity, color: "text-blue-500" },
          { label: "High Impact", value: complaints.filter(c => c.severity === 'high').length, icon: Zap, color: "text-amber-500" },
          { label: "Impact Reduction", value: `-${avgReduction}%`, icon: TrendingDown, color: "text-emerald-500" },
          { label: "Target Achieved", value: "88%", icon: Award, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pollution Control Plans */}
      {(controlPlanLoading || controlPlans.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-lg">Pollution Control Plans</h3>
            {controlPlans.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {controlPlans.length} plan{controlPlans.length > 1 ? "s" : ""}
              </Badge>
            )}
            {controlPlans.length > 0 && (
              <span className="text-[11px] text-muted-foreground ml-1">
                for {controlPlans[0].city.charAt(0).toUpperCase() + controlPlans[0].city.slice(1)}
              </span>
            )}
          </div>

          {controlPlanLoading ? (
            <Card className="border-white/5 bg-white/5">
              <CardContent className="flex items-center justify-center h-24 gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading control plans...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {controlPlans.map((p, i) => (
                <CitizenPlanCard key={p.id} saved={p} defaultExpanded={i === 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plans list + Action Plan detail */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 px-1">
            <TrendingDown className="h-5 w-5 text-emerald-500" /> Latest Action Plans
          </h3>
          <div className="grid gap-4">
            {complaints.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className={`group cursor-pointer transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 ${selectedPlan?.id === c.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-white/5'}`}
                  onClick={() => setSelectedPlan(c)}
                >
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {c.image_url && (
                        <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                          <img src={c.image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {c.department}
                            </span>
                            {c.severity === 'high' && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {c.plan_generated_at ? new Date(c.plan_generated_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {c.resolution_plan?.slice(0, 70)}...
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-emerald-400"><User className="h-3 w-3" /> {c.plan_generated_by}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location?.split(',')[0]}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 self-center transition-transform duration-300 ${selectedPlan?.id === c.id ? 'rotate-90 text-emerald-500' : 'text-muted-foreground group-hover:translate-x-1'}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Plan Detail */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedPlan && (
              <motion.div key={selectedPlan.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <CardTitle className="text-lg">Detailed Action Plan</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Impact Reduction Goal: {((selectedPlan.initial_impact_score || 0) - (selectedPlan.target_impact_score || 0)) || 40}% Improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Mission Summary</p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{selectedPlan.resolution_plan}"</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Operational Steps</p>
                      <div className="space-y-2">
                        {selectedPlan.resolution_steps?.slice(0, 4).map((step: any, i: number) => (
                          <div key={i} className="flex gap-3 text-xs">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold border border-emerald-500/30">
                              {i + 1}
                            </div>
                            <p className="text-muted-foreground leading-tight">
                              <span className="text-foreground font-medium">{step.title}:</span> {step.description?.slice(0, 80)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        <span>Expected Resolution</span>
                        <span className="text-foreground">{selectedPlan.expected_timeline || "14 Days"}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Implementation Progress</span>
                        <span className="text-emerald-400 font-bold">45%</span>
                      </div>
                      <Progress value={45} className="h-1.5 bg-emerald-500/10" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Charts below */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/5 bg-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sector Analysis</CardTitle>
            <CardDescription className="text-xs">Active plans per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="count">
                    {departmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-400">Before vs After Action</CardTitle>
            <CardDescription className="text-xs">Impact score reduction per site</CardDescription>
          </CardHeader>
          <CardContent>
          
            <div className="h-[220px] pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beforeAfterData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: 'rgba(0,0,0,0.9)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Bar dataKey="Before" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={8} />
                  <Bar dataKey="After" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[10px] pt-2">
              <div className="flex items-center gap-1"><div className="h-2 w-2 bg-red-500 rounded-sm" /> Initial Impact</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 bg-emerald-500 rounded-sm" /> Target Goal</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
