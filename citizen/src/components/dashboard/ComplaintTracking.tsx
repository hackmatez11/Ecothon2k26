import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const complaints = [
  { id: "ENV-2024-1840", type: "Air Pollution", location: "Anand Vihar", dept: "DPCC", status: "Resolved" },
  { id: "ENV-2024-1841", type: "Garbage Dumping", location: "Ghazipur", dept: "MCD", status: "Action Taken" },
  { id: "ENV-2024-1842", type: "Water Pollution", location: "Yamuna Bank", dept: "DJB", status: "Under Investigation" },
  { id: "ENV-2024-1843", type: "Industrial Pollution", location: "Okhla Phase II", dept: "CPCB", status: "Pending" },
  { id: "ENV-2024-1844", type: "Illegal Tree Cutting", location: "Vasant Kunj", dept: "Forest Dept", status: "Under Investigation" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Resolved: "default",
  "Action Taken": "secondary",
  "Under Investigation": "outline",
  Pending: "destructive",
};

export function ComplaintTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Track Your Complaints</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.id}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.location}</TableCell>
                <TableCell>{c.dept}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
