import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus, Mail, Phone, Briefcase, Building2, Trash2, Edit,
  Search, Users, Download, Eye, FileText, MapPin, Clock, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Officer {
  id: string;
  name: string;
  email: string;
  designation: string;
  work_domain: string;
  department: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface AssignedComplaint {
  id: string;
  description: string;
  department: string;
  severity: "low" | "medium" | "high";
  status: string;
  location: string;
  citizen_email: string;
  assignment_reason: string;
  assigned_officer_name: string | null;
  created_at: string;
}

interface OfficerManagementProps {
  department: string;
  departmentTitle: string;
  icon: React.ElementType;
  color: string;
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

const OfficerManagement = ({ department, departmentTitle, icon: Icon, color }: OfficerManagementProps) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [viewingOfficer, setViewingOfficer] = useState<Officer | null>(null);
  const [officerComplaints, setOfficerComplaints] = useState<AssignedComplaint[]>([]);
  const [deptComplaints, setDeptComplaints] = useState<AssignedComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [deptComplaintsLoading, setDeptComplaintsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    work_domain: departmentTitle,
    phone: "",
  });

  useEffect(() => { fetchOfficers(); fetchDeptComplaints(); }, [department]);

  useEffect(() => {
    if (isDialogOpen && !editingOfficer) {
      setFormData(prev => ({ ...prev, work_domain: departmentTitle }));
    }
  }, [isDialogOpen, editingOfficer, departmentTitle]);

  useEffect(() => {
    if (viewingOfficer) fetchOfficerComplaints(viewingOfficer.id);
  }, [viewingOfficer]);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("officers")
        .select("*")
        .eq("department", department)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOfficers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch officers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerComplaints = async (officerId: string) => {
    try {
      setComplaintsLoading(true);
      const { data, error } = await supabase
        .from("complaints")
        .select("id, description, department, severity, status, location, citizen_email, assignment_reason, assigned_officer_name, created_at")
        .eq("assigned_officer_id", officerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOfficerComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch complaints: " + error.message);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchDeptComplaints = async () => {
    try {
      setDeptComplaintsLoading(true);
      // Get officer IDs for this department first
      const { data: deptOfficers } = await supabase
        .from("officers")
        .select("id")
        .eq("department", department)
        .eq("is_active", true);

      if (!deptOfficers || deptOfficers.length === 0) {
        setDeptComplaints([]);
        return;
      }

      const ids = deptOfficers.map(o => o.id);
      const { data, error } = await supabase
        .from("complaints")
        .select("id, description, department, severity, status, location, citizen_email, assignment_reason, assigned_officer_name, created_at")
        .in("assigned_officer_id", ids)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeptComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch department complaints: " + error.message);
    } finally {
      setDeptComplaintsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOfficer) {
        const { error } = await supabase
          .from("officers")
          .update({
            name: formData.name,
            email: formData.email,
            designation: formData.designation,
            work_domain: formData.work_domain,
            phone: formData.phone,
          })
          .eq("id", editingOfficer.id);
        if (error) throw error;
        toast.success("Officer updated successfully");
      } else {
        const { error } = await supabase
          .from("officers")
          .insert([{ ...formData, department }]);
        if (error) throw error;
        toast.success("Officer added successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchOfficers();
    } catch (error: any) {
      toast.error("Failed to save officer: " + error.message);
    }
  };

  const handleEdit = (officer: Officer) => {
    setEditingOfficer(officer);
    setFormData({
      name: officer.name,
      email: officer.email,
      designation: officer.designation,
      work_domain: officer.work_domain,
      phone: officer.phone || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this officer?")) return;
    try {
      const { error } = await supabase.from("officers").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      toast.success("Officer removed successfully");
      fetchOfficers();
    } catch (error: any) {
      toast.error("Failed to remove officer: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", designation: "", work_domain: departmentTitle, phone: "" });
    setEditingOfficer(null);
  };

  const filteredOfficers = officers.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.work_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeptComplaints = deptComplaints.filter(c =>
    c.description?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
    c.citizen_email?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
    c.assigned_officer_name?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
    c.location?.toLowerCase().includes(complaintSearch.toLowerCase())
  );

  const totalOfficers = officers.length;
  const uniqueDesignations = new Set(officers.map(o => o.designation)).size;

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Designation", "Work Domain", "Phone", "Department"];
    const rows = filteredOfficers.map(o => [o.name, o.email, o.designation, o.work_domain, o.phone || "N/A", departmentTitle]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${department}_officers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${color} p-6 rounded-xl border border-opacity-20`}>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {departmentTitle} — Officer Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage officers and view their assigned complaints</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" />Add Officer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOfficer ? "Edit Officer" : "Add New Officer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter officer name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="officer@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input id="designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required placeholder="e.g., Senior Officer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_domain">Work Domain *</Label>
                <Input id="work_domain" value={formData.work_domain} onChange={e => setFormData({ ...formData, work_domain: e.target.value })} required placeholder={`e.g., ${departmentTitle} Operations`} />
                <p className="text-xs text-muted-foreground">Defaults to {departmentTitle}. Specify a more specific domain if needed.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingOfficer ? "Update Officer" : "Add Officer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Officers", value: totalOfficers, icon: Users },
          { label: "Designations", value: uniqueDesignations, icon: Briefcase },
          { label: "With Phone", value: officers.filter(o => o.phone).length, icon: Phone },
          { label: "Work Domains", value: new Set(officers.map(o => o.work_domain)).size, icon: Building2 },
        ].map(({ label, value, icon: StatIcon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <h3 className="text-2xl font-bold mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                  <StatIcon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs: Officers | Assigned Complaints */}
      <Tabs defaultValue="officers">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="officers" className="flex-1 gap-2">
            <Users className="h-4 w-4" />Officers ({officers.length})
          </TabsTrigger>
          <TabsTrigger value="complaints" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />Assigned Complaints ({deptComplaints.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Officers Tab ── */}
        <TabsContent value="officers" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Officers ({filteredOfficers.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search officers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                    <Download className="h-4 w-4" />Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading officers...</div>
              ) : filteredOfficers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No officers match your search" : "No officers added yet"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Work Domain</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOfficers.map(officer => (
                        <TableRow key={officer.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {officer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{officer.name}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(officer.created_at)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Briefcase className="h-3 w-3" />{officer.designation}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{officer.work_domain}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="text-xs flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />{officer.email}
                              </div>
                              {officer.phone && (
                                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />{officer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewingOfficer(officer)} title="View assigned complaints">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(officer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(officer.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Assigned Complaints Tab ── */}
        <TabsContent value="complaints" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Assigned Complaints ({filteredDeptComplaints.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search complaints..." value={complaintSearch} onChange={e => setComplaintSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDeptComplaints} className="gap-2">
                    <RefreshCw className="h-4 w-4" />Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {deptComplaintsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading complaints...</div>
              ) : filteredDeptComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <FileText className="h-10 w-10 opacity-20" />
                  <p className="text-sm">{complaintSearch ? "No complaints match your search" : "No complaints assigned yet"}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Assigned Officer</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Citizen</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeptComplaints.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="max-w-xs">
                            <div>
                              <span className="font-mono text-xs text-muted-foreground">#{c.id.slice(0, 8).toUpperCase()}</span>
                              <p className="text-sm mt-0.5 line-clamp-2">{c.description}</p>
                              {c.location && c.location !== "Not specified" && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />{c.location}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {c.assigned_officer_name ? (
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary">
                                    {c.assigned_officer_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium">{c.assigned_officer_name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.medium}`}>
                              {c.severity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[c.status] ?? STATUS_STYLE.pending}`}>
                              {c.status.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />{c.citizen_email}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{formatDate(c.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Officer Detail Dialog */}
      <Dialog open={!!viewingOfficer} onOpenChange={open => { if (!open) { setViewingOfficer(null); setOfficerComplaints([]); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewingOfficer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {viewingOfficer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {viewingOfficer.name}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="profile">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                  <TabsTrigger value="complaints" className="flex-1">
                    Assigned Complaints {officerComplaints.length > 0 && `(${officerComplaints.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-3 mt-4">
                  {[
                    { icon: Briefcase, label: "Designation", value: viewingOfficer.designation },
                    { icon: Building2, label: "Work Domain", value: viewingOfficer.work_domain },
                    { icon: Mail, label: "Email", value: viewingOfficer.email },
                    { icon: Phone, label: "Phone", value: viewingOfficer.phone || "Not provided" },
                    { icon: Clock, label: "Added On", value: formatDate(viewingOfficer.created_at) },
                  ].map(({ icon: RowIcon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <RowIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="complaints" className="mt-4">
                  {complaintsLoading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading complaints...</div>
                  ) : officerComplaints.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No complaints assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {officerComplaints.map(c => (
                        <div key={c.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              #{c.id.slice(0, 8).toUpperCase()}
                            </span>
                            <div className="flex gap-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.medium}`}>
                                {c.severity}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[c.status] ?? STATUS_STYLE.pending}`}>
                                {c.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
                          {c.assignment_reason && (
                            <p className="text-xs text-muted-foreground italic">
                              <span className="not-italic font-medium">Reason: </span>{c.assignment_reason}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.citizen_email}</span>
                            {c.location && c.location !== "Not specified" && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                            )}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(c.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficerManagement;
