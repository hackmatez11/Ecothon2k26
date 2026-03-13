import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, Briefcase, Building2, Trash2, Edit, Search } from "lucide-react";
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

interface OfficerManagementProps {
  department: string;
  departmentTitle: string;
  icon: React.ElementType;
  color: string;
}

const OfficerManagement = ({ department, departmentTitle, icon: Icon, color }: OfficerManagementProps) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    work_domain: departmentTitle,
    phone: "",
  });

  useEffect(() => {
    fetchOfficers();
  }, [department]);

  useEffect(() => {
    // Reset work_domain to department title when dialog opens for new officer
    if (isDialogOpen && !editingOfficer) {
      setFormData(prev => ({ ...prev, work_domain: departmentTitle }));
    }
  }, [isDialogOpen, editingOfficer, departmentTitle]);

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
          .insert([{
            ...formData,
            department,
          }]);

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
      const { error } = await supabase
        .from("officers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Officer removed successfully");
      fetchOfficers();
    } catch (error: any) {
      toast.error("Failed to remove officer: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      designation: "",
      work_domain: departmentTitle,
      phone: "",
    });
    setEditingOfficer(null);
  };

  const filteredOfficers = officers.filter(officer =>
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.work_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${color} p-6 rounded-xl border border-opacity-20`}>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {departmentTitle} - Officer Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage department officers and their responsibilities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOfficer ? "Edit Officer" : "Add New Officer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter officer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="officer@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                    placeholder="e.g., Senior Officer, Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_domain">Work Domain *</Label>
                <Input
                  id="work_domain"
                  value={formData.work_domain}
                  onChange={(e) => setFormData({ ...formData, work_domain: e.target.value })}
                  required
                  placeholder={`e.g., ${departmentTitle} Operations`}
                />
                <p className="text-xs text-muted-foreground">
                  Defaults to {departmentTitle}. You can specify a more specific domain.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOfficer ? "Update Officer" : "Add Officer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Department Officers ({filteredOfficers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search officers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading officers...</div>
          ) : filteredOfficers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No officers found matching your search" : "No officers added yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Work Domain</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOfficers.map((officer) => (
                    <TableRow key={officer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {officer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{officer.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {departmentTitle}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          {officer.designation}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{officer.work_domain}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {officer.email}
                          </div>
                          {officer.phone && (
                            <div className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {officer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(officer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(officer.id)}
                            className="text-destructive hover:text-destructive"
                          >
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
    </div>
  );
};

export default OfficerManagement;
