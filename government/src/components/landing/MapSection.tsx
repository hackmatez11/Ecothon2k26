import { motion } from "framer-motion";
import { MapPin, Wind, Droplets, Factory } from "lucide-react";

const markers = [
  { x: "28%", y: "35%", label: "Delhi - AQI 185", color: "bg-destructive", icon: Wind },
  { x: "55%", y: "52%", label: "Kolkata - AQI 120", color: "bg-warning", icon: Wind },
  { x: "22%", y: "55%", label: "Mumbai - AQI 95", color: "bg-success", icon: Wind },
  { x: "35%", y: "70%", label: "Chennai - Water Alert", color: "bg-info", icon: Droplets },
  { x: "45%", y: "40%", label: "Kanpur - Industrial", color: "bg-destructive", icon: Factory },
];

const MapSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Live Environmental Map</h2>
          <p className="text-muted-foreground">Real-time pollution levels, water quality, and industrial zone monitoring</p>
        </motion.div>
        <div className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
          <div className="aspect-[16/9] bg-gradient-to-br from-accent via-card to-gov-blue-light relative">
            {/* Simplified India map outline */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
              <path d="M30 15 L40 12 L50 15 L55 20 L58 30 L60 40 L58 50 L55 60 L50 70 L45 78 L40 82 L35 78 L30 72 L25 60 L22 50 L20 40 L22 30 L25 20 Z" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </svg>
            {markers.map((m, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="absolute group cursor-pointer"
                style={{ left: m.x, top: m.y }}
              >
                <div className={`h-4 w-4 rounded-full ${m.color} animate-pulse shadow-lg`} />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-10">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <m.icon className="h-3 w-3" />
                    {m.label}
                  </div>
                </div>
              </motion.div>
            ))}
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur rounded-lg border border-border p-4 space-y-2">
              <div className="text-xs font-semibold text-foreground mb-2">Legend</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-success" /> Good AQI</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-warning" /> Moderate</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-destructive" /> Hazardous</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-info" /> Water Alert</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
