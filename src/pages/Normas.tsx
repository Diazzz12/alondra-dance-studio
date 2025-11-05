import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Normas = () => {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="elegant-shadow border-0">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">🩰 NORMAS DE USO Y FUNCIONAMIENTO – ALONDRA POLE SPACE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 leading-relaxed">
            <div>
              <p className="font-semibold">1. Naturaleza del servicio</p>
              <p>Alondra Pole Space es un espacio privado de alquiler por horas destinado a la práctica libre de pole dance y disciplinas afines.</p>
              <p>No se imparten clases ni se ofrecen servicios de enseñanza.</p>
              <p>Cada usuario es responsable de su propio entrenamiento, uso del material y condiciones de práctica.</p>
            </div>

            <hr className="my-2 opacity-50" />

            <div>
              <p className="font-semibold">2. Reservas y acceso</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Las reservas se realizan exclusivamente por los canales oficiales de Alondra Pole Space.</li>
                <li>El acceso y el código de entrada se envía 24 horas antes de la reserva por correo. Si no lo has recibido, contacta con nosotros.</li>
                <li>Cada reserva corresponde a una barra individual y un usuario.</li>
                <li>Si se desea el uso exclusivo de la sala, se deberán reservar la sala completa o las 3 barras a la vez, lo que permitirá el acceso de hasta 6 personas o hasta 12 en función de la opción elegida.</li>
              </ul>
            </div>

            <hr className="my-2 opacity-50" />

            <div>
              <p className="font-semibold">3. Uso responsable y mantenimiento</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Las instalaciones cuentan con videovigilancia 24 h por motivos de seguridad.</li>
                <li>Es obligatorio mantener la sala limpia y ordenada, dejando las barras y el material en las mismas condiciones en las que se encontraron.</li>
                <li>No se permite manipular el sistema eléctrico, aire acondicionado ni iluminación fuera del uso normal.</li>
                <li>Si eres la última persona en usar la sala, asegúrate de apagar luces y aparatos eléctricos antes de salir.</li>
                <li>Está prohibido el consumo de alcohol, fumar o introducir comida dentro del espacio de entrenamiento.</li>
                <li>El uso de magnesio líquido está permitido siempre que no manche paredes ni suelo.</li>
                <li>Cumplimiento del horario: El acceso y salida deben realizarse dentro del horario reservado, contando con un margen máximo de 5 minutos para abandonar la sala</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">4. Responsabilidad</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>El cliente es responsable de cualquier daño causado a las instalaciones, barras o equipos, ya sea por uso indebido, negligencia o incumplimiento de estas normas.</li>
                <li>En caso de producirse daños, el usuario estará obligado a reparar o abonar la totalidad del perjuicio.</li>
                <li>El uso de las instalaciones implica la aceptación de estas normas y la práctica bajo plena responsabilidad del usuario.</li>
                <li>Alondra Pole Space no se hace responsable de lesiones, accidentes o pérdida de objetos personales durante el uso del local.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">5. Material y decoración</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Se permite el uso de material personal (colchonetas, straps, etc.), siempre que no dañe el suelo ni las barras.</li>
                <li>Queda prohibida la colocación de vinilos, carteles o decoración sin autorización previa.</li>
                <li>No se permite usar resinas, aceites o sustancias que puedan alterar la adherencia de las barras.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">6. Cancelaciones y modificaciones</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Las cancelaciones se podrán realizar con al menos 12 horas de antelación para conservar la hora del bono.</li>
                <li>Pasado ese plazo, no se realizará devolución ni cambio de horario.</li>
                <li>Los bonos estarán sujetos a las condiciones de caducidad y uso indicadas en el momento de la compra.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">7. Actividades y enseñanza</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>No se permite impartir clases ni realizar entrenamientos dirigidos sin haber reservado la sala de manera privada.</li>
                <li>Cada instructor o persona que imparta una clase será responsable directo de sus alumnos y del correcto uso de la instalación.</li>
                <li>En caso de organizar sesiones grupales o privadas, deberá reservarse la sala completa</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">8. Conducta</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Se espera una actitud respetuosa y profesional hacia el espacio, el material y otros usuarios.</li>
                <li>Cualquier comportamiento inapropiado, incumplimiento de normas o acceso no autorizado podrá suponer la suspensión del derecho de uso del espacio sin reembolso.</li>
              </ul>
            </div>

            <hr className="my-2 opacity-50" />

            <div>
              <p className="font-semibold">9. Aceptación</p>
              <p>La realización de una reserva implica la aceptación total de las presentes normas y de las políticas de funcionamiento del espacio Alondra Pole Space.</p>
            </div>

            <div>
              <p>Gracias por cuidar el espacio tanto como lo harías con el tuyo propio.</p>
              <p>Tu respeto y responsabilidad hacen posible que Alondra Pole Space siga siendo un lugar seguro, limpio y accesible para tod@s.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Normas;


