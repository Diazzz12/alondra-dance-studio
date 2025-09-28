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
      question: "¿Necesito experiencia previa para empezar?",
      answer: "¡Para nada! Nuestras clases están diseñadas para todos los niveles, desde principiantes absolutos hasta avanzados. Nuestros instructores adaptan cada sesión a tu nivel y ritmo de aprendizaje. Lo más importante es venir con ganas de aprender y divertirse."
    },
    {
      question: "¿Qué debo traer a mi primera clase?",
      answer: "Solo necesitas ropa cómoda que te permita moverte libremente. Recomendamos shorts o leggings y una camiseta. Nosotros proporcionamos todas las barras, colchonetas y equipamiento necesario. También ofrecemos toallas limpias y agua."
    },
    {
      question: "¿Es seguro el pole dance?",
      answer: "Absolutamente. La seguridad es nuestra prioridad número uno. Nuestras barras están instaladas profesionalmente y se revisan regularmente. Todos nuestros instructores están certificados y enseñan técnicas progresivas que minimizan el riesgo de lesiones. Comenzamos siempre con un calentamiento adecuado."
    },
    {
      question: "¿Cuánto tiempo duran las clases?",
      answer: "Cada sesión dura 2 horas completas, lo que nos permite incluir un calentamiento apropiado, técnica, práctica libre y enfriamiento. Este tiempo es ideal para aprender de manera efectiva sin sobrecargarte."
    },
    {
      question: "¿Puedo reservar con anticipación?",
      answer: "Sí, puedes reservar hasta con una semana de anticipación. Recomendamos reservar con al menos 24 horas de antelación para garantizar tu lugar, especialmente en horarios populares como tardes y fines de semana."
    },
    {
      question: "¿Qué opciones de reserva tienen?",
      answer: "Ofrecemos tres opciones: barra individual (perfecta para clases personalizadas), dos barras (ideal para entrenar con una amiga o pareja), y sala completa (hasta 8 personas, perfecta para eventos especiales o grupos)."
    },
    {
      question: "¿Cuál es la política de cancelación?",
      answer: "Puedes cancelar o reprogramar tu clase hasta 24 horas antes sin penalización. Las cancelaciones con menos de 24 horas de anticipación están sujetas a una penalización del 50%. No se realizan devoluciones por ausencias sin previo aviso."
    },
    {
      question: "¿Ofrecen clases para hombres?",
      answer: "¡Por supuesto! El pole dance es para todos, independientemente del género. Tenemos estudiantes de todos los géneros y edades. Nuestro ambiente es completamente inclusivo y welcoming para todas las personas."
    },
    {
      question: "¿Los bonos tienen fecha de caducidad?",
      answer: "Sí, el bono de 4 clases tiene una validez de 2 meses y el bono de 8 clases tiene una validez de 3 meses desde la fecha de compra. Esto asegura que mantengas una práctica regular para obtener los mejores resultados."
    },
    {
      question: "¿Puedo traer un acompañante a ver la clase?",
      answer: "Para mantener un ambiente cómodo y sin distracciones para todos nuestros estudiantes, las clases son solo para participantes. Sin embargo, organizamos eventos especiales y demostraciones donde familiares y amigos son bienvenidos."
    }
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