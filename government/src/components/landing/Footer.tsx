import { TreePine } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="gov-gradient text-primary-foreground py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TreePine className="h-6 w-6" />
              <span className="font-bold text-lg">NEMAP</span>
            </div>
            <p className="text-sm text-primary-foreground/70">National Environmental Monitoring & Action Platform. A Government of India Initiative.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/dashboard" className="hover:text-primary-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/complaints" className="hover:text-primary-foreground transition-colors">File Complaint</Link></li>
              <li><Link to="/login" className="hover:text-primary-foreground transition-colors">Government Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Departments</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="https://moef.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">Ministry of Environment</a></li>
              <li><a href="https://cpcb.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">Pollution Control Board</a></li>
              <li><a href="https://mowr.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">Water Resources</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Environmental Policies</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Data Transparency</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Public Environmental Data</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} NEMAP - National Environmental Monitoring & Action Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
