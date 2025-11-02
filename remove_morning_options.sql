-- Script para eliminar opciones de mañanas del sistema
-- Desactivar tipos de reserva de mañanas
UPDATE public.tipos_reserva 
SET activo = false 
WHERE franja = 'mananas' OR nombre LIKE '%mañanas%' OR nombre LIKE '%L-V%';

-- Desactivar tipos de bono de mañanas
UPDATE public.tipos_bono 
SET activo = false 
WHERE franja = 'mananas' OR nombre LIKE '%mañanas%' OR nombre LIKE '%L-V%';

-- Verificar qué se ha desactivado
SELECT 'tipos_reserva desactivados:' as tabla, nombre, franja, activo 
FROM public.tipos_reserva 
WHERE franja = 'mananas' OR nombre LIKE '%mañanas%' OR nombre LIKE '%L-V%'
UNION ALL
SELECT 'tipos_bono desactivados:' as tabla, nombre, franja, activo 
FROM public.tipos_bono 
WHERE franja = 'mananas' OR nombre LIKE '%mañanas%' OR nombre LIKE '%L-V%';



