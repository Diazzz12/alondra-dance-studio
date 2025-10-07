import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Pago = {
  id: number;
  cantidad: number;
  estado: string;
  fecha_pago: string;
  tipo: string;
  transaccion_id: string | null;
};

type BonoActivo = {
  id: number;
  tipo_bono: string;
  clases_restantes: number;
  fecha_caducidad: string;
  dias_restantes: number;
};

const Profile = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [bonos, setBonos] = useState<BonoActivo[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      // Pagos recientes
      const { data: pagosData } = await supabase
        .from("pagos")
        .select("id,cantidad,estado,fecha_pago,tipo,transaccion_id")
        .eq("usuario_id", user.user.id)
        .order("fecha_pago", { ascending: false })
        .limit(5);
      setPagos(pagosData || []);

      // Bonos activos con días restantes (usamos la vista si existe; si no, fallback a join)
      const { data: vista } = await supabase
        .from("vista_bonos_activos")
        .select("bono_usuario_id, tipo_bono, clases_restantes, fecha_caducidad, dias_restantes")
        .eq("usuario_id", user.user.id);
      if (vista) {
        setBonos(
          vista.map((v: any) => ({
            id: v.bono_usuario_id,
            tipo_bono: v.tipo_bono,
            clases_restantes: v.clases_restantes,
            fecha_caducidad: v.fecha_caducidad,
            dias_restantes: v.dias_restantes,
          }))
        );
      } else {
        const { data: bonosData } = await supabase
          .from("bonos_usuario")
          .select("id,clases_restantes,fecha_caducidad,estado,tipos_bono(nombre)")
          .eq("usuario_id", user.user.id)
          .eq("estado", "activo");
        setBonos(
          (bonosData || []).map((b: any) => ({
            id: b.id,
            tipo_bono: b.tipos_bono?.nombre ?? "Bono",
            clases_restantes: b.clases_restantes,
            fecha_caducidad: b.fecha_caducidad,
            dias_restantes: Math.max(
              Math.ceil((new Date(b.fecha_caducidad).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
              0
            ),
          }))
        );
      }
    };
    load();
    // Suscripción en tiempo real a pagos y bonos del usuario
    const setupRealtime = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;
      const channel = supabase
        .channel('profile-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos', filter: `usuario_id=eq.${user.user.id}` }, async () => {
          const { data: pagosData } = await supabase
            .from('pagos')
            .select('id,cantidad,estado,fecha_pago,tipo,transaccion_id')
            .eq('usuario_id', user.user.id)
            .order('fecha_pago', { ascending: false })
            .limit(5);
          setPagos(pagosData || []);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bonos_usuario', filter: `usuario_id=eq.${user.user.id}` }, async () => {
          const { data: vista } = await supabase
            .from('vista_bonos_activos')
            .select('bono_usuario_id, tipo_bono, clases_restantes, fecha_caducidad, dias_restantes')
            .eq('usuario_id', user.user.id);
          if (vista) {
            setBonos(vista.map((v: any) => ({ id: v.bono_usuario_id, tipo_bono: v.tipo_bono, clases_restantes: v.clases_restantes, fecha_caducidad: v.fecha_caducidad, dias_restantes: v.dias_restantes })));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtime();
  }, []);
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

              {/* Pagos recientes */}
              <Card className="elegant-shadow">
                <CardHeader>
                <CardTitle className="text-lg">Pagos recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pagos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
                  )}
                  {pagos.map((p) => (
                    <div key={p.id} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{p.tipo === 'bono' ? 'Compra de bono' : 'Reserva'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.fecha_pago).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">€{p.cantidad.toFixed(2)}</span>
                        <Badge variant="outline" className="text-xs capitalize">{p.estado}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Bonos activos */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Bonos activos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bonos.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tienes bonos activos.</p>
                  )}
                  {bonos.map((b) => (
                    <div key={b.id} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{b.tipo_bono}</p>
                        <p className="text-xs text-muted-foreground">Caduca: {new Date(b.fecha_caducidad).toLocaleDateString()} ({b.dias_restantes} días)</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{b.clases_restantes} clases</Badge>
                    </div>
                  ))}
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