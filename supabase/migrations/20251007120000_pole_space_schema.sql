-- ============================================================================
-- Supabase (PostgreSQL) - Esquema Sistema de Reservas Pole Dance
-- Cubre: tablas, constraints, comentarios, RLS, políticas, triggers, funciones,
--        índices, vistas e inserts iniciales.
-- Notas:
-- - Usa auth.users como fuente de usuarios; se crea tabla perfiles relacionada.
-- - Todas las FK usan ON DELETE RESTRICT y ON UPDATE CASCADE.
-- - ENUMs implementados con CHECK.
-- - RLS activado en tablas sensibles.
-- ============================================================================

set check_function_bodies = off;
set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_min_messages = warning;
set row_security = on;

-- ============================================================================
-- Helpers y funciones comunes
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
comment on function public.is_admin() is 'Devuelve true si el JWT contiene app_metadata.role = ''admin''';

-- ============================================================================
-- Tablas
-- ============================================================================

-- 1) perfiles: perfil extra vinculado a auth.users
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete restrict on update cascade,
  nombre text,
  telefono text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.perfiles is 'Datos de perfil vinculados a auth.users';
comment on column public.perfiles.id is 'FK a auth.users.id';

-- 2) tipos_bono: catálogo
create table if not exists public.tipos_bono (
  id bigserial primary key,
  nombre text not null,
  descripcion text,
  numero_clases integer not null,
  precio numeric(10,2) not null,
  duracion_dias integer not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.tipos_bono is 'Tipos de bono disponibles';

-- 3) bonos_usuario: instancias compradas
create table if not exists public.bonos_usuario (
  id bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete restrict on update cascade,
  tipo_bono_id bigint not null references public.tipos_bono(id) on delete restrict on update cascade,
  fecha_compra timestamptz not null default now(),
  fecha_caducidad date not null,
  clases_restantes integer not null,
  clases_totales integer not null,
  estado text not null check (estado in ('activo','agotado','caducado')),
  created_at timestamptz not null default now()
);
comment on table public.bonos_usuario is 'Bonos adquiridos por usuarios con control de caducidad/consumo';

-- 4) tipos_reserva: 1 barra / sala completa
create table if not exists public.tipos_reserva (
  id bigserial primary key,
  nombre text not null,
  numero_barras integer not null check (numero_barras in (1,3)),
  precio_entrada numeric(10,2) not null,
  activo boolean not null default true
);
comment on table public.tipos_reserva is 'Tipos de reserva (1 barra o sala completa)';

-- 5) franjas_horarias: configuración por día de la semana
create table if not exists public.franjas_horarias (
  id bigserial primary key,
  dia_semana text not null check (dia_semana in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_inicio time not null,
  hora_fin time not null,
  tipo_reserva_id bigint not null references public.tipos_reserva(id) on delete restrict on update cascade,
  activo boolean not null default true,
  check (hora_fin > hora_inicio)
);
comment on table public.franjas_horarias is 'Franjas horarias configurables por día';

-- 6) reservas: reservas por usuario/fecha/franja
create table if not exists public.reservas (
  id bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete restrict on update cascade,
  fecha date not null,
  franja_horaria_id bigint not null references public.franjas_horarias(id) on delete restrict on update cascade,
  tipo_reserva_id bigint not null references public.tipos_reserva(id) on delete restrict on update cascade,
  numero_barras integer not null check (numero_barras in (1,2,3)),
  metodo_pago text not null check (metodo_pago in ('entrada','bono')),
  bono_usuario_id bigint references public.bonos_usuario(id) on delete restrict on update cascade,
  precio_pagado numeric(10,2) not null default 0,
  codigo_acceso text,
  estado text not null default 'confirmada' check (estado in ('confirmada','completada','cancelada')),
  fecha_creacion timestamptz not null default now(),
  fecha_cancelacion timestamptz
);
comment on table public.reservas is 'Reservas realizadas por usuarios';

-- 7) pagos: registro de pagos
create table if not exists public.pagos (
  id bigserial primary key,
  usuario_id uuid not null references auth.users(id) on delete restrict on update cascade,
  tipo text not null check (tipo in ('entrada','bono')),
  referencia_id bigint not null,
  metodo_pago text not null,
  cantidad numeric(10,2) not null,
  estado text not null default 'completado' check (estado in ('pendiente','completado','fallido','reembolsado')),
  transaccion_id text,
  fecha_pago timestamptz not null default now()
);
comment on table public.pagos is 'Pagos de entradas o bonos';

-- 8) codigos_ttlock: códigos generados para acceso
create table if not exists public.codigos_ttlock (
  id bigserial primary key,
  reserva_id bigint not null references public.reservas(id) on delete restrict on update cascade,
  codigo text not null,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  ttlock_password_id text,
  fecha_creacion timestamptz not null default now(),
  estado text not null default 'activo' check (estado in ('activo','usado','expirado','eliminado')),
  unique (codigo),
  check (fecha_fin > fecha_inicio)
);
comment on table public.codigos_ttlock is 'Códigos TTLock por reserva';

-- ============================================================================
-- Índices
-- ============================================================================
create index if not exists idx_reservas_usuario_fecha on public.reservas (usuario_id, fecha);
create index if not exists idx_reservas_fecha_estado on public.reservas (fecha, estado);
create index if not exists idx_bonos_usuario_estado on public.bonos_usuario (usuario_id, estado);
create index if not exists idx_bonos_caducidad on public.bonos_usuario (fecha_caducidad, estado);

-- ============================================================================
-- Datos iniciales
-- ============================================================================
insert into public.tipos_reserva (nombre, numero_barras, precio_entrada, activo) values
  ('1 Barra', 1, 15.00, true)
on conflict (id) do nothing;

insert into public.tipos_reserva (nombre, numero_barras, precio_entrada, activo) values
  ('Sala Completa (3 Barras)', 3, 40.00, true)
on conflict (id) do nothing;

insert into public.tipos_bono (nombre, descripcion, numero_clases, precio, duracion_dias, activo) values
  ('Bono 5 clases', 'Paquete de 5 clases', 5, 65.00, 60, true),
  ('Bono 10 clases', 'Paquete de 10 clases', 10, 120.00, 90, true),
  ('Bono 20 clases', 'Paquete de 20 clases', 20, 220.00, 120, true),
  ('Bono Mensual', 'Clases ilimitadas durante 30 días', 999, 80.00, 30, true),
  ('Bono Trimestral', 'Clases ilimitadas durante 90 días', 999, 210.00, 90, true),
  ('Bono Semestral', 'Clases ilimitadas durante 180 días', 999, 390.00, 180, true),
  ('Bono Anual', 'Clases ilimitadas durante 365 días', 999, 720.00, 365, true),
  ('Bono Prueba', 'Paquete de 3 clases', 3, 40.00, 30, true)
on conflict (id) do nothing;

-- ============================================================================
-- Vistas útiles
-- ============================================================================
create or replace view public.vista_reservas_futuras as
select r.id as reserva_id,
       r.usuario_id,
       r.fecha,
       r.estado,
       fh.dia_semana,
       fh.hora_inicio,
       fh.hora_fin,
       tr.nombre as tipo_reserva,
       r.numero_barras,
       r.metodo_pago,
       r.precio_pagado,
       r.codigo_acceso
from public.reservas r
join public.franjas_horarias fh on fh.id = r.franja_horaria_id
join public.tipos_reserva tr on tr.id = r.tipo_reserva_id
where r.estado = 'confirmada' and r.fecha >= current_date;

create or replace view public.vista_bonos_activos as
select b.id as bono_usuario_id,
       b.usuario_id,
       tb.nombre as tipo_bono,
       b.clases_restantes,
       b.clases_totales,
       b.fecha_compra,
       b.fecha_caducidad,
       greatest((b.fecha_caducidad::date - current_date), 0) as dias_restantes,
       b.estado
from public.bonos_usuario b
join public.tipos_bono tb on tb.id = b.tipo_bono_id
where b.estado = 'activo';

create or replace view public.vista_disponibilidad_diaria as
select r.fecha,
       r.franja_horaria_id,
       sum(case when r.estado = 'confirmada' then r.numero_barras else 0 end) as barras_reservadas,
       (3 - sum(case when r.estado = 'confirmada' then r.numero_barras else 0 end)) as barras_disponibles
from public.reservas r
group by r.fecha, r.franja_horaria_id;

-- ============================================================================
-- Funciones específicas
-- ============================================================================

-- Verificar disponibilidad de una franja para una fecha
create or replace function public.verificar_disponibilidad(
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
comment on function public.verificar_disponibilidad(date,bigint,int) is 'True si la franja tiene <= 3 barras reservadas con la nueva solicitud';

-- Obtener bonos activos de un usuario con días restantes
create or replace function public.obtener_bonos_activos(
  _usuario_id uuid
) returns table (
  bono_usuario_id bigint,
  tipo_bono text,
  clases_restantes int,
  clases_totales int,
  fecha_compra timestamptz,
  fecha_caducidad date,
  dias_restantes int,
  estado text
)
language sql
stable
as $$
  select b.id,
         tb.nombre,
         b.clases_restantes,
         b.clases_totales,
         b.fecha_compra,
         b.fecha_caducidad,
         greatest((b.fecha_caducidad::date - current_date), 0) as dias_restantes,
         b.estado
  from public.bonos_usuario b
  join public.tipos_bono tb on tb.id = b.tipo_bono_id
  where b.usuario_id = _usuario_id and b.estado = 'activo';
$$;

-- Crear reserva y descontar de bono (si aplica)
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
comment on function public.crear_reserva(uuid,date,bigint,bigint,text,bigint,numeric) is 'Crea reserva verificando disponibilidad y descuenta bono si procede';

-- ============================================================================
-- Triggers
-- ============================================================================

-- updated_at en perfiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfiles_set_updated_at on public.perfiles;
create trigger perfiles_set_updated_at
before update on public.perfiles
for each row execute function public.set_updated_at();

-- Crear perfil automáticamente al registrarse (evento en auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono) values (new.id, null, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Verificar disponibilidad antes de insertar reserva (muro de seguridad extra)
create or replace function public.before_insert_reserva()
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

drop trigger if exists reservas_before_insert on public.reservas;
create trigger reservas_before_insert
before insert on public.reservas
for each row execute function public.before_insert_reserva();

-- Agotar bono automáticamente cuando llegue a 0 clases
create or replace function public.after_update_bono_estado()
returns trigger
language plpgsql
as $$
begin
  if new.clases_restantes <= 0 and new.estado <> 'agotado' then
    new.estado = 'agotado';
  end if;
  return new;
end;
$$;

drop trigger if exists bonos_usuario_before_update on public.bonos_usuario;
create trigger bonos_usuario_before_update
before update on public.bonos_usuario
for each row execute function public.after_update_bono_estado();

-- ============================================================================
-- RLS y Políticas
-- ============================================================================

alter table public.perfiles enable row level security;
alter table public.bonos_usuario enable row level security;
alter table public.reservas enable row level security;
alter table public.pagos enable row level security;
alter table public.tipos_bono enable row level security;
alter table public.tipos_reserva enable row level security;
alter table public.franjas_horarias enable row level security;
alter table public.codigos_ttlock enable row level security;

-- perfiles: sólo el dueño puede ver/editar su perfil
drop policy if exists perfiles_select_own on public.perfiles;
create policy perfiles_select_own on public.perfiles for select
using ( id = auth.uid() );

drop policy if exists perfiles_update_own on public.perfiles;
create policy perfiles_update_own on public.perfiles for update
using ( id = auth.uid() ) with check ( id = auth.uid() );

-- Inserción la hace el trigger con service role; opcionalmente permitir al usuario crear si no existe
drop policy if exists perfiles_insert_self on public.perfiles;
create policy perfiles_insert_self on public.perfiles for insert
with check ( id = auth.uid() );

-- bonos_usuario: propietario únicamente
drop policy if exists bonos_select_own on public.bonos_usuario;
create policy bonos_select_own on public.bonos_usuario for select
using ( usuario_id = auth.uid() );

drop policy if exists bonos_insert_own on public.bonos_usuario;
create policy bonos_insert_own on public.bonos_usuario for insert
with check ( usuario_id = auth.uid() );

drop policy if exists bonos_update_own on public.bonos_usuario;
create policy bonos_update_own on public.bonos_usuario for update
using ( usuario_id = auth.uid() ) with check ( usuario_id = auth.uid() );

-- reservas: propietario únicamente
drop policy if exists reservas_select_own on public.reservas;
create policy reservas_select_own on public.reservas for select
using ( usuario_id = auth.uid() );

drop policy if exists reservas_insert_own on public.reservas;
create policy reservas_insert_own on public.reservas for insert
with check ( usuario_id = auth.uid() );

drop policy if exists reservas_update_own on public.reservas;
create policy reservas_update_own on public.reservas for update
using ( usuario_id = auth.uid() ) with check ( usuario_id = auth.uid() );

-- pagos: propietario puede consultar sus pagos
drop policy if exists pagos_select_own on public.pagos;
create policy pagos_select_own on public.pagos for select
using ( usuario_id = auth.uid() );

-- Catálogos con lectura pública; escritura sólo admin
-- tipos_bono
drop policy if exists tipos_bono_select_public on public.tipos_bono;
create policy tipos_bono_select_public on public.tipos_bono for select using ( true );

drop policy if exists tipos_bono_write_admin on public.tipos_bono;
create policy tipos_bono_write_admin on public.tipos_bono for all
using ( public.is_admin() ) with check ( public.is_admin() );

-- tipos_reserva
drop policy if exists tipos_reserva_select_public on public.tipos_reserva;
create policy tipos_reserva_select_public on public.tipos_reserva for select using ( true );

drop policy if exists tipos_reserva_write_admin on public.tipos_reserva;
create policy tipos_reserva_write_admin on public.tipos_reserva for all
using ( public.is_admin() ) with check ( public.is_admin() );

-- franjas_horarias
drop policy if exists franjas_select_public on public.franjas_horarias;
create policy franjas_select_public on public.franjas_horarias for select using ( true );

drop policy if exists franjas_write_admin on public.franjas_horarias;
create policy franjas_write_admin on public.franjas_horarias for all
using ( public.is_admin() ) with check ( public.is_admin() );

-- codigos_ttlock: sólo el dueño de la reserva puede ver
drop policy if exists ttlock_select_owner on public.codigos_ttlock;
create policy ttlock_select_owner on public.codigos_ttlock for select
using ( exists (
  select 1 from public.reservas r where r.id = codigos_ttlock.reserva_id and r.usuario_id = auth.uid()
) );

-- ============================================================================
-- Comentarios y documentación
-- ============================================================================
comment on column public.tipos_bono.numero_clases is '999 se interpreta como ilimitadas';
comment on column public.reservas.precio_pagado is '0 cuando se descuenta de bono';

-- ============================================================================
-- FIN
-- ============================================================================


