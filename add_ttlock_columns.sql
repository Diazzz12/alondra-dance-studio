-- Añadir columnas para códigos de acceso TTLock a la tabla reservas

-- Añadir columnas para el código de acceso
ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS codigo_acceso VARCHAR(10),
ADD COLUMN IF NOT EXISTS codigo_acceso_id VARCHAR(50);

-- Añadir comentarios
COMMENT ON COLUMN public.reservas.codigo_acceso IS 'Código numérico para acceder a la cerradura TTLock';
COMMENT ON COLUMN public.reservas.codigo_acceso_id IS 'ID del código de acceso en TTLock para gestión';

-- Crear índice para búsquedas por código de acceso
CREATE INDEX IF NOT EXISTS idx_reservas_codigo_acceso ON public.reservas(codigo_acceso);

-- Verificar que las columnas se añadieron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reservas' 
  AND table_schema = 'public'
  AND column_name IN ('codigo_acceso', 'codigo_acceso_id');

