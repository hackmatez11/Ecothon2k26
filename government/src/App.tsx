import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import EnvironmentalDashboard from "./pages/EnvironmentalDashboard";
import WaterResourcesDashboard from "./pages/WaterResourcesDashboard";
import IndustrialRegulationDashboard from "./pages/IndustrialRegulationDashboard";
import AdministrationDashboard from "./pages/AdministrationDashboard";
import { 
  AgriculturalDashboard, 
  WasteDashboard, 
  ForestDashboard, 
  SoilConservationDashboard 
} from "./pages/NewDashboards";
import CitizenComplaints from "./pages/CitizenComplaints";
import PollutionPrediction from "./pages/PollutionPrediction";
import PollutionSources from "./pages/PollutionSources";
import TaskManagement from "./pages/TaskManagement";
import Communication from "./pages/Communication";
import Budget from "./pages/Budget";
import WaterQuality from "./pages/WaterQuality";
import OilSpill from "./pages/OilSpill";
import IndustrialPollution from "./pages/IndustrialPollution";
import Complaints from "./pages/Complaints";
import VoiceComplaint from "./pages/VoiceComplaint";
import EcoProducts from "./pages/EcoProducts";
import SoilAnalysis from "./pages/SoilAnalysis";
import WaterAnalysis from "./pages/WaterAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/environmental" element={<EnvironmentalDashboard />} />
            <Route path="/water-resources" element={<WaterResourcesDashboard />} />
            <Route path="/industrial-regulation" element={<IndustrialRegulationDashboard />} />
            <Route path="/administration" element={<AdministrationDashboard />} />
            
            <Route path="/agricultural" element={<AgriculturalDashboard />} />
            <Route path="/waste" element={<WasteDashboard />} />
            <Route path="/forest" element={<ForestDashboard />} />
            <Route path="/soil-conservation" element={<SoilConservationDashboard />} />
            
            <Route path="/citizen-complaints/:dept" element={<CitizenComplaints />} />
            
            <Route path="/pollution-prediction" element={<PollutionPrediction />} />
            <Route path="/pollution-sources" element={<PollutionSources />} />
            <Route path="/task-management" element={<TaskManagement />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/water-quality" element={<WaterQuality />} />
            <Route path="/oil-spill" element={<OilSpill />} />
            <Route path="/industrial-pollution" element={<IndustrialPollution />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/voice-complaint" element={<VoiceComplaint />} />
            <Route path="/eco-products" element={<EcoProducts />} />
            <Route path="/soil-analysis" element={<SoilAnalysis />} />
            <Route path="/water-analysis" element={<WaterAnalysis />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
