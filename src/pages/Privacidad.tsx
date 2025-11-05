import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacidad = () => {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="elegant-shadow border-0">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Política de Privacidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 leading-relaxed">
            <p>
              De acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), Alondra Pole Space informa que los datos personales facilitados a través del sitio web serán tratados con la finalidad de gestionar reservas, responder consultas y enviar comunicaciones relacionadas con los servicios.
            </p>
            <p>
              Base legal: consentimiento del usuario. Los datos se conservarán mientras exista una relación comercial o durante los plazos legales. Los usuarios pueden ejercer sus derechos enviando una solicitud a <a href="mailto:alondrapolespace@gmail.com" className="text-primary underline underline-offset-4">alondrapolespace@gmail.com</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacidad;


