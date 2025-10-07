-- Actualización de esquema y datos para precios oficiales (mañanas/tarde y nominalidad)
set check_function_bodies = off;
set row_security = on;

-- Ampliar tipos_reserva con columna franja ('mananas','tarde_punta')
alter table public.tipos_reserva
  add column if not exists franja text,
  add column if not exists descripcion text;

alter table public.tipos_reserva
  add constraint tipos_reserva_franja_chk check (franja is null or franja in ('mananas','tarde_punta'));

-- Ampliar tipos_bono con franja y nominalidad
alter table public.tipos_bono
  add column if not exists franja text,
  add column if not exists nominal boolean not null default true;

alter table public.tipos_bono
  add constraint tipos_bono_franja_chk check (franja is null or franja in ('mananas','tarde_punta'));

comment on column public.tipos_bono.nominal is 'true = nominal (no transferible), false = no nominal (transferible)';
comment on column public.tipos_bono.franja is 'mananas (hasta 14:00 L-V) o tarde_punta';
comment on column public.tipos_reserva.franja is 'mananas (hasta 14:00 L-V) o tarde_punta';

-- Desactivar entradas antiguas si existen
update public.tipos_reserva set activo = false where nombre in ('1 Barra','Sala Completa (3 Barras)');

-- Insertar/actualizar tipos de reserva según la lista oficial
insert into public.tipos_reserva (nombre, numero_barras, precio_entrada, activo, franja, descripcion)
values
  ('Barra suelta (tarde/punta)', 1, 10.00, true, 'tarde_punta', '1 sesión (1h30m)'),
  ('Barra suelta mañanas (L-V hasta 14:00)', 1, 8.00, true, 'mananas', '1 sesión (1h30m)'),
  ('Sala entera hasta 6 personas (tarde/punta)', 3, 30.00, true, 'tarde_punta', '1 sesión (1h30m)'),
  ('Sala entera +6 personas (tarde/punta)', 3, 40.00, true, 'tarde_punta', '1 sesión (1h30m)'),
  ('Sala entera hasta 6 personas (mañanas L-V)', 3, 27.00, true, 'mananas', '1 sesión (1h30m)'),
  ('Sala entera +6 personas (mañanas L-V)', 3, 35.00, true, 'mananas', '1 sesión (1h30m)')
on conflict (id) do nothing;

-- Desactivar tipos de bono antiguos ilimitados si existen
update public.tipos_bono set activo = false where numero_clases = 999;

-- Insertar/actualizar bonos por franja y nominalidad
-- Tarde/punta - NO NOMINAL
insert into public.tipos_bono (nombre, descripcion, numero_clases, precio, duracion_dias, activo, franja, nominal)
values
  ('Bono 5 barras (tarde/punta)', 'NO NOMINAL - 1 mes', 5, 45.00, 30, true, 'tarde_punta', false),
  ('Bono 10 barras (tarde/punta)', 'NO NOMINAL - 3 meses', 10, 80.00, 90, true, 'tarde_punta', false)
on conflict (id) do nothing;

-- Mañanas L-V - (no se especifica nominalidad -> asumimos nominal=true)
insert into public.tipos_bono (nombre, descripcion, numero_clases, precio, duracion_dias, activo, franja, nominal)
values
  ('Bono 5 barras mañanas (L-V hasta 14:00)', 'Validez 1 mes', 5, 35.00, 30, true, 'mananas', true),
  ('Bono 10 barras mañanas (L-V hasta 14:00)', 'Validez 3 meses', 10, 67.00, 90, true, 'mananas', true)
on conflict (id) do nothing;

-- Notas: si ya existen bonos similares, se recomienda homogeneizar manualmente por id/nombre


