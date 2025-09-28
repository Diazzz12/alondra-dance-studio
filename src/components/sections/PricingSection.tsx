import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

export const PricingSection = () => {
  const plans = [
    {
      name: "Clase Individual",
      price: "25",
      period: "por clase",
      description: "Perfecta para probar nuestra metodología",
      features: [
        "1 clase de 2 horas",
        "Uso de barra individual",
        "Equipo incluido",
        "Instructor dedicado"
      ],
      popular: false
    },
    {
      name: "Bono 4 Clases",
      price: "85",
      period: "mes",
      description: "La opción más popular para estudiantes regulares",
      features: [
        "4 clases de 2 horas",
        "Uso de barra individual",
        "Equipo incluido",
        "Instructor dedicado",
        "Validez 2 meses",
        "Ahorro de €15"
      ],
      popular: true
    },
    {
      name: "Bono 8 Clases",
      price: "150",
      period: "2 meses",
      description: "Para estudiantes comprometidos con su progreso",
      features: [
        "8 clases de 2 horas",
        "Uso de barra individual",
        "Equipo incluido",
        "Instructor dedicado",
        "Validez 3 meses",
        "Ahorro de €50",
        "Clase de regalo"
      ],
      popular: false
    }
  ];

  const specialOffers = [
    {
      title: "Reserva de Sala Completa",
      price: "120",
      period: "2 horas",
      description: "Ideal para eventos privados o grupos",
      features: ["Hasta 8 personas", "Todas las barras", "Música personalizada", "Instructor privado"]
    },
    {
      title: "Pareja (2 Barras)",
      price: "45",
      period: "2 horas",
      description: "Comparte la experiencia con alguien especial",
      features: ["2 barras reservadas", "Instructor compartido", "Ambiente íntimo", "Sesión de fotos incluida"]
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Planes y <span className="hero-text-gradient">Precios</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tus objetivos y presupuesto. 
            Todos nuestros planes incluyen equipamiento profesional y la guía de instructores certificados.
          </p>
        </div>

        {/* Main pricing plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary elegant-shadow scale-105' : 'elegant-shadow'} hover:shadow-lg transition-all duration-300`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Más Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">€{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Special offers */}
        <div className="bg-secondary/30 rounded-2xl p-8">
          <h3 className="text-3xl font-bold text-center mb-8">Opciones Especiales</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {specialOffers.map((offer, index) => (
              <Card key={index} className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{offer.title}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary">€{offer.price}</span>
                    <span className="text-muted-foreground">/{offer.period}</span>
                  </div>
                  <p className="text-muted-foreground">{offer.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {offer.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-4 h-4 text-primary mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Reservar Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment info */}
        <div className="text-center mt-12 p-6 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            💳 Aceptamos todas las formas de pago • 📅 Reservas con hasta 24h de anticipación • 
            🔄 Política de cancelación flexible
          </p>
        </div>
      </div>
    </section>
  );
};