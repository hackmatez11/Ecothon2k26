import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { TreePine } from "lucide-react";
import { ComplaintAssignmentMonitor } from "./ComplaintAssignmentMonitor";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <ComplaintAssignmentMonitor />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">NEMAP Dashboard</span>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">Officer: Admin | Dept: PCB</div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
