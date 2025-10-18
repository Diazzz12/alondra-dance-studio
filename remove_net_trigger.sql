-- Eliminar la función y trigger que usa el esquema 'net' inexistente

-- Eliminar el trigger primero
DROP TRIGGER IF EXISTS trigger_enviar_email_reserva ON public.reservas;

-- Eliminar la función
DROP FUNCTION IF EXISTS public.enviar_email_reserva_trigger();

-- Verificar que se eliminaron correctamente
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_enviar_email_reserva';

SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_name = 'enviar_email_reserva_trigger';
