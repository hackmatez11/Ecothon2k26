import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TreePine, Trash2, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";

const events = [
  {
    icon: TreePine,
    title: "Join Tree Plantation Drive",
    desc: "Plant 1000 trees in Delhi NCR – March 15, 2026",
    volunteers: 342,
  },
  {
    icon: Trash2,
    title: "Volunteer for Clean Up Campaign",
    desc: "Yamuna riverbank cleanup – March 20, 2026",
    volunteers: 218,
  },
  {
    icon: AlertTriangle,
    title: "Report Illegal Dumping",
    desc: "Help identify and report unauthorized waste disposal sites",
    volunteers: 156,
  },
];

export function CitizenParticipation() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Get Involved</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {events.map((event) => (
          <Card key={event.title}>
            <CardContent className="space-y-4 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <event.icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.desc}</p>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {event.volunteers} volunteers
              </div>
              <Button
                className="w-full"
                onClick={() => toast.success(`You've signed up for: ${event.title}`)}
              >
                Join Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
