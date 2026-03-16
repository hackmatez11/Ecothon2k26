import HeroSection from "@/components/landing/HeroSection";
import DepartmentsSection from "@/components/landing/DepartmentsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DepartmentsSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
