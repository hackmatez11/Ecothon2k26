import {
  LayoutDashboard, Map, TrendingUp, Search,
  Shield, AlertCircle, LogOut, User, Sprout, Leaf, HeartPulse, CalendarCheck, Route, ScanSearch
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/citizen-dashboard", icon: LayoutDashboard },
  { title: "Submit Complaint", url: "/citizen-dashboard/complaint", icon: AlertCircle },
  { title: "Soil Analysis", url: "/citizen-dashboard/soil-analysis", icon: Sprout },
  { title: "Live Map", url: "/citizen-dashboard/map", icon: Map },
  { title: "Pollution Prediction", url: "/citizen-dashboard/prediction", icon: TrendingUp },
  { title: "Track Complaint", url: "/citizen-dashboard/track", icon: Search },
  { title: "Government Actions", url: "/citizen-dashboard/actions", icon: Shield },
  { title: "Carbon Footprint", url: "/citizen-dashboard/carbon-footprint", icon: Leaf },
  { title: "Medcare", url: "/citizen-dashboard/medcare", icon: HeartPulse },
  { title: "Appointment Booking", url: "/citizen-dashboard/appointment", icon: CalendarCheck },
  { title: "EcoRoutes", url: "/citizen-dashboard/eco-routes", icon: Route },
  { title: "EcoScan", url: "/citizen-dashboard/eco-scan", icon: ScanSearch },
];

export function CitizenSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            {!collapsed && "Environmental Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/citizen-dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Citizen</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
              <LogOut className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
