import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Award } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen pt-20 pb-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Mi <span className="hero-text-gradient">Perfil</span>
            </h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y revisa tu historial de clases
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Form */}
            <Card className="lg:col-span-2 elegant-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Información Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellidos</Label>
                    <Input id="lastName" placeholder="Tus apellidos" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+34 123 456 789" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input id="birthDate" type="date" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Nivel de Experiencia</Label>
                  <select className="w-full p-2 border border-input rounded-md bg-background">
                    <option value="">Seleccionar nivel</option>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats & Activity */}
            <div className="space-y-6">
              {/* Profile Stats */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Mi Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm">Clases Tomadas</span>
                    </div>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="text-sm">Nivel Actual</span>
                    </div>
                    <Badge className="bg-primary">Intermedio</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">Miembro desde</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Enero 2024</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Clase Individual</p>
                        <p className="text-xs text-muted-foreground">15 Enero 2024</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Completada</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Clase Individual</p>
                        <p className="text-xs text-muted-foreground">12 Enero 2024</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Completada</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Clase en Pareja</p>
                        <p className="text-xs text-muted-foreground">8 Enero 2024</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Completada</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="elegant-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      Ver Historial Completo
                    </Button>
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Reservar Nueva Clase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Note about database connection */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              🔒 Para habilitar el guardado de perfil y funcionalidades completas, conecta tu proyecto a Supabase
            </p>
            <p className="text-sm text-muted-foreground">
              Una vez conectado, podrás guardar tu información, ver tu historial real y gestionar tus reservas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;