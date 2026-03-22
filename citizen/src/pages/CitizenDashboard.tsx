import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { CitizenSidebar } from "@/components/CitizenSidebar";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { LiveEnvironmentalMap } from "@/components/dashboard/LiveEnvironmentalMap";
import { LocalPollutionStatus } from "@/components/dashboard/LocalPollutionStatus";
import { PollutionPrediction } from "@/components/dashboard/PollutionPrediction";
import { ReportIssue } from "@/components/dashboard/ReportIssue";
import { VoiceComplaint } from "@/components/dashboard/VoiceComplaint";
import { ComplaintTracking } from "@/components/dashboard/ComplaintTracking";
import { GovernmentActions } from "@/components/dashboard/GovernmentActions";
import { EcoBot } from "@/components/dashboard/EcoBot";
import { EnvironmentalAlerts } from "@/components/dashboard/EnvironmentalAlerts";
import { SoilAnalysis } from "@/components/dashboard/SoilAnalysis";
import { CityAQIAreas } from "@/components/dashboard/CityAQIAreas";
import SubmitComplaint from "@/pages/SubmitComplaint";
import OilSpillDetection from "@/pages/OilSpillDetection";
import CarbonFootprint from "@/pages/CarbonFootprint";
import Medcare from "@/pages/Medcare";
import AppointmentBooking from "@/pages/AppointmentBooking";
import EcoRoutes from "@/pages/EcoRoutes";
import EcoScan from "@/pages/EcoScan";

function DashboardHome() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />
      <LocalPollutionStatus />
      
      <CityAQIAreas />
      
      <EnvironmentalAlerts />
      <PollutionPrediction />
      <GovernmentActions />
    </div>
  );
}

function SidebarAutoCollapse() {
  const { setOpen } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("/medcare") || location.pathname.includes("/appointment") || location.pathname.includes("/eco-routes") || location.pathname.includes("/eco-scan")) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [location.pathname, setOpen]);

  return null;
}

export default function CitizenDashboard() {
  return (
    <SidebarProvider>
      <SidebarAutoCollapse />
      <div className="flex min-h-screen w-full">
        <CitizenSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center border-b bg-background px-4">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-medium text-muted-foreground">
              Environmental Citizen Portal
            </span>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="map" element={
                <div className="space-y-8">
                  <LiveEnvironmentalMap />
                  <PollutionPrediction />
                </div>
              } />
              <Route path="soil-analysis" element={<SoilAnalysis />} />
              <Route path="prediction" element={<PollutionPrediction />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="track" element={<ComplaintTracking />} />
              <Route path="voice" element={<VoiceComplaint />} />
              <Route path="eco-bot" element={<EcoBot />} />
              <Route path="actions" element={<GovernmentActions />} />
              <Route path="complaint" element={<SubmitComplaint />} />
              <Route path="oil-spill" element={<OilSpillDetection />} />
              <Route path="carbon-footprint" element={<CarbonFootprint />} />
              <Route path="medcare" element={<Medcare />} />
              <Route path="appointment" element={<AppointmentBooking />} />
              <Route path="eco-routes" element={<EcoRoutes />} />
              <Route path="eco-scan" element={<EcoScan />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
