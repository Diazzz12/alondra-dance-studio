import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll suave a la sección si viene con hash, query o state
    const scrollToElement = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Verificar hash en la URL
    if (window.location.hash) {
      const hash = window.location.hash.substring(1); // Remover el #
      scrollToElement(hash);
    }
    
    // Verificar state de navegación
    if (location.state && typeof location.state === 'object' && 'scrollTo' in location.state) {
      const targetId = location.state.scrollTo as string;
      setTimeout(() => scrollToElement(targetId), 100);
    }
    
    // Verificar query parameter (mantener compatibilidad)
    const params = new URLSearchParams(window.location.search);
    if (params.get("scroll") === "pricing") {
      scrollToElement("pricing");
    }
  }, [location.state]);
  return (
    <div className="min-h-screen">
      <HeroSection />
      <AboutSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;