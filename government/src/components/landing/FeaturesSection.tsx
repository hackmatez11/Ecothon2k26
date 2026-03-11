import { motion } from "framer-motion";
import { Wind, Droplets, Mountain, Brain, Ship, Factory, MessageSquare, ClipboardList } from "lucide-react";

const features = [
  { icon: Wind, title: "Air Pollution Monitoring", desc: "Real-time AQI tracking across cities" },
  { icon: Droplets, title: "Water Quality Monitoring", desc: "River and lake contamination analysis" },
  { icon: Mountain, title: "Soil Health Analysis", desc: "Soil contamination and crop safety" },
  { icon: Brain, title: "AI Pollution Prediction", desc: "Forecast pollution levels using machine learning" },
  { icon: Ship, title: "Oil Spill Detection", desc: "Satellite-based maritime monitoring" },
  { icon: Factory, title: "Industrial Pollution Detection", desc: "Factory emission anomaly detection" },
  { icon: MessageSquare, title: "Citizen Complaint System", desc: "Public reporting and tracking portal" },
  { icon: ClipboardList, title: "Task Management", desc: "Assign and track environmental actions" },
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Monitoring Capabilities</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive environmental monitoring powered by AI, satellite imagery, and IoT sensors.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="h-12 w-12 rounded-lg gov-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
