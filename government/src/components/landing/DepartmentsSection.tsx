import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Shield, Droplets, Factory, ClipboardList, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const departments = [
  { 
    name: "Environmental Department", 
    icon: Leaf, 
    desc: "Monitor air quality, pollution sources, and environmental health",
    dashboardPath: "/environmental"
  },
  { 
    name: "Water Resources Department", 
    icon: Droplets, 
    desc: "Water quality management and conservation",
    dashboardPath: "/water-resources"
  },
  { 
    name: "Industrial Regulation", 
    icon: Factory, 
    desc: "Industrial compliance and pollution control",
    dashboardPath: "/industrial-regulation"
  },
  { 
    name: "Administration", 
    icon: ClipboardList, 
    desc: "Administrative tasks and resource management",
    dashboardPath: "/administration"
  },
];

const DepartmentsSection = () => {
  const navigate = useNavigate();

  const handleDepartmentClick = (path: string) => {
    navigate(path);
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Environmental Departments</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Key government departments coordinating environmental protection and monitoring across the nation.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments.map((dept, i) => (
            <motion.div key={dept.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full hover:shadow-lg transition-shadow border-border cursor-pointer group" onClick={() => handleDepartmentClick(dept.dashboardPath)}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <dept.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{dept.desc}</p>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Access Dashboard <ArrowRight className="ml-2 h-3 w-3" />
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
