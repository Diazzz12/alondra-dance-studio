import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

type Reserva = {
  id: number;
  fecha: string;
  estado: string;
  franja_horaria_id: number;
  tipo_reserva_id: number;
  metodo_pago?: string;
  bono_usuario_id?: number | null;
  numero_barras?: number;
};

const Profile = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [bonos, setBonos] = useState<BonoActivo[]>([]);
  const [reservasActivas, setReservasActivas] = useState<Reserva[]>([]);
  const [reservasAnteriores, setReservasAnteriores] = useState<Reserva[]>([]);
  const [editorAbierto, setEditorAbierto] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;

      // Cargar datos de perfil (tabla profiles o fallback a perfiles)
      setEmail(user.user.email ?? "");
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("first_name,last_name,email,phone,birth_date,experience_level")
          .eq("user_id", user.user.id)
          .single();
        if (prof) {
          setFirstName(prof.first_name ?? "");
          setLastName(prof.last_name ?? "");
          setEmail((prof.email as string) ?? (user.user.email ?? ""));
          setPhone(prof.phone ?? "");
          setBirthDate(prof.birth_date ?? "");
          setExperience(prof.experience_level ?? "");
        }
      } catch {}
      if (!firstName && !lastName && !phone) {
        const { data: perf } = await supabase
          .from("perfiles" as any)
          .select("nombre,telefono")
          .eq("id", user.user.id)
          .single();
        if (perf) {
          const partes = String(perf.nombre ?? "").split(" ");
          setFirstName(partes[0] ?? "");
          setLastName(partes.slice(1).join(" ") ?? "");
          setPhone(perf.telefono ?? "");
        }
      }

      // Reservas del usuario
      const { data: reservasData } = await supabase
        .from("reservas")
        .select("id, fecha, estado, franja_horaria_id, tipo_reserva_id, metodo_pago, bono_usuario_id, numero_barras")
        .eq("usuario_id", user.user.id)
        .order("fecha", { ascending: false });

      const hoy = new Date();
      const activas: Reserva[] = [];
      const anteriores: Reserva[] = [];
      (reservasData || []).forEach((r: any) => {
        const fecha = new Date(r.fecha);
        if ((r.estado === 'confirmada' || r.estado === 'pendiente') && fecha >= new Date(hoy.toDateString())) {
          activas.push(r as Reserva);
        } else {
          anteriores.push(r as Reserva);
        }
      });
      setReservasActivas(activas);
      setReservasAnteriores(anteriores);

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
    // Suscripción en tiempo real a bonos del usuario
    const setupRealtime = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;
      const channel = supabase
        .channel('profile-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bonos_usuario', filter: `usuario_id=eq.${user.user.id}` }, async () => {
          const { data: vista } = await supabase
            .from('vista_bonos_activos')
            .select('bono_usuario_id, tipo_bono, clases_restantes, fecha_caducidad, dias_restantes')
            .eq('usuario_id', user.user.id);
          if (vista) {
            setBonos(vista.map((v: any) => ({ id: v.bono_usuario_id, tipo_bono: v.tipo_bono, clases_restantes: v.clases_restantes, fecha_caducidad: v.fecha_caducidad, dias_restantes: v.dias_restantes })));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas', filter: `usuario_id=eq.${user.user.id}` }, async () => {
          const { data: reservasData } = await supabase
            .from('reservas')
            .select('id, fecha, estado, franja_horaria_id, tipo_reserva_id, metodo_pago, bono_usuario_id, numero_barras')
            .eq('usuario_id', user.user.id)
            .order('fecha', { ascending: false });
          const hoy = new Date();
          const activas: Reserva[] = [];
          const anteriores: Reserva[] = [];
          (reservasData || []).forEach((r: any) => {
            const fecha = new Date(r.fecha);
            if ((r.estado === 'confirmada' || r.estado === 'pendiente') && fecha >= new Date(hoy.toDateString())) {
              activas.push(r as Reserva);
            } else {
              anteriores.push(r as Reserva);
            }
          });
          setReservasActivas(activas);
          setReservasAnteriores(anteriores);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtime();
  }, []);

  const guardarPerfil = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      setSaving(false);
      return;
    }
    try {
      // Actualizar email en auth si cambió
      if (email && email !== (user.user.email ?? "")) {
        await supabase.auth.updateUser({ email });
      }
      // Upsert en profiles
      await supabase.from("profiles").upsert({
        user_id: user.user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        email: email || null,
        phone: phone || null,
        birth_date: birthDate || null,
        experience_level: experience || null,
      }, { onConflict: "user_id" } as any);
    } catch (e) {
      // Fallback: upsert en perfiles (si existe ese esquema)
      try {
        await (supabase as any).from("perfiles").upsert({
          id: user.user.id,
          nombre: [firstName, lastName].filter(Boolean).join(" ") || null,
          telefono: phone || null,
        }, { onConflict: "id" });
      } catch {}
    } finally {
      setSaving(false);
      setEditorAbierto(false);
    }
  };
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

          <div className="space-y-8">
            {/* Encabezado y botón único de edición */}
            <Card className="elegant-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Información personal</span>
                  </span>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setEditorAbierto((v) => !v)}>
                    {editorAbierto ? "Cerrar" : "Editar información"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {editorAbierto && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                      <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Nivel de experiencia</Label>
                      <select id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background">
                        <option value="">Seleccionar nivel</option>
                        <option value="beginner">Principiante</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzado</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <Button className="bg-primary hover:bg-primary/90" onClick={guardarPerfil} disabled={saving}>
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditorAbierto(false)}>Cancelar</Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Reservas activas */}
            <Card className="elegant-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Reservas activas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservasActivas.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tienes reservas activas.</p>
                )}
                {reservasActivas.map((r) => {
                  const esSala = (r.numero_barras ?? 1) >= 3;
                  const usandoBono = (r.metodo_pago || '').toLowerCase() === 'bono' || !!r.bono_usuario_id;
                  const titulo = esSala
                    ? 'Reserva sala completa'
                    : usandoBono
                      ? 'Barra suelta (usando bono)'
                      : 'Barra suelta';
                  return (
                    <div key={r.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{titulo}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.fecha).toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">{r.estado}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Reservas anteriores */}
            <Card className="elegant-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Reservas anteriores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservasAnteriores.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aún no hay reservas anteriores.</p>
                )}
                {reservasAnteriores.map((r) => {
                  const esSala = (r.numero_barras ?? 1) >= 3;
                  const usandoBono = (r.metodo_pago || '').toLowerCase() === 'bono' || !!r.bono_usuario_id;
                  const titulo = esSala
                    ? 'Reserva sala completa'
                    : usandoBono
                      ? 'Barra suelta (usando bono)'
                      : 'Barra suelta';
                  return (
                    <div key={r.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{titulo}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.fecha).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{r.estado}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Bonos activos */}
            <Card className="elegant-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Bonos activos</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/bonos">Comprar Bono</Link>
                  </Button>
                </CardTitle>
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
                      <p className="text-xs text-muted-foreground mt-1">Puede reservar: {b.tipo_bono.toLowerCase().includes('mañanas') ? 'solo mañanas' : 'tarde/punta'}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{b.clases_restantes} clases</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Nota eliminada por requerimiento: simplificar a botón + reservas + bonos */}
        </div>
      </div>
    </div>
  );
};

export default Profile;