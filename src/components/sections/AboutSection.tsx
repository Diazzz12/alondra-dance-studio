import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, Clock, Dumbbell, UsersRound } from "lucide-react";

export const AboutSection = () => {
  const features = [
    {
      icon: HeartPulse,
      title: "Calentamientos adaptados",
      description: "En Alondra cuidamos tu cuerpo con calentamientos adaptados a cada nivel, diseñados para mejorar movilidad, fuerza y prevenir lesiones"
    },
    {
      icon: Clock,
      title: "Reservas de hora y media",
      description: "Disfruta de una hora y media completa de entrenamiento libre, el tiempo ideal mejorar tu técnica sin prisas. Aquí entrenas a tu ritmo."
    },
    {
      icon: Dumbbell,
      title: "Material variado de yoga y pilates",
      description: "Mejora tu salud con nuestro material variado de yoga y pilates. Ideal para aumentar tu flexibilidad, equilibrar tu cuerpo y complementar tu entrenamiento de pole dance."
    },
    {
      icon: UsersRound,
      title: "Comunidad Alondra",
      description: "En Alondra encontrarás una comunidad real, cercana y sin juicios, donde cada persona entrena a su ritmo, se apoya y celebra cada progreso."
    }
  ];

  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Más que un <span className="hero-text-gradient">Espacio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          En Alondra Pole Space te ofrecemos una sala única para entrenar pole dance en todas sus versiones (Pole Sport, Exotic, Dinámico, Flow, Coreo…) en formato open pole y otras disciplinas como yoga o pilates. 
Sin clases, sin horarios fijos, con total libertad. 
Nuestro espacio esta diseñado para ofrecerte la mejor experiencia de entrenamiento: Barras, espejos, suelo seguro, iluminación pensado para que mejores tu técnica en un ambiente íntimo y motivador.
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
              Alondra Pole Space nace con el propósito de ofrecer un espacio especializado en entrenamiento libre de pole dance, donde cada persona pueda desarrollar su técnica y condición física con autonomía, en un entorno cuidado y profesional.
              </p>
              <p className="text-muted-foreground mb-6">
              El ave Alondra representa la libertad, la precisión del movimiento y la capacidad de superación. Estos valores inspiran nuestro proyecto: un espacio que fomenta la independencia en el entrenamiento, el bienestar físico y el crecimiento personal.
              </p>
              <p className="text-muted-foreground mb-6">
              En Alondra no impartimos clases dirigidas; cada persona entrena a su ritmo, utilizando una sala equipada para potenciar fuerza, flexibilidad y control corporal. Nuestro objetivo es ofrecer un entorno seguro, funcional y motivador para que cada sesión te acerque a tus metas.              </p>
              
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