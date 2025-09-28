import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute inset-0 pole-pattern opacity-5" />
      
      {/* Animated background shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 animate-float" />
      <div className="absolute bottom-20 right-16 w-16 h-16 rounded-full bg-accent/20 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-10 w-12 h-12 rounded-full bg-primary/15 animate-float" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo with elegant styling */}
          <div className="mb-12 animate-fade-up">
            <div className="relative inline-block">
              <div className="absolute -inset-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-8 shadow-2xl border border-white/20">
                <img 
                  src="/logo.png" 
                  alt="Alondra Pole Space Logo" 
                  className="h-60 md:h-100 w-auto object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Main heading - simplified since logo has the text */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="hero-text-gradient">Tu Espacio</span>
            <br />
            <span className="text-foreground">de Pole Dance</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
            Descubre tu fuerza interior y transforma tu cuerpo en nuestro estudio de pole dance. 
            Clases para todos los niveles en un ambiente seguro y empoderador.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg elegant-shadow">
              Reservar Clase
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Conoce Más
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};