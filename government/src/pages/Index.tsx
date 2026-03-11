import HeroSection from "@/components/landing/HeroSection";
import DepartmentsSection from "@/components/landing/DepartmentsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import MapSection from "@/components/landing/MapSection";
import CitizenSection from "@/components/landing/CitizenSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DepartmentsSection />
      <FeaturesSection />
      <MapSection />
      <CitizenSection />
      <Footer />
    </div>
  );
};

export default Index;
