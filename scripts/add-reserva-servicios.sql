-- Ejecutar en Supabase SQL Editor
-- Tabla para almacenar los servicios individuales de reservas multi-servicio

create table if not exists reserva_servicios (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid references reservas(id) on delete cascade not null,
  servicio_id uuid references servicios(id) not null,
  variante_id uuid references servicio_variantes(id),
  orden integer not null default 0,
  created_at timestamptz default now()
);

alter table reserva_servicios enable row level security;

create policy "reserva_servicios visible por autenticados" on reserva_servicios
  for select using (auth.role() = 'authenticated');

create policy "reserva_servicios insertable por autenticados" on reserva_servicios
  for insert with check (auth.role() = 'authenticated');

create policy "reserva_servicios modificable por autenticados" on reserva_servicios
  for update using (auth.role() = 'authenticated');

create policy "reserva_servicios eliminable por autenticados" on reserva_servicios
  for delete using (auth.role() = 'authenticated');
