import {
  LayoutDashboard, Brain, PieChart, ClipboardList, MessageSquare, Wallet,
  Droplets, Ship, Factory, MessageCircle, Mic, Leaf, Mountain, LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Pollution Prediction", url: "/pollution-prediction", icon: Brain },
  { title: "Pollution Sources", url: "/pollution-sources", icon: PieChart },
  { title: "Task Management", url: "/task-management", icon: ClipboardList },
  { title: "Communication", url: "/communication", icon: MessageSquare },
  { title: "Budget Planning", url: "/budget", icon: Wallet },
  { title: "Water Quality", url: "/water-quality", icon: Droplets },
  { title: "Oil Spill Detection", url: "/oil-spill", icon: Ship },
  { title: "Industrial Pollution", url: "/industrial-pollution", icon: Factory },
  { title: "Complaints", url: "/complaints", icon: MessageCircle },
  { title: "Voice Complaint", url: "/voice-complaint", icon: Mic },
  { title: "Eco Products", url: "/eco-products", icon: Leaf },
  { title: "Soil Analysis", url: "/soil-analysis", icon: Mountain },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="hover:bg-sidebar-accent text-sidebar-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Logout</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
