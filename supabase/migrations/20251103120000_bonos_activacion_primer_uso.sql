-- Bonos: caducidad desde el primer uso
set check_function_bodies = off;
set search_path = public;

-- 1) Estructura: permitir fecha_caducidad NULL y añadir fecha_activacion
alter table if exists public.bonos_usuario
  alter column fecha_caducidad drop not null;

alter table if exists public.bonos_usuario
  add column if not exists fecha_activacion timestamptz null;

comment on column public.bonos_usuario.fecha_activacion is 'Fecha del primer uso del bono. La caducidad empieza aquí.';

-- 2) Función crear_reserva: activar bono en primer uso
create or replace function public.crear_reserva(
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
  v_duracion int;
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

    -- Activar bono en primer uso: si no tiene fecha_caducidad, fijarla ahora según su tipo
    select tb.duracion_dias into v_duracion
      from public.bonos_usuario b
      join public.tipos_bono tb on tb.id = b.tipo_bono_id
     where b.id = _bono_usuario_id
       and b.usuario_id = _usuario_id
       for update; -- bloquear fila del bono mientras actualizamos

    if v_duracion is null then
      raise exception 'Bono no encontrado o tipo_bono sin duración';
    end if;

    update public.bonos_usuario b
       set fecha_activacion = coalesce(b.fecha_activacion, now()),
           fecha_caducidad = coalesce(b.fecha_caducidad, (now() + (v_duracion || ' days')::interval)::date)
     where b.id = _bono_usuario_id
       and b.usuario_id = _usuario_id
       and b.estado = 'activo';

    -- Descontar clase y actualizar estado si llega a 0
    update public.bonos_usuario
       set clases_restantes = clases_restantes - 1,
           estado = case when clases_restantes - 1 <= 0 then 'agotado' else estado end
     where id = _bono_usuario_id
       and usuario_id = _usuario_id
       and estado = 'activo'
       and (fecha_caducidad is null or (fecha_caducidad::date) >= current_date);

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

