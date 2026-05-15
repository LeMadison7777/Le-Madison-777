import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import CategoriesSection from "@/components/CategoriesSection";
import CommissionsSection from "@/components/CommissionsSection";
import CTASection from "@/components/CTASection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundFX />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <CategoriesSection />
      <CommissionsSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;