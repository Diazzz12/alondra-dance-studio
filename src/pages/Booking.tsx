import { useEffect, useMemo, useState } from "react";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { startCheckout } from "@/lib/checkout";
import { Input } from "@/components/ui/input";

const Booking = () => {
  const [selectedOption, setSelectedOption] = useState<string>("barra");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [times, setTimes] = useState<{ label: string; franjaId: number; tipoReservaId: number; disponibles: number; disabled: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [tiposCatalogo, setTiposCatalogo] = useState<{
    oneBarId: number | null;
    oneBarPrice: number | null;
    threeBarsId: number | null;
    threeBarsPrice: number | null;
    oneBarMorningId?: number | null;
    oneBarMorningPrice?: number | null;
    oneBarAfternoonId?: number | null;
    oneBarAfternoonPrice?: number | null;
  }>({ oneBarId: null, oneBarPrice: null, threeBarsId: null, threeBarsPrice: null, oneBarMorningId: null, oneBarMorningPrice: null, oneBarAfternoonId: null, oneBarAfternoonPrice: null });
  const [bonoDisponible, setBonoDisponible] = useState<{ bono_usuario_id: number; clases_restantes: number; fecha_caducidad: string; tipo_bono?: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [coupon, setCoupon] = useState<string>("");
  const [acceptedNorms, setAcceptedNorms] = useState<boolean>(false);
  const [couponStatus, setCouponStatus] = useState<"valid" | "invalid" | null>(null);

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

      // 1) Traer todas las franjas activas del día seleccionado
      // NOTA: Las franjas horarias son COMPARTIDAS entre todos los tipos de reserva
      // Solo hay UNA franja por hora que comparten barra suelta, sala entera, etc.
      const { data: franjas, error: e1 } = await (supabase as any)
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

      // 2) Agrupar por hora_inicio para mostrar cada hora solo una vez
      // (aunque solo debería haber una franja por hora, agrupamos por si acaso)
      const horasUnicas = new Map<string, any>();
      (franjas || []).forEach((f: any) => {
        const horaKey = String(f.hora_inicio).slice(0,5);
        if (!horasUnicas.has(horaKey)) {
          horasUnicas.set(horaKey, f);
        }
      });
      const franjasFiltradas = Array.from(horasUnicas.values());

      // 3) Traer disponibilidad agregada para esa fecha (puede no devolver filas para franjas sin reservas)
      const fechaISO = date.toISOString().slice(0,10);
      const { data: disp, error: e2 } = await (supabase as any)
        .from("vista_disponibilidad_diaria")
        .select("franja_horaria_id,barras_reservadas,barras_disponibles,fecha")
        .eq("fecha", fechaISO);
      if (e2) {
        console.error(e2);
      }
      const franjaIdToDisponibles = new Map<number, number>();
      (disp || []).forEach((d: any) => franjaIdToDisponibles.set(Number(d.franja_horaria_id), Number(d.barras_disponibles)));

      // 4) Calcular barras necesarias según selección
      const barrasNecesarias = selectedOption === "sala" ? 3 : 1; // barra o bono = 1

      // 5) Construir lista de horarios con disponibilidad
      const items = franjasFiltradas.map((f: any) => {
        const label = String(f.hora_inicio).slice(0,5);
        
        // Determinar el tipo_reserva_id correcto según la opción seleccionada
        let tipoReservaId = Number(f.tipo_reserva_id);
        if (selectedOption === "sala" && tiposCatalogo.threeBarsId) {
          tipoReservaId = tiposCatalogo.threeBarsId;
        } else if ((selectedOption === "barra" || selectedOption === "bono") && tiposCatalogo.oneBarId) {
          tipoReservaId = tiposCatalogo.oneBarId;
        }
        
        // Usar el franjaId directamente (todas las reservas usan la misma franja física)
        const franjaIdCorrecto = f.id;
        
        // Calcular disponibilidad (todas las franjas comparten las mismas 3 barras)
        const disponibles = franjaIdToDisponibles.has(franjaIdCorrecto) 
          ? franjaIdToDisponibles.get(franjaIdCorrecto)! 
          : 3;
        let disabled = disponibles < barrasNecesarias;
        
        // Si la fecha seleccionada es hoy, deshabilitar horas ya pasadas
        if (startSelected.getTime() === startToday.getTime()) {
          const [hh, mm] = label.split(":").map(Number);
          const timeMs = hh * 60 + mm;
          const nowMs = today.getHours() * 60 + today.getMinutes();
          if (timeMs <= nowMs) disabled = true;
        }
        
        return { label, franjaId: franjaIdCorrecto as number, tipoReservaId, disponibles, disabled };
      });
      setTimes(items);
    };
    load();
  }, [date, selectedOption, tiposCatalogo]);

  // Cargar catálogo de tipos (1 barra mañana/tarde y 3 barras) una vez
  useEffect(() => {
    const loadTipos = async () => {
      const { data, error } = await (supabase as any)
        .from("tipos_reserva")
        .select("id,nombre,numero_barras,precio_entrada,activo")
        .eq("activo", true);
      if (error) {
        console.error(error);
        return;
      }
      const ones = (data || []).filter((t: any) => Number(t.numero_barras) === 1);
      const oneMorning = ones.find((t: any) => Number(t.id) === 4) || ones.find((t: any) => String(t.nombre).toLowerCase().includes('mañ')); // prefer id 4
      const oneAfternoon = ones.find((t: any) => Number(t.id) !== (oneMorning ? Number(oneMorning.id) : -1)) || null;
      const oneFallback = ones[0] || null;
      const three = (data || []).find((t: any) => Number(t.numero_barras) === 3);
      setTiposCatalogo({
        oneBarId: oneFallback ? Number(oneFallback.id) : null,
        oneBarPrice: oneFallback ? Number(oneFallback.precio_entrada) : null,
        threeBarsId: three ? Number(three.id) : null,
        threeBarsPrice: three ? Number(three.precio_entrada) : null,
        oneBarMorningId: oneMorning ? Number(oneMorning.id) : (oneFallback ? Number(oneFallback.id) : null),
        oneBarMorningPrice: oneMorning ? Number(oneMorning.precio_entrada) : (oneFallback ? Number(oneFallback.precio_entrada) : null),
        oneBarAfternoonId: oneAfternoon ? Number(oneAfternoon.id) : (oneFallback ? Number(oneFallback.id) : null),
        oneBarAfternoonPrice: oneAfternoon ? Number(oneAfternoon.precio_entrada) : (oneFallback ? Number(oneFallback.precio_entrada) : null),
      });
    };
    loadTipos();
  }, []);

  // Comprobar bono activo si se escoge "bono"
  useEffect(() => {
    const loadBono = async () => {
      if (selectedOption !== "bono") {
        setBonoDisponible(null);
        return;
      }
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        setBonoDisponible(null);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("vista_bonos_activos")
        .select("bono_usuario_id,clases_restantes,fecha_caducidad,tipo_bono")
        .eq("usuario_id", user.user.id)
        .order("fecha_caducidad", { ascending: true });
      if (error) {
        console.error(error);
        setBonoDisponible(null);
        return;
      }
      const elegible = (data || []).find((b: any) => Number(b.clases_restantes) > 0);
      if (elegible) {
        setBonoDisponible({
          bono_usuario_id: Number(elegible.bono_usuario_id),
          clases_restantes: Number(elegible.clases_restantes),
          fecha_caducidad: String(elegible.fecha_caducidad),
          tipo_bono: String(elegible.tipo_bono),
        });
      } else {
        setBonoDisponible(null);
      }
    };
    loadBono();
  }, [selectedOption]);

  const franjaParteDia = useMemo(() => {
    if (!selectedTime) return "";
    const [hhStr] = selectedTime.split(":");
    const hh = Number(hhStr);
    if (hh < 24) return "Tarde";
    return "Noche";
  }, [selectedTime]);

  const isMorning = useMemo(() => {
    return false; // Ya no hay opciones de mañanas
  }, [selectedTime]);

  

  return (
    <div className="min-h-screen pt-20 pb-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Reservar</h1>
            <p className="text-muted-foreground">Selecciona modalidad y fecha</p>
          </div>

          <Card className="elegant-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Modalidad</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOption} onValueChange={setSelectedOption}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barra">Barra individual</SelectItem>
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
                  locale={es}
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
                    <div className="mt-6 space-y-3">
                      <Card className="elegant-shadow">
                        <CardHeader>
                          <CardTitle className="text-base">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Modalidad</span>
                            <span className="font-medium">
                              {selectedOption === 'barra' && 'Barra suelta'}
                              {selectedOption === 'bono' && 'Bono (1 uso)'}
                              {selectedOption === 'sala' && 'Sala completa'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha</span>
                            <span className="font-medium">{date?.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horario</span>
                            <span className="font-medium">{selectedTime} · {franjaParteDia}</span>
                          </div>
                          {selectedOption !== 'bono' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Precio</span>
                                <span className="font-semibold">€{
                                  (
                                    selectedOption === 'sala'
                                      ? (tiposCatalogo.threeBarsPrice ?? 0)
                                      : (isMorning ? (tiposCatalogo.oneBarMorningPrice ?? tiposCatalogo.oneBarPrice ?? 0) : (tiposCatalogo.oneBarAfternoonPrice ?? tiposCatalogo.oneBarPrice ?? 0))
                                  ).toFixed(2)
                                }</span>
                              </div>
                              <div className="mt-3 max-w-sm">
                                <label htmlFor="coupon" className="block text-xs mb-1 text-muted-foreground">Código de descuento</label>
                                <div className="flex gap-2">
                                  <Input id="coupon" placeholder="Introduce tu cupón" value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponStatus(null); }} />
                                  <Button
                                    variant="outline"
                                    className="h-9"
                                    onClick={async () => {
                                      try {
                                        if (!coupon.trim()) { setCouponStatus('invalid'); return; }
                                        const { data: user } = await supabase.auth.getUser();
                                        if (!user?.user?.id) { setCouponStatus('invalid'); return; }
                                        const itemType = 'tipo_reserva';
                                        const itemId = (selectedOption === 'sala'
                                          ? tiposCatalogo.threeBarsId ?? null
                                          : (isMorning ? tiposCatalogo.oneBarMorningId ?? tiposCatalogo.oneBarId ?? null : tiposCatalogo.oneBarAfternoonId ?? tiposCatalogo.oneBarId ?? null)
                                        );
                                        if (!itemId) { setCouponStatus('invalid'); return; }
                                        const precio = (selectedOption === 'sala'
                                          ? (tiposCatalogo.threeBarsPrice ?? 0)
                                          : (isMorning ? (tiposCatalogo.oneBarMorningPrice ?? tiposCatalogo.oneBarPrice ?? 0) : (tiposCatalogo.oneBarAfternoonPrice ?? tiposCatalogo.oneBarPrice ?? 0))
                                        );
                                        const { data, error } = await (supabase as any).rpc('validar_cupon', {
                                          _codigo: coupon.trim(),
                                          _usuario_id: user.user.id,
                                          _tipo_item: itemType,
                                          _item_id: itemId,
                                          _precio: precio
                                        });
                                        if (error) { console.error(error); setCouponStatus('invalid'); return; }
                                        if (Array.isArray(data) && data.length && data[0].valido) {
                                          setCouponStatus('valid');
                                        } else {
                                          setCouponStatus('invalid');
                                        }
                                      } catch (e) {
                                        console.error(e);
                                        setCouponStatus('invalid');
                                      }
                                    }}
                                  >
                                    Validar
                                  </Button>
                                </div>
                                {couponStatus === 'valid' && (
                                  <p className="text-xs text-green-600 mt-1">Cupón válido. Se aplicará al pagar.</p>
                                )}
                                {couponStatus === 'invalid' && (
                                  <p className="text-xs text-destructive mt-1">Cupón inválido.</p>
                                )}
                              </div>
                            </>
                          )}
                          
                          {selectedOption === 'bono' && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bono</span>
                              <span className="font-medium">
                                {bonoDisponible
                                  ? bonoDisponible.fecha_caducidad
                                    ? `${bonoDisponible.clases_restantes} usos restantes · caduca ${new Date(bonoDisponible.fecha_caducidad).toLocaleDateString()}`
                                    : `${bonoDisponible.clases_restantes} usos restantes · Bono listo para usar`
                                  : 'No tienes bonos activos'}
                              </span>
                            </div>
                          )}
                          {/* Disponibilidad de barras para la franja seleccionada */}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Barras disponibles</span>
                            <span className="font-medium">
                              {(() => {
                                const sel = times.find(t => t.label === selectedTime);
                                return sel ? sel.disponibles : 0;
                              })()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Aceptación de normas */}
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={acceptedNorms}
                            onChange={(e) => setAcceptedNorms(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span>
                            He leído y acepto las{' '}
                            <Link to="/normas" className="text-primary underline underline-offset-4" target="_blank">Normas de uso</Link>
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        {selectedOption === 'bono' && !bonoDisponible ? (
                          <>
                            <p className="text-sm text-destructive">Necesitas comprar un bono antes de reservar con bono.</p>
                            <Button
                              variant="outline"
                              className="h-9"
                              onClick={() => { window.location.href = '/?pre=bonos'; }}
                            >
                              Comprar bono
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled={loadingAction || !acceptedNorms}
                            onClick={async () => {
                              if (!date) return;
                              const sel = times.find(t => t.label === selectedTime);
                              if (!sel) return;
                              if (!acceptedNorms) { alert('Debes aceptar las Normas de uso.'); return; }
                              const fechaISO = date.toISOString().slice(0,10);
                              try {
                                setLoadingAction(true);
                                if (selectedOption === 'bono') {
                                  const { data: user } = await supabase.auth.getUser();
                                  if (!user?.user?.id || !bonoDisponible) return;
                                  // Validación de tramo horario según tipo de bono
                                  const bonoEsMananas = (bonoDisponible.tipo_bono || '').toLowerCase().includes('mañanas');
                                  if (bonoEsMananas && !isMorning) {
                                    alert('Este bono solo es válido para mañanas. Elige un horario antes de las 14:00.');
                                    return;
                                  }
                                  const bonoEsTarde = (bonoDisponible.tipo_bono || '').toLowerCase().includes('tarde');
                                  const bonoEsPunta = (bonoDisponible.tipo_bono || '').toLowerCase().includes('punta');
                                  if ((bonoEsTarde || bonoEsPunta) && isMorning) {
                                    alert('Este bono es para tarde/punta. Elige un horario a partir de las 14:00.');
                                    return;
                                  }
                                  const { data: reservaId, error } = await (supabase as any).rpc('crear_reserva', {
                                    _usuario_id: user.user.id,
                                    _fecha: fechaISO,
                                    _franja_id: sel.franjaId,
                                    _tipo_reserva_id: tiposCatalogo.oneBarId,
                                    _metodo_pago: 'bono',
                                    _bono_usuario_id: bonoDisponible.bono_usuario_id,
                                    _precio_pagado: 0,
                                  });
                                  if (error) throw error;

                                  // Enviar email de confirmación
                                  try {
                                    console.log('📧 Intentando enviar email para reserva ID:', reservaId);
                                    if (reservaId) {
                                      console.log('📧 Llamando a send-booking-email...');
                                      const emailResponse = await supabase.functions.invoke('send-booking-email', {
                                        body: { reserva_id: reservaId }
                                      });
                                      console.log('📧 Respuesta del email:', emailResponse);
                                    } else {
                                      console.log('⚠️ No hay reservaId para enviar email');
                                    }
                                  } catch (emailError) {
                                    console.error('❌ Error enviando email:', emailError);
                                    console.error('❌ Detalles del error:', emailError.message);
                                    // No bloqueamos el flujo si falla el email
                                  }

                                  window.location.href = '/reserva-confirmada';
                                } else {
                                  await startCheckout({
                                      itemType: 'tipo_reserva',
                                      itemId: (selectedOption === 'sala'
                                        ? tiposCatalogo.threeBarsId ?? undefined
                                        : (isMorning ? tiposCatalogo.oneBarMorningId ?? tiposCatalogo.oneBarId ?? undefined : tiposCatalogo.oneBarAfternoonId ?? tiposCatalogo.oneBarId ?? undefined)
                                      ),
                                      successUrl: window.location.origin + '/reserva-confirmada',
                                      cancelUrl: window.location.origin + '/?pago=cancelado',
                                      fecha: fechaISO,
                                      franjaId: sel.franjaId,
                                      tipoReservaId: (selectedOption === 'sala'
                                        ? tiposCatalogo.threeBarsId ?? undefined
                                        : (isMorning ? tiposCatalogo.oneBarMorningId ?? tiposCatalogo.oneBarId ?? undefined : tiposCatalogo.oneBarAfternoonId ?? tiposCatalogo.oneBarId ?? undefined)
                                        ),
                                      couponCode: coupon || null,
                                  });
                                }
                              } catch (err) {
                                console.error(err);
                                alert('No se pudo completar la acción. Inténtalo de nuevo.');
                              } finally {
                                setLoadingAction(false);
                              }
                            }}
                            className="h-9"
                          >
                            {selectedOption === 'bono' ? 'Reservar con bono' : 'Reservar y pagar'}
                          </Button>
                        )}
                      </div>
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