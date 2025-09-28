import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <Card className="lg:col-span-1 border-0 elegant-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-primary" />
                <span>Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Nombre" />
                <Input placeholder="Teléfono" />
              </div>
              <Input placeholder="Email" type="email" />
              <Textarea placeholder="¿Cómo podemos ayudarte?" rows={4} />
              <Button className="w-full bg-primary hover:bg-primary/90">
                Enviar Mensaje
              </Button>
            </CardContent>
          </Card>

          {/* Contact Info & Location */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img src={logo} alt="Alondra Pole Space" className="h-8 w-8" />
                <span className="text-xl font-bold">Alondra Pole Space</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground text-sm">
                      Calle Principal 123<br />
                      28001 Madrid, España
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-muted-foreground text-sm">+34 123 456 789</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground text-sm">info@alondrapolespace.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Horarios</p>
                    <div className="text-muted-foreground text-sm">
                      <p>Lun - Vie: 9:00 - 22:00</p>
                      <p>Sábado: 10:00 - 20:00</p>
                      <p>Domingo: 10:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8">
                <p className="font-medium mb-4">Síguenos</p>
                <div className="flex space-x-4">
                  <Button variant="outline" size="sm" className="p-2">
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="p-2">
                    <Facebook className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Map placeholder and how to get there */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cómo Llegar</h3>
              
              {/* Map placeholder */}
              <div className="bg-muted rounded-lg h-48 mb-4 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Mapa Interactivo</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">🚇 Metro</p>
                  <p>Línea 2 - Estación Sol (5 min caminando)</p>
                  <p>Línea 1 - Estación Gran Vía (8 min caminando)</p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground">🚌 Autobús</p>
                  <p>Líneas 3, 25, 39 - Parada Plaza Mayor</p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground">🚗 Parking</p>
                  <p>Parking Plaza Mayor (2 min caminando)</p>
                  <p>Parking San Miguel (5 min caminando)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal footer */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 Alondra Pole Space. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a>
              <a href="#" className="hover:text-primary transition-colors">Aviso Legal</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};