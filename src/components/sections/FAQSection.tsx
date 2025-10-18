import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const FAQSection = () => {
  const faqs = [
    {
      question: "¿Puedo reservar con mi bono la sala entera?",
      answer: "Sin problema, solo tienes que reservar las 3 barras con el bono y ya dispones de la sala completa para ti."
    },
    {
      question: "¿Puedo reservar con mi bono la sala para otra persona?",
      answer: "Claro, todos nuestros bonos son no nominales."
    },
    {
      question: "¿Qué debo llevar a la sala?",
      answer: "Solo necesitas ropa cómoda que te permita moverte libremente. Recomendamos shorts o leggings y una camiseta. Nosotros proporcionamos todas las barras, colchonetas y equipamiento necesario. También ofrecemos esterillas limpias y agua."
    },
    {
      question: "¿Es seguro el pole dance?",
      answer: "Absolutamente. La seguridad es nuestra prioridad número uno. Nuestras barras están instaladas se revisan regularmente. No te olvides de comenzar siempre con un calentamiento adecuado, dispones de ellos en la sala"
    },
    {
      question: "¿Cuánto tiempo dura la reserva de 1 barra?",
      answer: "Cada sesión dura 1 hora y media, lo que permite incluir un calentamiento apropiado, técnica y práctica libre. Este tiempo es ideal para practicar de manera efectiva sin sobrecargarte."
    },
    {
      question: "¿Qué opciones de reserva tengo?",
      answer: "Ofrecemos la opción de reserva de barra individual, un bono de 10 sesiones con duración de 3 meses o de 5 sesiones mensual."
    },
    {
      question: "¿Cuál es la política de cancelación?",
      answer: "Puedes cancelar o reprogramar tu clase hasta 24 horas antes sin penalización. Las cancelaciones con menos de 24 horas de anticipación están sujetas a una penalización del 50% (pendiente de ver). No se realizan devoluciones por ausencias sin previo aviso."
    },
    {
      question: "¿Puedo traer un acompañante a ver la clase?",
      answer: "Para mantener un ambiente cómodo y sin distracciones para toda nuestra comunidad las barras son de uso personal. Sin embargo, puedes reservar la sala completa donde se permiten hasta grupos de 12 personas."
    },
  ];

  return (
    <section id="faq" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Preguntas <span className="hero-text-gradient">Frecuentes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Resolvemos las dudas más comunes sobre nuestras clases, 
            instalaciones y políticas para que puedas comenzar tu journey con confianza.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card rounded-lg px-6 border-0 elegant-shadow"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Tienes otras preguntas?
          </p>
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Contáctanos Directamente
          </Button>
        </div>
      </div>
    </section>
  );
};