import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Clock, Users, MapPin } from "lucide-react";

const Booking = () => {
  const [selectedOption, setSelectedOption] = useState("individual");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const bookingOptions = [
    {
      id: "individual",
      name: "Barra Individual",
      description: "Clase personal con instructor dedicado",
      price: "25€",
      duration: "2 horas",
      capacity: "1 persona",
      icon: "👤"
    },
    {
      id: "couple",
      name: "Dos Barras (Pareja)",
      description: "Perfecto para entrenar con una amiga o pareja",
      price: "45€",
      duration: "2 horas",
      capacity: "2 personas",
      icon: "👥",
      popular: true
    },
    {
      id: "group",
      name: "Sala Completa",
      description: "Ideal para eventos privados o grupos grandes",
      price: "120€",
      duration: "2 horas",
      capacity: "Hasta 8 personas",
      icon: "👨‍👩‍👧‍👦"
    }
  ];

  const availableTimes = [
    "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"
  ];

  const selectedBooking = bookingOptions.find(option => option.id === selectedOption);

  return (
    <div className="min-h-screen pt-20 pb-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="hero-text-gradient">Reservar</span> Clase
            </h1>
            <p className="text-muted-foreground">
              Elige tu modalidad preferida y reserva tu sesión de pole dance
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <Card className="lg:col-span-2 elegant-shadow">
              <CardHeader>
                <CardTitle>Detalles de Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Option Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Tipo de Reserva</Label>
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {bookingOptions.map((option) => (
                      <div key={option.id} className="relative">
                        <label
                          htmlFor={option.id}
                          className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedOption === option.id
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{option.icon}</span>
                              <h3 className="font-semibold">{option.name}</h3>
                              {option.popular && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{option.duration}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{option.capacity}</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-primary">{option.price}</div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-semibold">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Horario</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 pt-4">
                  <Label className="text-base font-semibold">Información de Contacto</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input id="name" placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" placeholder="+34 123 456 789" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                    <Input id="notes" placeholder="Experiencia previa, objetivos, etc." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <div className="space-y-6">
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedBooking && (
                    <>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{selectedBooking.icon}</span>
                        <div>
                          <p className="font-medium">{selectedBooking.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedBooking.capacity}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duración:</span>
                          <span>{selectedBooking.duration}</span>
                        </div>
                        {selectedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha:</span>
                            <span>{new Date(selectedDate).toLocaleDateString('es-ES')}</span>
                          </div>
                        )}
                        {selectedTime && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hora:</span>
                            <span>{selectedTime}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{selectedBooking.price}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Studio Info */}
              <Card className="elegant-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Información del Estudio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground">Calle Principal 123, Madrid</p>
                  </div>
                  <div>
                    <p className="font-medium">Qué Traer</p>
                    <p className="text-muted-foreground">Ropa cómoda, toalla y agua</p>
                  </div>
                  <div>
                    <p className="font-medium">Política de Cancelación</p>
                    <p className="text-muted-foreground">Hasta 24h antes sin penalización</p>
                  </div>
                </CardContent>
              </Card>

              {/* Confirm Booking Button */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                disabled={!selectedDate || !selectedTime}
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>

          {/* Database connection note */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              🔒 Para procesar reservas reales, conecta tu proyecto a Supabase
            </p>
            <p className="text-sm text-muted-foreground">
              Una vez conectado, podrás gestionar disponibilidad, procesar pagos y enviar confirmaciones automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;