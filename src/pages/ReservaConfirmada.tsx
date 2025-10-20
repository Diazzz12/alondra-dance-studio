import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const ReservaConfirmada = () => {
  return (
    <div className="min-h-screen pt-20 pb-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <Card className="elegant-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Reserva confirmada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Tu reserva se ha confirmado correctamente.
              </p>
              <p className="text-muted-foreground">
                Puedes consultar tus reservas activas en tu perfil.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button asChild variant="outline">
                  <Link to="/perfil">Ver reservas activas</Link>
                </Button>
                <Button asChild>
                  <Link to="/reservar">Hacer otra reserva</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReservaConfirmada;











