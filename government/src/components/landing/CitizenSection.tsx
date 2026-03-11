import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, FileText, Search } from "lucide-react";
import { motion } from "framer-motion";

const CitizenSection = () => {
  return (
    <section className="py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Citizen Action Center</h2>
          <p className="text-muted-foreground">Report environmental issues and track government response.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: AlertTriangle, title: "Report Pollution", desc: "Submit air, water, or soil pollution reports", to: "/complaints" },
            { icon: FileText, title: "Submit Complaint", desc: "File a formal environmental complaint", to: "/complaints" },
            { icon: Search, title: "Track Status", desc: "Check the status of your complaint", to: "/complaints" },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-center p-8 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 rounded-full gov-gradient flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{item.desc}</p>
                <Button asChild variant="outline">
                  <Link to={item.to}>{item.title}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CitizenSection;
