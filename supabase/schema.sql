-- ================================================
-- BEAUTY ROOM NINI — Schema completo + Seed data
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- Profesionales
create table if not exists profesionales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  especialidad text,
  color text not null,
  activo boolean default true,
  foto_url text,
  created_at timestamptz default now()
);

-- Servicios
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  duracion_min integer not null,
  precio decimal(10,2) not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Profesional_servicio (relación muchos-a-muchos)
create table if not exists profesional_servicio (
  profesional_id uuid references profesionales(id) on delete cascade,
  servicio_id uuid references servicios(id) on delete cascade,
  primary key (profesional_id, servicio_id)
);

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  notas text,
  created_at timestamptz default now()
);

-- Horario del local
create table if not exists horario_local (
  dia_semana integer not null,  -- 0=Dom, 1=Lun, ..., 6=Sab
  abierto boolean default true,
  hora_apertura time,
  hora_cierre time,
  primary key (dia_semana)
);

-- Horario por profesional
create table if not exists horario_profesional (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid references profesionales(id) on delete cascade,
  dia_semana integer not null,
  trabaja boolean default true,
  hora_inicio time,
  hora_fin time
);

-- Días libres
create table if not exists dias_libres (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid references profesionales(id) on delete cascade,
  fecha date not null,
  motivo text
);

-- Reservas
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  profesional_id uuid references profesionales(id),
  servicio_id uuid references servicios(id),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado text default 'pendiente' check (estado in ('pendiente','confirmada','completada','cancelada')),
  notas text,
  created_at timestamptz default now()
);

-- Usuarios del panel admin
create table if not exists usuarios (
  id uuid primary key references auth.users(id),
  nombre text not null,
  rol text not null check (rol in ('propietaria','empleada')),
  profesional_id uuid references profesionales(id),
  activo boolean default true
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

alter table profesionales enable row level security;
alter table servicios enable row level security;
alter table profesional_servicio enable row level security;
alter table clientes enable row level security;
alter table horario_local enable row level security;
alter table horario_profesional enable row level security;
alter table dias_libres enable row level security;
alter table reservas enable row level security;
alter table usuarios enable row level security;

-- Lectura pública de profesionales y servicios (para el portal de reservas)
create policy "Profesionales visibles públicamente" on profesionales
  for select using (activo = true);

create policy "Servicios visibles públicamente" on servicios
  for select using (activo = true);

create policy "Profesional_servicio visible públicamente" on profesional_servicio
  for select using (true);

create policy "Horario local visible públicamente" on horario_local
  for select using (true);

create policy "Horario profesional visible públicamente" on horario_profesional
  for select using (true);

create policy "Dias libres visibles públicamente" on dias_libres
  for select using (true);

-- Reservas: lectura pública (para calcular disponibilidad), escritura autenticada
create policy "Reservas visibles para disponibilidad" on reservas
  for select using (true);

create policy "Reservas insertables por cualquiera (portal público)" on reservas
  for insert with check (true);

create policy "Reservas modificables por usuarios autenticados" on reservas
  for update using (auth.role() = 'authenticated');

create policy "Reservas eliminables por usuarios autenticados" on reservas
  for delete using (auth.role() = 'authenticated');

-- Clientes: gestión autenticada
create policy "Clientes legibles por autenticados" on clientes
  for select using (auth.role() = 'authenticated');

create policy "Clientes insertables públicamente (portal)" on clientes
  for insert with check (true);

create policy "Clientes modificables por autenticados" on clientes
  for update using (auth.role() = 'authenticated');

-- Usuarios: solo propietaria puede gestionar
create policy "Usuarios solo visibles por autenticados" on usuarios
  for select using (auth.role() = 'authenticated');

-- Gestión de profesionales, servicios, horarios — solo autenticados
create policy "Profesionales admin" on profesionales
  for all using (auth.role() = 'authenticated');

create policy "Servicios admin" on servicios
  for all using (auth.role() = 'authenticated');

create policy "Profesional_servicio admin" on profesional_servicio
  for all using (auth.role() = 'authenticated');

create policy "Horario local admin" on horario_local
  for all using (auth.role() = 'authenticated');

create policy "Horario profesional admin" on horario_profesional
  for all using (auth.role() = 'authenticated');

create policy "Dias libres admin" on dias_libres
  for all using (auth.role() = 'authenticated');

-- ================================================
-- SEED DATA
-- ================================================

-- Horario del local (Lun-Sáb 10:00-20:00, Dom cerrado)
insert into horario_local (dia_semana, abierto, hora_apertura, hora_cierre) values
  (0, false, null, null),      -- Domingo
  (1, true, '10:00', '20:00'), -- Lunes
  (2, true, '10:00', '20:00'), -- Martes
  (3, true, '10:00', '20:00'), -- Miércoles
  (4, true, '10:00', '20:00'), -- Jueves
  (5, true, '10:00', '20:00'), -- Viernes
  (6, true, '10:00', '20:00') -- Sábado
on conflict (dia_semana) do nothing;

-- Profesionales
insert into profesionales (id, nombre, especialidad, color, activo) values
  ('11111111-1111-1111-1111-111111111101', 'Nini',    'Dirección & Uñas', '#C4728A', true),
  ('11111111-1111-1111-1111-111111111102', 'Nana',    'Manicura & Pedicura', '#4a9b6f', true),
  ('11111111-1111-1111-1111-111111111103', 'Jenny',   'Peluquería', '#2B5BA8', true),
  ('11111111-1111-1111-1111-111111111104', 'Rosa',    'Depilación & Estética', '#D4621A', true),
  ('11111111-1111-1111-1111-111111111105', 'Delcy',   'Uñas & Nail Art', '#8B5CF6', true),
  ('11111111-1111-1111-1111-111111111106', 'Shirley', 'Manicura & Estética', '#EC4899', true),
  ('11111111-1111-1111-1111-111111111107', 'Diana',   'Pedicura & Bienestar', '#F59E0B', true),
  ('11111111-1111-1111-1111-111111111108', 'Viviana', 'Peluquería & Color', '#06B6D4', true)
on conflict (id) do nothing;

-- Horarios de cada profesional (Lun-Sáb 10:00-20:00)
do $$
declare
  prof_ids uuid[] := array[
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107',
    '11111111-1111-1111-1111-111111111108'
  ];
  pid uuid;
  d integer;
begin
  foreach pid in array prof_ids loop
    for d in 1..6 loop
      insert into horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
      values (pid, d, true, '10:00', '20:00')
      on conflict do nothing;
    end loop;
    insert into horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
    values (pid, 0, false, null, null)
    on conflict do nothing;
  end loop;
end;
$$;

-- Servicios — Manicura
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Manicura básica',           'Manicura', 45,  18.00),
  ('Manicura con esmalte gel',  'Manicura', 60,  25.00),
  ('Nail art (diseño sencillo)','Manicura', 75,  35.00),
  ('Retirada de gel',           'Manicura', 30,  12.00),
  ('Uñas acrílicas',            'Manicura', 90,  45.00);

-- Servicios — Pedicura
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Pedicura básica',            'Pedicura', 60,  25.00),
  ('Pedicura spa completa',      'Pedicura', 75,  35.00),
  ('Pedicura con gel',           'Pedicura', 75,  30.00);

-- Servicios — Depilación
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Depilación labio superior',  'Depilación', 15,  6.00),
  ('Depilación cejas',           'Depilación', 20,  8.00),
  ('Depilación axilas',          'Depilación', 20,  10.00),
  ('Depilación piernas completas','Depilación', 45, 22.00),
  ('Depilación ingles',          'Depilación', 30, 14.00),
  ('Depilación media pierna',    'Depilación', 30, 14.00);

-- Servicios — Peluquería
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Corte de pelo',              'Peluquería', 45,  20.00),
  ('Tinte completo',             'Peluquería', 120, 55.00),
  ('Mechas',                     'Peluquería', 150, 75.00),
  ('Peinado recogido',           'Peluquería', 60,  35.00),
  ('Alisado keratina',           'Peluquería', 180, 90.00),
  ('Corte + secado',             'Peluquería', 60,  28.00);

-- Servicios — Estética
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Limpieza facial básica',     'Estética', 60, 35.00),
  ('Tratamiento hidratante',     'Estética', 75, 45.00),
  ('Masaje facial',              'Estética', 45, 30.00),
  ('Depilación con hilo (cejas)','Estética', 20,  8.00);

-- Servicios — Bienestar
insert into servicios (nombre, categoria, duracion_min, precio) values
  ('Masaje relajante espalda',   'Bienestar', 45, 35.00),
  ('Masaje cuerpo completo',     'Bienestar', 60, 50.00),
  ('Masaje drenaje linfático',   'Bienestar', 60, 45.00);

-- Asignar todos los servicios a todas las profesionales (simplificado para seed)
insert into profesional_servicio (profesional_id, servicio_id)
select p.id, s.id
from profesionales p
cross join servicios s
on conflict do nothing;
