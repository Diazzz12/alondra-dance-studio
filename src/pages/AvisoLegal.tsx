import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AvisoLegal = () => {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="elegant-shadow border-0">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Aviso Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              En cumplimiento con la Ley 34/2002, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se informa que el presente sitio web www.alondrapolespace.es es titularidad de Alondra Pole Space. Correo electrónico de contacto: alondrapolespace@gmail.com.
            </p>
            <p>
              La utilización del sitio web implica la aceptación plena de todas las disposiciones incluidas en este Aviso Legal. El usuario se compromete a hacer un uso adecuado del sitio web y de sus contenidos, conforme a la legislación vigente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvisoLegal;


