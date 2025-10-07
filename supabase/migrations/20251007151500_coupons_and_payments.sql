-- Cupones de descuento y función de validación
set check_function_bodies = off;
set row_security = on;

-- Tabla de cupones
create table if not exists public.cupones (
  id bigserial primary key,
  codigo text not null unique,
  descripcion text,
  -- uno de los dos: porcentaje o cantidad fija
  percent_off numeric(5,2) check (percent_off is null or (percent_off >= 0 and percent_off <= 100)),
  amount_off numeric(10,2) check (amount_off is null or amount_off >= 0),
  moneda text default 'EUR',
  valido_desde timestamptz,
  valido_hasta timestamptz,
  max_redenciones int,
  limite_por_usuario int,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete restrict on update cascade,
  check (percent_off is not null or amount_off is not null)
);

comment on table public.cupones is 'Cupones de descuento aplicables a reservas o bonos';

-- Ámbito de aplicación del cupón (opcional): por tipo_reserva o tipo_bono
create table if not exists public.cupones_aplica (
  id bigserial primary key,
  cupon_id bigint not null references public.cupones(id) on delete cascade on update cascade,
  aplica_a text not null check (aplica_a in ('tipo_reserva','tipo_bono')),
  referencia_id bigint not null
);

-- Redenciones de cupones
create table if not exists public.cupones_redenciones (
  id bigserial primary key,
  cupon_id bigint not null references public.cupones(id) on delete restrict on update cascade,
  usuario_id uuid not null references auth.users(id) on delete restrict on update cascade,
  referencia_tipo text not null check (referencia_tipo in ('reserva','bono','checkout')),
  referencia_id bigint,
  fecha_redencion timestamptz not null default now()
);

-- RLS
alter table public.cupones enable row level security;
alter table public.cupones_aplica enable row level security;
alter table public.cupones_redenciones enable row level security;

-- cupones: lectura sólo admin (gestión interna)
drop policy if exists cupones_admin_all on public.cupones;
create policy cupones_admin_all on public.cupones for all using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists cupones_aplica_admin_all on public.cupones_aplica;
create policy cupones_aplica_admin_all on public.cupones_aplica for all using ( public.is_admin() ) with check ( public.is_admin() );

-- redenciones: el usuario puede ver sus redenciones
drop policy if exists cupones_redenciones_select_own on public.cupones_redenciones;
create policy cupones_redenciones_select_own on public.cupones_redenciones for select using ( usuario_id = auth.uid() );

drop policy if exists cupones_redenciones_insert_self on public.cupones_redenciones;
create policy cupones_redenciones_insert_self on public.cupones_redenciones for insert with check ( usuario_id = auth.uid() );

-- Función para validar y calcular precio con cupón
create or replace function public.validar_cupon(
  _codigo text,
  _usuario_id uuid,
  _tipo_item text,           -- 'tipo_reserva' | 'tipo_bono'
  _item_id bigint,
  _precio numeric(10,2)
) returns table (
  valido boolean,
  precio_final numeric(10,2),
  motivo text,
  cupon_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupon public.cupones%rowtype;
  v_uso_total int;
  v_uso_usuario int;
  v_aplica boolean;
  v_desc numeric(10,2);
begin
  select * into v_cupon from public.cupones where upper(codigo) = upper(_codigo) and activo = true;
  if not found then
    return query select false, _precio, 'codigo_invalido', null::bigint; return;
  end if;

  if v_cupon.valido_desde is not null and now() < v_cupon.valido_desde then
    return query select false, _precio, 'no_iniciado', v_cupon.id; return;
  end if;
  if v_cupon.valido_hasta is not null and now() > v_cupon.valido_hasta then
    return query select false, _precio, 'caducado', v_cupon.id; return;
  end if;

  select count(*) into v_uso_total from public.cupones_redenciones where cupon_id = v_cupon.id;
  if v_cupon.max_redenciones is not null and v_uso_total >= v_cupon.max_redenciones then
    return query select false, _precio, 'sin_cupos', v_cupon.id; return;
  end if;

  select count(*) into v_uso_usuario from public.cupones_redenciones where cupon_id = v_cupon.id and usuario_id = _usuario_id;
  if v_cupon.limite_por_usuario is not null and v_uso_usuario >= v_cupon.limite_por_usuario then
    return query select false, _precio, 'limite_usuario', v_cupon.id; return;
  end if;

  -- Verificar ámbito si hay restricciones
  select exists (
    select 1 from public.cupones_aplica ca
    where ca.cupon_id = v_cupon.id and ca.aplica_a = _tipo_item and ca.referencia_id = _item_id
  ) into v_aplica;

  if exists (select 1 from public.cupones_aplica where cupon_id = v_cupon.id) and not v_aplica then
    return query select false, _precio, 'no_aplica', v_cupon.id; return;
  end if;

  -- Calcular descuento
  v_desc := coalesce((_precio * (v_cupon.percent_off/100.0)), 0) + coalesce(v_cupon.amount_off, 0);
  if v_desc >= _precio then
    return query select true, 0::numeric, 'descuento_total', v_cupon.id; return;
  else
    return query select true, greatest(_precio - v_desc, 0)::numeric, 'ok', v_cupon.id; return;
  end if;
end;
$$;


