import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const PricingSection = () => {
  const individuales = [
    {
      name: "Barra suelta (tarde/punta)",
      price: "10",
      period: "1 sesión (1h30m)",
      description: "Flexible, para clientes individuales",
      features: ["1 barra", "Duración 1h30m"],
    },
    {
      name: "Barra suelta mañanas (L-V hasta 14:00)",
      price: "8",
      period: "1 sesión (1h30m)",
      description: "Precio reducido",
      features: ["1 barra", "Duración 1h30m"],
    },
  ];

  const bonos = [
    {
      name: "Bono 5 barras (tarde/punta)",
      price: "45",
      period: "Caducidad: 1 mes",
      description: "Precio base, recomendado para principiantes",
      features: ["5 sesiones", "Caduca en 1 mes"],
    },
    {
      name: "Bono 5 barras mañanas (L-V hasta 14:00)",
      price: "35",
      period: "Caducidad: 1 mes",
      description: "Precio base reducido, recomendado para principiantes",
      features: ["5 sesiones", "Caduca en 1 mes"],
    },
    {
      name: "Bono 10 barras (tarde/punta)",
      price: "80",
      period: "Caducidad: 3 meses",
      description: "Para la peñita guay",
      features: ["10 sesiones", "Caduca en 3 meses"],
    },
    {
      name: "Bono 10 barras mañanas (L-V hasta 14:00)",
      price: "67",
      period: "Caducidad: 1 mes",
      description: "Para peñita guay que madruga",
      features: ["10 sesiones", "Caduca en 1 mes"],
    },
  ];

  const sala = [
    {
      title: "Sala entera hasta 6 personas (tarde/punta)",
      price: "30",
      period: "1 sesión (1h30m)",
      description: "Sesión privada en horario tarde/punta",
      features: ["Hasta 6 personas", "3 barras", "Privacidad"]
    },
    {
      title: "Sala entera +6 personas (tarde/punta)",
      price: "40",
      period: "1 sesión (1h30m)",
      description: "Sesión para 7-12 personas en tarde/punta",
      features: ["7-12 personas", "3 barras", "Privacidad"]
    },
    {
      title: "Sala entera hasta 6 personas (mañanas L-V)",
      price: "27",
      period: "1 sesión (1h30m)",
      description: "Sesión mañanas L-V hasta 14:00",
      features: ["Hasta 6 personas", "3 barras", "Precio reducido"]
    },
    {
      title: "Sala entera +6 personas (mañanas L-V)",
      price: "35",
      period: "1 sesión (1h30m)",
      description: "Sesión 7-12 personas mañanas L-V",
      features: ["7-12 personas", "3 barras", "Precio reducido"]
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

        {/* Individual */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {individuales.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary elegant-shadow scale-105' : 'elegant-shadow'} hover:shadow-lg transition-all duration-300`}>
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
                <Button className="w-full" variant="outline" onClick={() => (window.location.href = '/reservar?pre=' + (index === 0 ? 'barra_tarde' : 'barra_mananas'))}>
                  Reservar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desplegables: Bonos y Sala (misma jerarquía visual) */}
        <Accordion type="multiple" defaultValue={["bonos","sala"]} className="rounded-2xl">
          <AccordionItem value="bonos" className="elegant-shadow rounded-2xl mb-8 p-2">
            <AccordionTrigger className="px-4 text-2xl md:text-3xl font-bold">Ver bonos</AccordionTrigger>
            <AccordionContent>
              <div className="px-2 pb-2">
                <p className="text-muted-foreground mb-6 text-center">Ahorra con packs y controla tu caducidad</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {bonos.map((plan, index) => (
                  <Card key={index} className="elegant-shadow hover:shadow-lg transition-all duration-300">
                    <CardHeader className="text-center pb-6">
                      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      <div className="mt-3">
                        <span className="text-3xl font-bold text-primary">€{plan.price}</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground mt-2">{plan.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <Check className="w-4 h-4 text-primary mr-2" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/reservar?pre=bonos')}>Ver disponibilidad</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sala" className="elegant-shadow rounded-2xl p-2">
            <AccordionTrigger className="px-4 text-2xl md:text-3xl font-bold">Reservar sala entera</AccordionTrigger>
            <AccordionContent>
              <div className="px-2 pb-2">
                <p className="text-muted-foreground mb-6 text-center">Opciones para grupos y eventos privados</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {sala.map((offer, index) => (
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
                      <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/reservar?pre=sala')}>Ver disponibilidad</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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