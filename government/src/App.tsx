import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
