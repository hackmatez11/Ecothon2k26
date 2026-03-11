import { 
  LogOut, 
  ChevronRight,
  LayoutDashboard,
  ArrowLeft,
  Shield,
  Activity,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, useSidebar,
  SidebarHeader
} from "@/components/ui/sidebar";
import { departments } from "@/lib/departments";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  // Identify active department based on URL
  const activeDept = departments.find(dept => 
    location.pathname.startsWith(dept.path) || 
    dept.features.some(f => location.pathname.startsWith(f.path))
  );

  const isMainHub = location.pathname === "/dashboard" || !activeDept;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        {activeDept && !isMainHub ? (
          <div className="flex flex-col gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${activeDept.color} bg-opacity-20 text-sidebar-primary shadow-sm`}>
                  <activeDept.icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm truncate tracking-tight">{activeDept.title}</span>
              </div>
            )}
            <SidebarMenuButton asChild>
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-all text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 group">
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
                {!collapsed && <span>Government Hub</span>}
              </Link>
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl shadow-inner group cursor-pointer">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-foreground tracking-tighter text-lg leading-none">NEMAP</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Live</span>
                </div>
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide">
        {activeDept && !isMainHub ? (
          // UNIQUE DEPARTMENT VIEW
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
              Department Station
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to={activeDept.path} end className="hover:bg-sidebar-accent/50 transition-colors" activeClassName="bg-sidebar-accent text-sidebar-primary font-bold shadow-sm">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Command Overview</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {activeDept.features.map((feature) => (
                  <SidebarMenuItem key={feature.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={feature.path} className="hover:bg-sidebar-accent/50 transition-colors" activeClassName="bg-sidebar-accent text-sidebar-primary font-bold shadow-sm">
                        <feature.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{feature.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          // GLOBAL HUB VIEW
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                Core Infrastructure
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild hoverEffect="glow">
                      <NavLink to="/dashboard" className="hover:bg-sidebar-accent/50 transition-colors" activeClassName="bg-sidebar-accent text-sidebar-primary font-black shadow-md border-l-2 border-primary">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {!collapsed && <span>Central Command</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                Strategic Insights
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                {!collapsed && (
                  <div className="grid gap-2 mb-4">
                    <div className="p-3 bg-muted/30 rounded-xl border border-border/50 group hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Stability</span>
                        <Activity className="h-3 w-3 text-green-500" />
                      </div>
                      <div className="text-sm font-black flex items-center gap-2">
                        94.2% <span className="text-[10px] text-green-500 font-bold">+2.4%</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border/50 group hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Global Alerts</span>
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                      </div>
                      <div className="text-sm font-black text-orange-600">
                        12 Active <span className="text-[10px] text-muted-foreground font-normal ml-1">3 High</span>
                      </div>
                    </div>
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60">
                Functional Nodes
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {departments.map((dept) => (
                    <SidebarMenuItem key={dept.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={dept.path} className="group hover:bg-sidebar-accent/50 transition-colors" activeClassName="bg-sidebar-accent text-sidebar-primary font-bold shadow-sm">
                          <div className={`mr-2 p-1 rounded-md ${dept.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                            <dept.icon className={`h-4 w-4 ${dept.color.replace('bg-', 'text-')}`} />
                          </div>
                          {!collapsed && <span className="flex-1">{dept.title}</span>}
                          {!collapsed && <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup className="mt-auto border-t border-sidebar-border/50 pt-4 pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group">
                    <LogOut className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    {!collapsed && <span className="text-xs font-bold uppercase tracking-wider text-center">Terminate Session</span>}
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
