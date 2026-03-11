import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Send } from "lucide-react";
import { toast } from "sonner";

const categories = [
  "Air Pollution", "Water Pollution", "Garbage Dumping",
  "Industrial Pollution", "Illegal Tree Cutting", "Oil Spill",
];

export function ReportIssue() {
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Complaint submitted successfully! Your complaint ID is #ENV-2024-1847");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Environmental Problem</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select complaint category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Location (e.g., Near Connaught Place, Delhi)" />
          <Textarea placeholder="Describe the issue in detail..." rows={4} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Image
            </Button>
            <Button type="button" variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Video
            </Button>
          </div>
          <Button type="submit" className="w-full gap-2">
            <Send className="h-4 w-4" /> Submit Complaint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
