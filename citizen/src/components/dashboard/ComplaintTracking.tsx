import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Inbox, MapPin, Clock, Mail, User, Briefcase, RefreshCw, AlertCircle } from "lucide-react";

interface Complaint {
  id: string;
  description: string;
  department: string;
  severity: "low" | "medium" | "high";
  status: string;
  location: string;
  created_at: string;
  assigned_officer_name: string | null;
  assignment_reason: string | null;
  assigned_officer_id: string | null;
}

interface OfficerDetail {
  email: string;
  designation: string;
  phone: string | null;
}

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-green-500/10 text-green-600 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  high: "bg-red-500/10 text-red-600 border-red-500/30",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-500/10 text-gray-500 border-gray-400/30",
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  resolved: "bg-green-500/10 text-green-600 border-green-500/30",
};

const DEPT_LABEL: Record<string, string> = {
  environment: "Environment",
  water: "Water Resources",
  pollution: "Industrial Regulation",
  agriculture: "Agriculture",
  waste: "Waste",
  forest: "Forest",
  soil: "Soil Conservation",
};

export function ComplaintTracking() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officerDetails, setOfficerDetails] = useState<Record<string, OfficerDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("complaints")
        .select("id, description, department, severity, status, location, created_at, assigned_officer_name, assignment_reason, assigned_officer_id")
        .eq("citizen_email", user.email)
        .order("created_at", { ascending: false });

      if (err) throw err;
      const list = data ?? [];
      setComplaints(list);

      // Fetch officer details for all assigned complaints
      const officerIds = [...new Set(list.map(c => c.assigned_officer_id).filter(Boolean))] as string[];
      if (officerIds.length > 0) {
        const { data: officers } = await supabase
          .from("officers")
          .select("id, email, designation, phone")
          .in("id", officerIds);

        if (officers) {
          const map: Record<string, OfficerDetail> = {};
          officers.forEach(o => { map[o.id] = { email: o.email, designation: o.designation, phone: o.phone }; });
          setOfficerDetails(map);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [user?.email]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-emerald-500" />
            My Complaints
          </CardTitle>
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading your complaints...</span>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Inbox className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No complaints submitted yet</p>
            <p className="text-xs">Your submitted complaints will appear here.</p>
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div className="space-y-4">
            {complaints.map(c => {
              const officer = c.assigned_officer_id ? officerDetails[c.assigned_officer_id] : null;
              return (
                <div key={c.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{c.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.medium}`}>
                        {c.severity} severity
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[c.status] ?? STATUS_STYLE.pending}`}>
                        {c.status.replace("_", " ")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-background text-muted-foreground">
                        {DEPT_LABEL[c.department] ?? c.department}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground leading-relaxed line-clamp-2">{c.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {c.location && c.location !== "Not specified" && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(c.created_at)}</span>
                  </div>

                  {/* Assigned Officer */}
                  {c.assigned_officer_name ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{c.assigned_officer_name}</p>
                          {officer?.designation && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />{officer.designation}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pl-9">
                        {officer?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${officer.email}`} className="text-emerald-600 hover:underline">
                              {officer.email}
                            </a>
                          </span>
                        )}
                        {officer?.phone && (
                          <span className="flex items-center gap-1">
                            📞 {officer.phone}
                          </span>
                        )}
                      </div>
                      {c.assignment_reason && (
                        <p className="text-xs text-muted-foreground pl-9 italic">{c.assignment_reason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Awaiting officer assignment...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
