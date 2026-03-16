import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Complaint } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { generateAndSaveResolutionPlan, ResolutionPlan } from '@/lib/resolutionPlan';
import {
  AlertCircle, MapPin, Clock, Mail, Loader2, Inbox,
  RefreshCw, Sparkles, ChevronDown, ChevronUp, CheckCircle2,
  Link2, ListChecks, Timer, Wrench, Mic, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const VOICE_BOT_URL = 'http://localhost:3000';

const DEPT_LABELS: Record<string, string> = {
  environment: 'Environment Department',
  water: 'Water Department',
  pollution: 'Pollution Department',
  agriculture: 'Agricultural Department',
  waste: 'Waste Department',
  forest: 'Forest Department',
  soil: 'Soil Conservation Department',
};

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  environment: { bg: 'bg-green-500/10', text: 'text-green-400' },
  water: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  pollution: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  agriculture: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  waste: { bg: 'bg-red-500/10', text: 'text-red-400' },
  forest: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  soil: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  assigned: { label: 'Assigned', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

interface ExtendedComplaint extends Complaint {
  resolution_plan?: string;
  resolution_steps?: ResolutionPlan['steps'];
  expected_timeline?: string;
  plan_generated_at?: string;
  plan_generated_by?: string;
}

interface CitizenComplaintsProps {
  department?: string;
}

interface VoiceBotComplaint {
  _id: string;
  complaint: string;
  location: string;
  contact: string;
  others: string;
  createdAt: string;
}

export default function CitizenComplaints({ department }: CitizenComplaintsProps) {
  const { dept: deptParam } = useParams<{ dept: string }>();
  const deptKey = department || deptParam || 'environment';
  const deptLabel = DEPT_LABELS[deptKey] ?? 'Environment Department';
  const colors = DEPT_COLORS[deptKey] ?? DEPT_COLORS.environment;

  const [complaints, setComplaints] = useState<ExtendedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null); // complaint id
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [livePlans, setLivePlans] = useState<Record<string, ResolutionPlan>>({});

  const [activeTab, setActiveTab] = useState<'supabase' | 'voice'>('supabase');
  const [voiceComplaints, setVoiceComplaints] = useState<VoiceBotComplaint[]>([]);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const fetchVoiceComplaints = async () => {
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const res = await fetch(`${VOICE_BOT_URL}/complaints`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setVoiceComplaints(data);
    } catch (e: any) {
      setVoiceError(e.message || 'Failed to load voice complaints');
    } finally {
      setVoiceLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('complaints')
        .select('*, resolution_plan, resolution_steps, expected_timeline, plan_generated_at, plan_generated_by')
        .eq('department', deptKey)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setComplaints(data ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [deptKey]);
  useEffect(() => { if (activeTab === 'voice') fetchVoiceComplaints(); }, [activeTab]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const togglePlan = (id: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGeneratePlan = async (complaint: ExtendedComplaint) => {
    setGeneratingPlan(complaint.id);
    try {
      const plan = await generateAndSaveResolutionPlan(complaint.id, {
        description: complaint.description,
        department: complaint.department,
        severity: complaint.severity,
        location: complaint.location,
        ai_analysis: complaint.ai_analysis,
        image_url: complaint.image_url,
        assigned_officer_name: complaint.assigned_officer_name,
        citizen_email: complaint.citizen_email,
      });
      setLivePlans(prev => ({ ...prev, [complaint.id]: plan }));
      setExpandedPlans(prev => new Set(prev).add(complaint.id));
      // Refresh to get updated status
      fetchComplaints();
      toast.success('Resolution plan generated and saved');
    } catch (e: any) {
      toast.error('Failed to generate plan: ' + e.message);
    } finally {
      setGeneratingPlan(null);
    }
  };

  const handleMarkResolved = async (complaint: ExtendedComplaint) => {
    try {
      const { error: err } = await supabase
        .from('complaints')
        .update({ status: 'resolved' })
        .eq('id', complaint.id);
      
      if (err) throw err;
      
      toast.success('Complaint marked as resolved');
      fetchComplaints();
    } catch (e: any) {
      toast.error('Failed to update status: ' + e.message);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const highSeverityCount = complaints.filter(c => c.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${colors.bg} rounded-xl border border-white/10 p-6`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className={`h-6 w-6 ${colors.text}`} />
              Citizen Complaints — {deptLabel}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review complaints and generate AI-powered resolution plans.
            </p>
          </div>
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: complaints.length },
            { label: 'Pending', value: pendingCount },
            { label: 'High Severity', value: highSeverityCount },
          ].map(s => (
            <div key={s.label} className="bg-background/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{loading ? '—' : s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'supabase'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Image Complaints
        </button>
        {deptKey === 'environment' && (
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'voice'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice Bot Complaints
            {voiceComplaints.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                {voiceComplaints.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Voice Bot Complaints Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={fetchVoiceComplaints}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {voiceLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading voice complaints...</p>
            </div>
          )}

          {voiceError && !voiceLoading && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive font-medium">{voiceError}</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure the complaint bot server is running on port 3000.</p>
              </CardContent>
            </Card>
          )}

          {!voiceLoading && !voiceError && voiceComplaints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">No voice complaints yet</p>
              <p className="text-sm text-muted-foreground">Complaints submitted via the voice bot will appear here.</p>
            </div>
          )}

          {!voiceLoading && voiceComplaints.length > 0 && (
            <div className="grid gap-4">
              {voiceComplaints.map((vc) => (
                <Card key={vc._id} className="border-border">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border">
                          #{vc._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(vc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed">{vc.complaint}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {vc.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vc.location}</span>
                      )}
                      {vc.contact && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{vc.contact}</span>
                      )}
                    </div>

                    {vc.others && (
                      <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2">
                        <span className="font-medium not-italic text-foreground">Additional info: </span>{vc.others}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Complaints Tab */}
      {activeTab === 'supabase' && (<>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading complaints...</p>
        </div>
      )}

      {error && !loading && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && complaints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">No complaints yet</p>
          <p className="text-sm text-muted-foreground">Complaints submitted by citizens will appear here.</p>
        </div>
      )}

      {!loading && complaints.length > 0 && (
        <div className="grid gap-4">
          {complaints.map((complaint) => {
            const sev = SEVERITY_CONFIG[complaint.severity] ?? SEVERITY_CONFIG.medium;
            const status = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.pending;
            const isGenerating = generatingPlan === complaint.id;
            const planExpanded = expandedPlans.has(complaint.id);
            // Use live plan if just generated, else use saved plan from DB
            const livePlan = livePlans[complaint.id];
            const hasPlan = !!livePlan || !!complaint.resolution_plan;
            const planSteps: ResolutionPlan['steps'] = livePlan?.steps ?? complaint.resolution_steps ?? [];
            const planSummary = livePlan?.summary ?? complaint.resolution_plan ?? '';
            const planTimeline = livePlan?.expected_timeline ?? complaint.expected_timeline ?? '';
            const planResources = livePlan?.resources_needed ?? [];
            const planRefs = livePlan?.references ?? [];
            const planBy = complaint.plan_generated_by;
            const planAt = complaint.plan_generated_at;

            return (
              <Card key={complaint.id} className="border-border overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex gap-4">
                    {complaint.image_url && (
                      <div
                        className="w-24 h-24 rounded-xl overflow-hidden border border-border shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(complaint.image_url)}
                      >
                        <img src={complaint.image_url} alt="Complaint" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${sev.className}`}>
                          {sev.label} Severity
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-full border border-border">
                          #{complaint.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">{complaint.description}</p>

                      {complaint.ai_analysis && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">
                          <span className="font-medium not-italic">AI: </span>{complaint.ai_analysis}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{complaint.citizen_email}</span>
                        {complaint.location && complaint.location !== 'Not specified' && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{complaint.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(complaint.created_at)}</span>
                      </div>

                      {complaint.assigned_officer_name && (
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {complaint.assigned_officer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground">
                            Assigned to: {complaint.assigned_officer_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    <button
                      onClick={() => handleGeneratePlan(complaint)}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                    >
                      {isGenerating
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating Plan...</>
                        : <><Sparkles className="w-3.5 h-3.5" />{hasPlan ? 'Regenerate Plan' : 'Generate Resolution Plan'}</>
                      }
                    </button>

                    {hasPlan && (
                      <button
                        onClick={() => togglePlan(complaint.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {planExpanded ? <><ChevronUp className="w-3.5 h-3.5" />Hide Plan</> : <><ChevronDown className="w-3.5 h-3.5" />View Plan</>}
                      </button>
                    )}

                    {complaint.status !== 'resolved' && (
                      <button
                        onClick={() => handleMarkResolved(complaint)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors ml-auto shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </button>
                    )}
                  </div>

                  {/* Resolution Plan Panel */}
                  {hasPlan && planExpanded && (
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-4">
                      {/* Plan header */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-violet-400 shrink-0" />
                          <span className="text-sm font-semibold text-foreground">Resolution Plan</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {planTimeline && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">
                              <Timer className="w-3 h-3" />{planTimeline}
                            </span>
                          )}
                          {planBy && <span>By: {planBy}</span>}
                          {planAt && <span>{formatDate(planAt)}</span>}
                        </div>
                      </div>

                      {/* Summary */}
                      {planSummary && (
                        <p className="text-sm text-foreground/90 leading-relaxed">{planSummary}</p>
                      )}

                      {/* Steps */}
                      {planSteps.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Steps</p>
                          <div className="space-y-2">
                            {planSteps.map((step, i) => (
                              <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                                <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-violet-400">{step.step}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{step.duration}</span>
                                      <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{step.responsible}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {planResources.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resources Needed</p>
                          <div className="flex flex-wrap gap-2">
                            {planResources.map((r, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-background/60 border border-border text-muted-foreground">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* References */}
                      {planRefs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Web References</p>
                          <div className="space-y-1">
                            {planRefs.map((ref, i) => (
                              <a
                                key={i}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                              >
                                <Link2 className="w-3 h-3 shrink-0" />
                                <span className="line-clamp-1">{ref.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-violet-400/70 pt-1 border-t border-violet-500/10">
                        <CheckCircle2 className="w-3 h-3" />
                        This plan is visible to the citizen for transparency.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </>)}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={selectedImage} alt="Complaint evidence" className="w-full rounded-xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-sm"
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
