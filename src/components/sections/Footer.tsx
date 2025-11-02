import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
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
                <img src={logo} alt="Alondra Pole Space" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-xl font-bold">Alondra Pole Space</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground text-sm">
                      Calle Valle Inclán 24<br />
                      Madrid, España
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/*<Phone className="w-5 h-5 text-primary" />
                   <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-muted-foreground text-sm">+34 123 456 789</p>
                  </div> */}
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground text-sm">alondrapolespace@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Horarios</p>
                    <div className="text-muted-foreground text-sm">
                      <p>Lun - Dom: 7:00 - 00:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8">
                <p className="font-medium mb-4">Síguenos</p>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    asChild
                  >
                    <a 
                      href="https://www.instagram.com/alondrapolespace/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-2"
                    asChild
                  >
                    <a 
                      href="https://www.tiktok.com/@alondrapolespace?_r=1&_t=ZN-914BGcXvZV0" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Map and how to get there */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cómo Llegar</h3>
              
              {/* Google Maps Embed */}
              <div className="rounded-lg overflow-hidden mb-4 h-64 border elegant-shadow">
                <iframe
                  src="https://www.google.com/maps?q=Calle+Valle+Inclán+24,+Madrid,+España&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación Alondra Pole Space - Calle Valle Inclán 24, Madrid"
                  className="w-full h-full"
                />
              </div>
              
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a 
                    href="https://maps.app.goo.gl/aTCxszzeMnVJHicU6?g_st=iw" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Abrir en Google Maps
                  </a>
                </Button>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">🚇 Transporte público</p>
                  <p>A tan solo 5 minutos caminando de la estación de Renfe de Maestra Justa Freire (Polideportivo de Aluche).</p>
                  <p>A 20 minutos del intercambiador de Aluche o del metro de aviación española. </p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground">🚌 Paradas de Autobús</p>
                  <p>17, 34, 138, 139, 483 y 487, entre otras.</p>
                </div>
                
                <div>
                  <p className="font-medium text-foreground">🚗 Parking</p>
                  <p>Es posible aparcar en la zona, suele haber plazas libres.</p>
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