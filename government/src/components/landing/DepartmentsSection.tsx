import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Droplets, TreePine, Building, Trash2, Thermometer, ExternalLink } from "lucide-react";

const departments = [
  { name: "Ministry of Environment", icon: TreePine, desc: "Central ministry for environmental policy and regulation", url: "https://moef.gov.in" },
  { name: "Pollution Control Board", icon: Shield, desc: "National pollution monitoring and enforcement", url: "https://cpcb.nic.in" },
  { name: "Water Resources Department", icon: Droplets, desc: "Water quality management and conservation", url: "https://mowr.gov.in" },
  { name: "Forest Department", icon: TreePine, desc: "Forest conservation and biodiversity protection", url: "https://www.forests.gov.in" },
  { name: "Urban Development Department", icon: Building, desc: "Urban environmental planning and green infrastructure", url: "https://mohua.gov.in" },
  { name: "Waste Management Authority", icon: Trash2, desc: "Solid and hazardous waste management", url: "https://cpcb.nic.in" },
  { name: "Climate Change Department", icon: Thermometer, desc: "Climate action plans and carbon monitoring", url: "https://moef.gov.in" },
];

const DepartmentsSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Environmental Departments</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Key government departments coordinating environmental protection and monitoring across the nation.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((dept, i) => (
            <motion.div key={dept.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full hover:shadow-lg transition-shadow border-border">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                    <dept.icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{dept.desc}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={dept.url} target="_blank" rel="noopener noreferrer">
                      Visit Department <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DepartmentsSection;
