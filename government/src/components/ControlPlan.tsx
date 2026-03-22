import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2, ShieldCheck, AlertTriangle, Zap, Leaf,
  Factory, Car, Flame, Pencil, Save, X, Sparkles,
  Plus, Trash2, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import { SourceData } from "@/lib/environmental";
import { supabase } from "@/lib/supabase";

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface ControlPlanProps {
  aqi: number;
  city: string;
  sources: SourceData[];
}

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

interface SavedPlan {
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

async function generatePlanFromGroq(aqi: number, city: string, sources: SourceData[]): Promise<PlanData> {
  const sourceList = sources.map(s => `${s.name}: ${s.value}%`).join(", ");
  const topSource = sources[0];
  const aqiLabel = aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for Sensitive Groups" : aqi <= 200 ? "Unhealthy" : aqi <= 300 ? "Very Unhealthy" : "Hazardous";

  const prompt = `You are an environmental policy expert. Generate a detailed pollution control plan for ${city}.

Current AQI: ${aqi} (${aqiLabel})
Pollution Sources: ${sourceList}
Top Contributor: ${topSource?.name} at ${topSource?.value}%

Return ONLY valid JSON (no markdown, no explanation):
{
  "summary": "2-sentence executive summary of the pollution situation and urgency",
  "overallPriority": "Critical|High|Moderate",
  "immediateActions": ["action1", "action2", "action3"],
  "measures": [
    {
      "source": "source name",
      "contribution": percentage_number,
      "color": "hex color from input",
      "priority": "Critical|High|Medium",
      "shortTerm": ["action1", "action2"],
      "longTerm": ["action1", "action2"],
      "responsible": "government body or agency",
      "expectedReduction": "e.g. 15-20% in 6 months"
    }
  ]
}
Rules: include a measure per source, shortTerm=0-3 months, longTerm=6-24 months, max 12 words per action.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]) as PlanData;
}

// ── Supabase helpers ───────────────────────────────────────────────────────────
async function fetchAllPlans(city: string): Promise<SavedPlan[]> {
  const { data, error } = await supabase
    .from("control_plans")
    .select("id, title, city, aqi_at_generation, plan_data, created_at, updated_at")
    .eq("city", city.toLowerCase().trim())
    .order("created_at", { ascending: false });
  if (error) { console.warn("control_plans fetch:", error.message); return []; }
  return (data ?? []) as SavedPlan[];
}

async function insertPlan(city: string, aqi: number, title: string, plan: PlanData): Promise<SavedPlan> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("control_plans")
    .insert({ city: city.toLowerCase().trim(), aqi_at_generation: aqi, title, plan_data: plan, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SavedPlan;
}

async function updatePlan(id: string, title: string, plan: PlanData): Promise<void> {
  const { error } = await supabase
    .from("control_plans")
    .update({ title, plan_data: plan, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("control_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Editable list helper ───────────────────────────────────────────────────────
function EditableList({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }} className="h-7 text-xs" />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="text-[11px] text-primary hover:underline">+ Add</button>
    </div>
  );
}

// ── Single plan card (expanded view with edit) ─────────────────────────────────
function PlanCard({
  saved,
  onUpdated,
  onDeleted,
  defaultExpanded = false,
}: {
  saved: SavedPlan;
  onUpdated: (p: SavedPlan) => void;
  onDeleted: (id: string) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanData | null>(null);
  const [draftTitle, setDraftTitle] = useState(saved.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const plan = saved.plan_data;
  const displayPlan = editing ? draft! : plan;

  const overallBg = displayPlan?.overallPriority === "Critical"
    ? "border-red-500/30 bg-red-500/5"
    : displayPlan?.overallPriority === "High"
    ? "border-orange-500/30 bg-orange-500/5"
    : "border-yellow-500/30 bg-yellow-500/5";

  const handleEdit = () => {
    setDraft(JSON.parse(JSON.stringify(plan)));
    setDraftTitle(saved.title);
    setEditing(true);
    setMsg(null);
    setExpanded(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updatePlan(saved.id, draftTitle, draft);
      onUpdated({ ...saved, title: draftTitle, plan_data: draft, updated_at: new Date().toISOString() });
      setEditing(false);
      setDraft(null);
      setMsg("Saved.");
    } catch {
      setMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete plan "${saved.title}"?`)) return;
    setDeleting(true);
    try {
      await deletePlan(saved.id);
      onDeleted(saved.id);
    } catch {
      setMsg("Delete failed.");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => !editing && setExpanded(e => !e)}
      >
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="h-7 text-sm font-semibold w-64"
            />
          ) : (
            <span className="text-sm font-semibold truncate">{saved.title}</span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
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
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {editing ? (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setEditing(false); setDraft(null); }}>
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleEdit}>
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-5">
          {msg && (
            <div className={`rounded px-3 py-1.5 text-xs ${msg.includes("aved") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {msg}
            </div>
          )}

          {/* Summary */}
          <div className={`rounded-lg border p-4 ${overallBg}`}>
            {editing ? (
              <Textarea value={draft!.summary} onChange={e => setDraft(d => d ? { ...d, summary: e.target.value } : d)}
                className="text-sm min-h-[60px] bg-transparent border-0 p-0 resize-none focus-visible:ring-0" />
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed">{displayPlan.summary}</p>
            )}
          </div>

          {/* Immediate actions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Immediate Actions (This Week)</h4>
            {editing ? (
              <EditableList items={draft!.immediateActions} onChange={v => setDraft(d => d ? { ...d, immediateActions: v } : d)} />
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {displayPlan.immediateActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-xs text-foreground/80">{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Source measures */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Source-Specific Control Measures</h4>
            <div className="space-y-3">
              {displayPlan.measures.map((m, i) => {
                const Icon = getSourceIcon(m.source);
                const dm = editing ? draft!.measures[i] : m;
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
                          <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLES[m.priority]}`}>{m.priority}</Badge>
                        </div>
                        {editing ? (
                          <div className="flex gap-2 mt-1">
                            <Input value={dm.responsible} onChange={e => setDraft(d => { if (!d) return d; const ms = [...d.measures]; ms[i] = { ...ms[i], responsible: e.target.value }; return { ...d, measures: ms }; })} placeholder="Responsible body" className="h-6 text-[11px]" />
                            <Input value={dm.expectedReduction} onChange={e => setDraft(d => { if (!d) return d; const ms = [...d.measures]; ms[i] = { ...ms[i], expectedReduction: e.target.value }; return { ...d, measures: ms }; })} placeholder="Expected reduction" className="h-6 text-[11px]" />
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{m.contribution}% contribution · Expected reduction: {m.expectedReduction}</p>
                        )}
                      </div>
                      {!editing && (
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">Responsible</p>
                          <p className="text-[11px] font-medium text-foreground/80">{m.responsible}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Short-term (0–3 months)</p>
                        {editing ? (
                          <EditableList items={dm.shortTerm} onChange={v => setDraft(d => { if (!d) return d; const ms = [...d.measures]; ms[i] = { ...ms[i], shortTerm: v }; return { ...d, measures: ms }; })} />
                        ) : (
                          <ul className="space-y-1">{m.shortTerm.map((a, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />{a}
                            </li>
                          ))}</ul>
                        )}
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Long-term (6–24 months)</p>
                        {editing ? (
                          <EditableList items={dm.longTerm} onChange={v => setDraft(d => { if (!d) return d; const ms = [...d.measures]; ms[i] = { ...ms[i], longTerm: v }; return { ...d, measures: ms }; })} />
                        ) : (
                          <ul className="space-y-1">{m.longTerm.map((a, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-foreground/80">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 opacity-60" style={{ backgroundColor: m.color }} />{a}
                            </li>
                          ))}</ul>
                        )}
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

// ── Main component ─────────────────────────────────────────────────────────────
export function ControlPlan({ aqi, city, sources }: ControlPlanProps) {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    fetchAllPlans(city)
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city]);

  const handleGenerate = async () => {
    if (!sources.length) return;
    const title = newTitle.trim() || `Plan ${new Date().toLocaleDateString()} – AQI ${aqi}`;
    setGenerating(true);
    setError(null);
    try {
      const planData = await generatePlanFromGroq(aqi, city, sources);
      const saved = await insertPlan(city, aqi, title, planData);
      setPlans(prev => [saved, ...prev]);
      setNewTitle("");
      setShowNewForm(false);
    } catch {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Pollution Control Plans</CardTitle>
            {plans.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{plans.length} plan{plans.length > 1 ? "s" : ""}</Badge>
            )}
          </div>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowNewForm(v => !v)}
            disabled={generating}
          >
            <Plus className="h-3 w-3" /> New Plan
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* New plan form */}
        {showNewForm && (
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Control Plan</p>
            <div className="flex gap-2">
              <Input
                placeholder={`Plan title (e.g. "Summer 2026 – Vehicular Focus")`}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="h-8 text-sm flex-1"
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
              />
              <Button size="sm" className="h-8 gap-1.5 shrink-0" onClick={handleGenerate} disabled={generating || !sources.length}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowNewForm(false); setNewTitle(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Will analyze current AQI ({aqi}) and {sources.length} pollution sources for {city}.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading plans...</span>
          </div>
        )}

        {!loading && plans.length === 0 && !showNewForm && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
            <ShieldCheck className="h-10 w-10 opacity-20" />
            <p className="text-sm">No control plans for {city} yet.</p>
            <p className="text-xs opacity-60">Click "New Plan" to generate one using live AQI and source data.</p>
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div className="space-y-3">
            {plans.map((p, i) => (
              <PlanCard
                key={p.id}
                saved={p}
                defaultExpanded={i === 0}
                onUpdated={updated => setPlans(prev => prev.map(x => x.id === updated.id ? updated : x))}
                onDeleted={id => setPlans(prev => prev.filter(x => x.id !== id))}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
