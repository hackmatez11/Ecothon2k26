import { Card, CardContent } from "@/components/ui/card";
import { Leaf, TreePine, Bus, Flame } from "lucide-react";

const tips = [
  { icon: Leaf, title: "Reduce Plastic Usage", desc: "Carry reusable bags, bottles, and containers. Avoid single-use plastics whenever possible." },
  { icon: TreePine, title: "Plant Trees", desc: "Trees absorb CO₂ and produce oxygen. Plant at least one tree this year!" },
  { icon: Bus, title: "Use Public Transport", desc: "Carpooling and public transit reduce your carbon footprint significantly." },
  { icon: Flame, title: "Avoid Burning Waste", desc: "Open burning releases toxic pollutants. Use proper waste disposal methods." },
];

export function EnvironmentalTips() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Environmental Awareness</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tips.map((tip) => (
          <Card key={tip.title} className="border-l-4 border-l-primary">
            <CardContent className="flex gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <tip.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{tip.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tip.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
