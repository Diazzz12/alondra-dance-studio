import { useEffect } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  useEffect(() => {
    // Scroll suave a la sección de precios si viene con hash o query
    if (window.location.hash === "#pricing") {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get("scroll") === "pricing") {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);
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