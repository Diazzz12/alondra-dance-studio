import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Award, Shield } from "lucide-react";

export const AboutSection = () => {
  const features = [
    {
      icon: Heart,
      title: "Ambiente Empoderador",
      description: "Un espacio seguro donde puedes explorar tu fuerza y expresión personal sin juicios."
    },
    {
      icon: Users,
      title: "Comunidad Inclusiva",
      description: "Únete a nuestra familia donde cada persona es valorada y apoyada en su journey."
    },
    {
      icon: Award,
      title: "Instructores Certificados",
      description: "Aprende con profesionales experimentados que priorizan tu seguridad y progreso."
    },
    {
      icon: Shield,
      title: "Equipamiento Premium",
      description: "Barras de alta calidad y colchonetas profesionales para tu seguridad y comodidad."
    }
  ];

  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Más que un <span className="hero-text-gradient">Estudio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            En Alondra Pole Space creemos que el pole dance es mucho más que ejercicio: 
            es una forma de arte que fortalece el cuerpo, la mente y el espíritu. 
            Ofrecemos un espacio donde cada persona puede descubrir su potencial único.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6 border-0 elegant-shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 md:p-12 elegant-shadow">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">Nuestra Historia</h3>
              <p className="text-muted-foreground mb-6">
                Fundado en 2019, Alondra Pole Space nació de la pasión por crear un espacio 
                donde las personas pudieran explorar el pole dance en todas sus formas: 
                fitness, arte y expresión personal.
              </p>
              <p className="text-muted-foreground mb-6">
                Desde nuestros inicios, hemos crecido hasta convertirnos en la academia 
                de referencia en la ciudad, manteniendo siempre nuestros valores de 
                inclusión, seguridad y excelencia en la enseñanza.
              </p>
              <div className="flex items-center space-x-8">
                <div>
                  <div className="text-2xl font-bold text-primary">5+</div>
                  <div className="text-sm text-muted-foreground">Años</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Estudiantes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Clases</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-6xl font-bold text-primary/30">🎭</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};