import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import CommissionsSection from "@/components/CommissionsSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import LatestArrivals from "@/components/LatestArrivals";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SmoothScroll />
      <CustomCursor />
      <BackgroundFX />
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <LatestArrivals />
      <CommissionsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
