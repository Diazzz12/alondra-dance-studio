-- Script para actualizar las franjas horarias con las nuevas horas
-- Nuevas horas: 7:30, 9:00, 10:30, 12:00, 13:30, 15:00, 16:30, 18:00, 19:30, 21:00, 22:30
-- Cada sesión dura 1h30m

-- Paso 1: Eliminar todas las franjas horarias existentes (si quieres empezar desde cero)
-- O simplemente desactivarlas si prefieres mantener el historial
-- Opción A: Eliminar (comentar si no quieres eliminar)
-- DELETE FROM public.franjas_horarias;

-- Opción B: Desactivar (recomendado para mantener historial)
UPDATE public.franjas_horarias SET activo = false;

-- Paso 2: Obtener UN tipo de reserva para asociar a las franjas
-- IMPORTANTE: Las franjas horarias son COMPARTIDAS entre todos los tipos de reserva
-- Solo necesitamos UN tipo_reserva_id (usaremos barra suelta como referencia, pero no importa cuál)
-- porque todas las franjas comparten las mismas 3 barras físicas

DO $$
DECLARE
  v_tipo_referencia_id BIGINT; -- Cualquier tipo de reserva activo (solo para cumplir el NOT NULL)
  dias_semana TEXT[] := ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  dia TEXT;
BEGIN
  -- Obtener cualquier tipo de reserva activo (preferimos barra suelta, pero no es crítico)
  SELECT id INTO v_tipo_referencia_id 
  FROM public.tipos_reserva 
  WHERE activo = true 
  ORDER BY id ASC 
  LIMIT 1;

  IF v_tipo_referencia_id IS NULL THEN
    RAISE EXCEPTION 'No hay tipos de reserva activos. Crea al menos un tipo de reserva antes de ejecutar este script.';
  END IF;

  -- Insertar UNA sola franja horaria por hora, para todos los días de la semana
  -- Todas las franjas comparten las mismas 3 barras físicas
  FOREACH dia IN ARRAY dias_semana
  LOOP
    INSERT INTO public.franjas_horarias (dia_semana, hora_inicio, hora_fin, tipo_reserva_id, activo) VALUES
      (dia, '07:30:00', '09:00:00', v_tipo_referencia_id, true),
      (dia, '09:00:00', '10:30:00', v_tipo_referencia_id, true),
      (dia, '10:30:00', '12:00:00', v_tipo_referencia_id, true),
      (dia, '12:00:00', '13:30:00', v_tipo_referencia_id, true),
      (dia, '13:30:00', '15:00:00', v_tipo_referencia_id, true),
      (dia, '15:00:00', '16:30:00', v_tipo_referencia_id, true),
      (dia, '16:30:00', '18:00:00', v_tipo_referencia_id, true),
      (dia, '18:00:00', '19:30:00', v_tipo_referencia_id, true),
      (dia, '19:30:00', '21:00:00', v_tipo_referencia_id, true),
      (dia, '21:00:00', '22:30:00', v_tipo_referencia_id, true),
      (dia, '22:30:00', '24:00:00', v_tipo_referencia_id, true);
  END LOOP;
END $$;

-- Verificar que se insertaron correctamente
SELECT 
  fh.dia_semana,
  fh.hora_inicio,
  fh.hora_fin,
  fh.tipo_reserva_id,
  tr.nombre as tipo_reserva,
  tr.numero_barras,
  fh.activo
FROM public.franjas_horarias fh
JOIN public.tipos_reserva tr ON fh.tipo_reserva_id = tr.id
WHERE fh.activo = true
ORDER BY fh.dia_semana, fh.hora_inicio, fh.tipo_reserva_id;

