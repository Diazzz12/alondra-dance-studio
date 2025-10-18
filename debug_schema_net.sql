-- Script para diagnosticar y corregir el error "schema net does not exist"

-- 1. Verificar si existe el esquema 'net'
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'net';

-- 2. Buscar referencias al esquema 'net' en las funciones
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%net.%' 
   OR routine_definition ILIKE '%schema%net%';

-- 3. Verificar la función crear_reserva actual
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'crear_reserva';

-- 4. Verificar el trigger before_insert_reserva
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'reservas_before_insert';

-- 5. Verificar la función verificar_disponibilidad
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'verificar_disponibilidad';

-- 6. Si hay problemas, recrear las funciones limpias
-- Primero eliminar el trigger que depende de la función
DROP TRIGGER IF EXISTS reservas_before_insert ON public.reservas;
DROP FUNCTION IF EXISTS public.crear_reserva(uuid,date,bigint,bigint,text,bigint,numeric);
DROP FUNCTION IF EXISTS public.before_insert_reserva();
DROP FUNCTION IF EXISTS public.verificar_disponibilidad(date,bigint,int);

-- Recrear verificar_disponibilidad
CREATE OR REPLACE FUNCTION public.verificar_disponibilidad(
  _fecha date,
  _franja_id bigint,
  _barras_solicitadas int
) returns boolean
language plpgsql
stable
as $$
declare
  barras_reservadas int;
begin
  select coalesce(sum(case when estado = 'confirmada' then numero_barras else 0 end), 0)
    into barras_reservadas
  from public.reservas
  where fecha = _fecha and franja_horaria_id = _franja_id;

  return (barras_reservadas + _barras_solicitadas) <= 3;
end;
$$;

-- Recrear crear_reserva
CREATE OR REPLACE FUNCTION public.crear_reserva(
  _usuario_id uuid,
  _fecha date,
  _franja_id bigint,
  _tipo_reserva_id bigint,
  _metodo_pago text,
  _bono_usuario_id bigint default null,
  _precio_pagado numeric(10,2) default 0
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num_barras int;
  v_reserva_id bigint;
begin
  -- fijar numero_barras desde tipos_reserva para coherencia
  select numero_barras into v_num_barras from public.tipos_reserva where id = _tipo_reserva_id;
  if v_num_barras is null then
    raise exception 'Tipo de reserva inexistente';
  end if;

  -- disponibilidad
  if not public.verificar_disponibilidad(_fecha, _franja_id, v_num_barras) then
    raise exception 'No hay barras suficientes disponibles en la franja solicitada';
  end if;

  -- pago con bono
  if _metodo_pago = 'bono' then
    if _bono_usuario_id is null then
      raise exception 'Se requiere bono_usuario_id para metodo_pago=bono';
    end if;
    update public.bonos_usuario
       set clases_restantes = clases_restantes - 1,
           estado = case when clases_restantes - 1 <= 0 then 'agotado' else estado end
     where id = _bono_usuario_id
       and usuario_id = _usuario_id
       and estado = 'activo'
       and (fecha_caducidad::date) >= current_date;
    if not found then
      raise exception 'Bono no disponible (inexistente, ajeno, agotado o caducado)';
    end if;
  end if;

  insert into public.reservas (
    usuario_id, fecha, franja_horaria_id, tipo_reserva_id, numero_barras,
    metodo_pago, bono_usuario_id, precio_pagado, estado
  ) values (
    _usuario_id, _fecha, _franja_id, _tipo_reserva_id, v_num_barras,
    _metodo_pago, _bono_usuario_id, _precio_pagado, 'confirmada'
  ) returning id into v_reserva_id;

  return v_reserva_id;
end;
$$;

-- Recrear before_insert_reserva
CREATE OR REPLACE FUNCTION public.before_insert_reserva()
returns trigger
language plpgsql
as $$
declare
  v_barras int;
begin
  select numero_barras into v_barras from public.tipos_reserva where id = new.tipo_reserva_id;
  if v_barras is null then
    raise exception 'Tipo de reserva inexistente';
  end if;
  new.numero_barras = v_barras;
  if not public.verificar_disponibilidad(new.fecha, new.franja_horaria_id, v_barras) then
    raise exception 'No hay barras suficientes disponibles en la franja solicitada';
  end if;
  return new;
end;
$$;

-- Recrear el trigger
CREATE TRIGGER reservas_before_insert
BEFORE INSERT ON public.reservas
FOR EACH ROW EXECUTE FUNCTION public.before_insert_reserva();
