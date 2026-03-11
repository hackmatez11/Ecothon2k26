import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin } from "lucide-react";

const layers = ["Air Pollution", "Water Pollution", "Industrial", "Waste Dumping", "Forest Fires"];
const hotspots = [
  { name: "Anand Vihar", type: "Air", level: "High", color: "destructive" as const },
  { name: "Yamuna River", type: "Water", level: "Critical", color: "destructive" as const },
  { name: "Okhla Industrial", type: "Industrial", level: "Moderate", color: "secondary" as const },
  { name: "Ghazipur Landfill", type: "Waste", level: "High", color: "destructive" as const },
];

export function LiveEnvironmentalMap() {
  const [activeLayer, setActiveLayer] = useState("Air Pollution");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Live Environmental Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search location..." className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeLayer === layer
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
        {/* Map placeholder */}
        <div className="relative h-64 overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 md:h-96">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-primary/30" />
              <p className="mt-2 text-sm text-muted-foreground">Interactive map — {activeLayer} layer active</p>
            </div>
          </div>
          {/* Simulated hotspot dots */}
          <div className="absolute left-[30%] top-[40%] h-4 w-4 animate-pulse rounded-full bg-status-danger/60" />
          <div className="absolute left-[55%] top-[30%] h-3 w-3 animate-pulse rounded-full bg-status-moderate/60" />
          <div className="absolute left-[70%] top-[60%] h-5 w-5 animate-pulse rounded-full bg-status-danger/60" />
          <div className="absolute left-[20%] top-[70%] h-3 w-3 animate-pulse rounded-full bg-status-safe/60" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Pollution Hotspots</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {hotspots.map((h) => (
              <div key={h.name} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.type} Pollution</p>
                </div>
                <Badge variant={h.color}>{h.level}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
