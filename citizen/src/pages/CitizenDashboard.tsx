import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { EnvironmentalTips } from "@/components/dashboard/EnvironmentalTips";
import { EnvironmentalAlerts } from "@/components/dashboard/EnvironmentalAlerts";
import { CitizenParticipation } from "@/components/dashboard/CitizenParticipation";

function DashboardHome() {
  return (
    <div className="space-y-8">
      <WelcomeHeader />
      <LocalPollutionStatus />
      <EnvironmentalAlerts />
      <PollutionPrediction />
      <GovernmentActions />
      <CitizenParticipation />
      <EnvironmentalTips />
    </div>
  );
}

export default function CitizenDashboard() {
  return (
    <SidebarProvider>
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
              <Route path="map" element={<LiveEnvironmentalMap />} />
              <Route path="prediction" element={<PollutionPrediction />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="track" element={<ComplaintTracking />} />
              <Route path="voice" element={<VoiceComplaint />} />
              <Route path="eco-bot" element={<EcoBot />} />
              <Route path="tips" element={<EnvironmentalTips />} />
              <Route path="actions" element={<GovernmentActions />} />
              <Route path="participate" element={<CitizenParticipation />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
