import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/checkout";

const Booking = () => {
  const [selectedOption, setSelectedOption] = useState<string>("barra");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [times, setTimes] = useState<{ label: string; franjaId: number; tipoReservaId: number; disabled: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pre = params.get("pre");
    if (pre === "sala") setSelectedOption("sala");
    else if (pre === "bonos" || pre === "bono") setSelectedOption("bono");
    else setSelectedOption("barra");
  }, []);

  // Cargar disponibilidades reales de Supabase por fecha seleccionada
  useEffect(() => {
    const load = async () => {
      if (!date) return;
      // No mostrar horas para fechas pasadas
      const today = new Date();
      const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startSelected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (startSelected < startToday) {
        setTimes([]);
        setSelectedTime("");
        return;
      }
      setSelectedTime("");
      const weekday = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"][date.getDay()];

      // 1) Traer franjas activas del día seleccionado
      const { data: franjas, error: e1 } = await supabase
        .from("franjas_horarias")
        .select("id,hora_inicio,hora_fin,tipo_reserva_id,activo")
        .eq("dia_semana", weekday)
        .eq("activo", true)
        .order("hora_inicio");
      if (e1) {
        console.error(e1);
        setTimes([]);
        return;
      }

      // 2) Traer disponibilidad agregada para esa fecha (puede no devolver filas para franjas sin reservas)
      const fechaISO = date.toISOString().slice(0,10);
      const { data: disp, error: e2 } = await supabase
        .from("vista_disponibilidad_diaria")
        .select("franja_horaria_id,barras_reservadas,barras_disponibles,fecha")
        .eq("fecha", fechaISO);
      if (e2) {
        console.error(e2);
      }
      const franjaIdToDisponibles = new Map<number, number>();
      (disp || []).forEach((d: any) => franjaIdToDisponibles.set(Number(d.franja_horaria_id), Number(d.barras_disponibles)));

      // 3) Calcular barras necesarias según selección
      const barrasNecesarias = selectedOption === "sala" ? 3 : 1; // barra o bono = 1

      // 4) Construir lista de horarios con disponibilidad
      const items = (franjas || []).map((f: any) => {
        const disponibles = franjaIdToDisponibles.has(f.id) ? franjaIdToDisponibles.get(f.id)! : 3;
        let disabled = disponibles < barrasNecesarias;
        const label = String(f.hora_inicio).slice(0,5);
        // Si la fecha seleccionada es hoy, deshabilitar horas ya pasadas
        if (startSelected.getTime() === startToday.getTime()) {
          const [hh, mm] = label.split(":").map(Number);
          const timeMs = hh * 60 + mm;
          const nowMs = today.getHours() * 60 + today.getMinutes();
          if (timeMs <= nowMs) disabled = true;
        }
        return { label, franjaId: f.id as number, tipoReservaId: Number(f.tipo_reserva_id), disabled };
      });
      setTimes(items);
    };
    load();
  }, [date, selectedOption]);

  return (
    <div className="min-h-screen pt-20 pb-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Reservar</h1>
            <p className="text-muted-foreground">Selecciona tipo y fecha</p>
          </div>

          <Card className="elegant-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOption} onValueChange={setSelectedOption}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barra">Barra suelta</SelectItem>
                  <SelectItem value="bono">Bono</SelectItem>
                  <SelectItem value="sala">Sala entera</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="elegant-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Fecha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  captionLayout="dropdown"
                  className="rounded-md border shadow-sm"
                />
              </div>
              {date && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold mb-3">Horarios</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {times.map((t) => {
                      const isSelected = selectedTime === t.label;
                      return (
                        <button
                          key={t.franjaId}
                          onClick={() => !t.disabled && setSelectedTime(t.label)}
                          disabled={t.disabled}
                          className={`text-sm h-9 rounded-md border px-3 transition ${
                            t.disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-accent'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTime && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Seleccionado: {selectedTime}</p>
                      <Button
                        onClick={async () => {
                          if (!date) return;
                          const sel = times.find(t => t.label === selectedTime);
                          if (!sel) return;
                          const fechaISO = date.toISOString().slice(0,10);
                          await startCheckout({
                            itemType: 'tipo_reserva',
                            itemId: sel.tipoReservaId,
                            successUrl: window.location.origin + '/?pago=ok',
                            cancelUrl: window.location.origin + '/?pago=cancelado',
                            fecha: fechaISO,
                            franjaId: sel.franjaId,
                            tipoReservaId: sel.tipoReservaId,
                          });
                        }}
                        className="h-9"
                      >
                        Reservar y pagar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;