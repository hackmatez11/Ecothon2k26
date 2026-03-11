import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Upload, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const existingComplaints = [
  { id: "CMP-001", type: "Air Pollution", location: "Delhi - Anand Vihar", date: "2026-03-10", status: "Under Review" },
  { id: "CMP-002", type: "Illegal Dumping", location: "Mumbai - Malad", date: "2026-03-09", status: "Assigned" },
  { id: "CMP-003", type: "Water Pollution", location: "Kanpur - Ganga Barrage", date: "2026-03-08", status: "Resolved" },
  { id: "CMP-004", type: "Industrial Pollution", location: "Chennai - Ennore", date: "2026-03-07", status: "In Progress" },
];

const Complaints = () => {
  const [complaintType, setComplaintType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Complaint submitted successfully! Track ID: CMP-005");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Citizen Complaint System</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Submit Complaint</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Complaint Type</Label>
                <Select value={complaintType} onValueChange={setComplaintType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Air Pollution</SelectItem>
                    <SelectItem value="water">Water Pollution</SelectItem>
                    <SelectItem value="dumping">Illegal Dumping</SelectItem>
                    <SelectItem value="industrial">Industrial Pollution</SelectItem>
                    <SelectItem value="noise">Noise Pollution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Your Name</Label><Input placeholder="Full name" /></div>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input placeholder="Address or coordinates" className="flex-1" />
                  <Button type="button" variant="outline" size="icon"><MapPin className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the environmental issue..." rows={4} /></div>
              <div className="space-y-2">
                <Label>Upload Evidence</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload images or videos</p>
                </div>
              </div>
              <Button type="submit" className="w-full">Submit Complaint</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Complaints</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingComplaints.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-muted-foreground">{c.id}</span>
                    <span className={`gov-badge ${c.status === "Resolved" ? "bg-accent text-accent-foreground" : c.status === "In Progress" ? "bg-gov-blue-light text-secondary" : "bg-muted text-muted-foreground"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{c.type}</p>
                  <p className="text-sm text-muted-foreground">{c.location} • {c.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Complaints;
