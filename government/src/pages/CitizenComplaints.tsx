import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Complaint } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Clock, Mail, Loader2, Inbox, RefreshCw } from 'lucide-react';

const DEPT_LABELS: Record<string, string> = {
  environment: 'Environment Department',
  water: 'Water Department',
  pollution: 'Pollution Department',
  agriculture: 'Agricultural Department',
  waste: 'Waste Department',
  forest: 'Forest Department',
  soil: 'Soil Conservation Department',
};

const DEPT_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  environment: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300 border-green-500/30' },
  water: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  pollution: { bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  agriculture: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  waste: { bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  forest: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  soil: { bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  high: { label: 'High', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

interface CitizenComplaintsProps {
  department?: string;
}

export default function CitizenComplaints({ department }: CitizenComplaintsProps) {
  const { dept: deptParam } = useParams<{ dept: string }>();
  const deptKey = department || deptParam || 'environment';
  const deptLabel = DEPT_LABELS[deptKey] ?? 'Environment Department';
  const colors = DEPT_COLORS[deptKey] ?? DEPT_COLORS.environment;

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('complaints')
        .select('*')
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
              Complaints submitted by citizens and auto-routed to this department by AI analysis.
            </p>
          </div>
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Summary Stats */}
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading complaints...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Check Supabase connection and RLS policies.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && complaints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">No complaints yet</p>
          <p className="text-sm text-muted-foreground">Complaints submitted by citizens will appear here.</p>
        </div>
      )}

      {/* Complaints List */}
      {!loading && complaints.length > 0 && (
        <div className="grid gap-4">
          {complaints.map((complaint) => {
            const sev = SEVERITY_CONFIG[complaint.severity] ?? SEVERITY_CONFIG.medium;
            const status = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.pending;

            return (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow border-border">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Image thumbnail */}
                    {complaint.image_url && (
                      <div
                        className="w-24 h-24 rounded-xl overflow-hidden border border-border shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(complaint.image_url)}
                      >
                        <img src={complaint.image_url} alt="Complaint" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Badges */}
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

                      {/* Description */}
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">{complaint.description}</p>

                      {/* AI Analysis */}
                      {complaint.ai_analysis && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">
                          <span className="font-medium text-muted-foreground/80 not-italic">AI: </span>
                          {complaint.ai_analysis}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {complaint.citizen_email}
                        </span>
                        {complaint.location && complaint.location !== 'Not specified' && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {complaint.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(complaint.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
