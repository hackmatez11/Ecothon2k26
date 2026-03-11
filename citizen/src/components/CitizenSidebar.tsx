import {
  LayoutDashboard, Map, TrendingUp, MessageSquare, Search,
  Mic, ShoppingBag, Lightbulb, Shield, TreePine
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/citizen-dashboard", icon: LayoutDashboard },
  { title: "Live Map", url: "/citizen-dashboard/map", icon: Map },
  { title: "Pollution Prediction", url: "/citizen-dashboard/prediction", icon: TrendingUp },
  { title: "Report Complaint", url: "/citizen-dashboard/report", icon: MessageSquare },
  { title: "Track Complaint", url: "/citizen-dashboard/track", icon: Search },
  { title: "Voice Complaint", url: "/citizen-dashboard/voice", icon: Mic },
  { title: "Eco Products Bot", url: "/citizen-dashboard/eco-bot", icon: ShoppingBag },
  { title: "Environmental Tips", url: "/citizen-dashboard/tips", icon: Lightbulb },
  { title: "Government Actions", url: "/citizen-dashboard/actions", icon: Shield },
  { title: "Get Involved", url: "/citizen-dashboard/participate", icon: TreePine },
];

export function CitizenSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

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
    </Sidebar>
  );
}
