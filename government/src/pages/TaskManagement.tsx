import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const tasks = [
  { id: 1, source: "Vehicles", location: "Delhi - Connaught Place", dept: "Transport", officer: "R. Sharma", deadline: "2026-03-15", status: "In Progress" },
  { id: 2, source: "Factory Emissions", location: "Noida Sector 62", dept: "PCB", officer: "M. Kumar", deadline: "2026-03-12", status: "Pending" },
  { id: 3, source: "Waste Burning", location: "Mumbai - Deonar", dept: "Waste Mgmt", officer: "S. Patel", deadline: "2026-03-10", status: "Completed" },
  { id: 4, source: "Construction Dust", location: "Bangalore - Whitefield", dept: "Urban Dev", officer: "K. Reddy", deadline: "2026-03-18", status: "Pending" },
  { id: 5, source: "Industrial Waste", location: "Kanpur - Leather Zone", dept: "PCB", officer: "A. Singh", deadline: "2026-03-20", status: "In Progress" },
];

const statusIcon = (s: string) => {
  if (s === "Completed") return <CheckCircle className="h-4 w-4 text-success" />;
  if (s === "In Progress") return <Clock className="h-4 w-4 text-warning" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
};

const TaskManagement = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Task Management</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> Create Task</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Task</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Pollution Source</Label><Input placeholder="e.g. Factory Emissions" /></div>
              <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Delhi NCR" /></div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcb">Pollution Control Board</SelectItem>
                    <SelectItem value="transport">Transport Dept</SelectItem>
                    <SelectItem value="waste">Waste Management</SelectItem>
                    <SelectItem value="urban">Urban Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Assign Officer</Label><Input placeholder="Officer name" /></div>
              <div className="space-y-2"><Label>Deadline</Label><Input type="date" /></div>
              <div className="space-y-2"><Label>Priority</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-2"><Label>Description</Label><Textarea placeholder="Task details..." /></div>
              <div className="sm:col-span-2"><Button>Create Task</Button></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Pending", count: tasks.filter(t => t.status === "Pending").length, color: "text-destructive" },
          { label: "In Progress", count: tasks.filter(t => t.status === "In Progress").length, color: "text-warning" },
          { label: "Completed", count: tasks.filter(t => t.status === "Completed").length, color: "text-success" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Task List</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                {statusIcon(t.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{t.source}</p>
                  <p className="text-sm text-muted-foreground">{t.location} • {t.dept} • {t.officer}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Due: {t.deadline}</p>
                  <span className={`gov-badge mt-1 ${t.status === "Completed" ? "bg-accent text-accent-foreground" : t.status === "In Progress" ? "bg-gov-blue-light text-secondary" : "bg-muted text-muted-foreground"}`}>
                    {t.status}
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

export default TaskManagement;
