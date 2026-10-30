import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import CategoriesSection from "@/components/CategoriesSection";
import BackButton from "@/components/BackButton";
import FeaturedProducts from "@/components/FeaturedProducts";
import CommissionsSection from "@/components/CommissionsSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import LatestArrivals from "@/components/LatestArrivals";
import ContactSection from "@/components/ContactSection";

const sections: Record<string, { title: string; content: ReactNode }> = {
  "/categories": { title: "Catégories de mode", content: <CategoriesSection /> },
  "/selection": { title: "Sélection d'annonces", content: <FeaturedProducts /> },
  "/fonctionnement": { title: "Comment fonctionne Madclothes ?", content: <HowItWorks /> },
  "/commissions": { title: "Frais et commissions", content: <CommissionsSection /> },
  "/avis": { title: "Avis de la communauté", content: <Testimonials showEmpty /> },
  "/vendre-sur-madclothes": { title: "Vendre sur Madclothes", content: <CTASection /> },
  "/nouveautes": { title: "Dernières annonces", content: <LatestArrivals /> },
  "/contact": { title: "Contacter Madclothes", content: <ContactSection /> },
};

export default function SectionPage() {
  const { pathname } = useLocation();
  const section = sections[pathname] ?? sections["/categories"];
  return <div className="min-h-screen bg-background"><Navbar /><main className="min-h-[60vh] pt-[88px]"><div className="container mx-auto px-4 pt-4"><BackButton fallbackTo="/" /></div><h1 className="sr-only">{section.title}</h1>{section.content}</main><Footer /></div>;
}
