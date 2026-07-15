-- Ejecutar en Supabase SQL Editor
--
-- Protección a nivel de base de datos contra solapamientos de reservas y
-- reservas que caen dentro de un horario bloqueado manualmente.
--
-- Reglas (decididas con el negocio):
--   - Crear reserva (portal público, "Nueva reserva" del admin): SIEMPRE se
--     bloquea si hay solapamiento con otra reserva activa o con un bloqueo.
--   - Editar una cita ya existente (panel admin): el solapamiento con OTRA
--     reserva se sigue permitiendo si la empleada confirma (como ya hacía el
--     panel), pero un solapamiento con un horario BLOQUEADO nunca se permite.
--   - Cambios que no tocan fecha/hora/profesional (notas, pago, marcar
--     completada/no_presentada) nunca se revalidan, para no romper citas
--     antiguas que ya tuvieran un conflicto antes de instalar esto.
--
-- No requiere limpiar datos históricos: al ser un trigger (no un constraint
-- de exclusión), solo se evalúa en cada INSERT/UPDATE nuevo, nunca sobre las
-- filas que ya existen en la tabla.

create or replace function validar_reserva_sin_conflicto()
returns trigger as $$
declare
  conflicto_id uuid;
  cambia_horario boolean := true;
  reactivando boolean := false;
begin
  if new.estado = 'cancelada' then
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    cambia_horario := (
      new.fecha <> old.fecha
      or new.hora_inicio <> old.hora_inicio
      or new.hora_fin <> old.hora_fin
      or new.profesional_id is distinct from old.profesional_id
    );
    reactivando := (old.estado = 'cancelada' and new.estado <> 'cancelada');

    if not cambia_horario and not reactivando then
      return new;
    end if;
  end if;

  -- Serializa los inserts/updates de una misma profesional para que dos
  -- peticiones simultáneas no se cuelen entre el check y el guardado.
  perform pg_advisory_xact_lock(hashtext(new.profesional_id::text)::bigint);

  -- 1. Horario bloqueado manualmente: nunca se permite, ni al crear ni al editar.
  perform 1
  from bloqueos_horario b
  where b.profesional_id = new.profesional_id
    and b.fecha = new.fecha
    and new.hora_inicio < b.hora_fin
    and new.hora_fin > b.hora_inicio
  limit 1;

  if found then
    raise exception 'Ese horario está bloqueado por la profesional' using errcode = 'BR002';
  end if;

  -- 2. Solapamiento con otra reserva activa: bloqueo estricto solo al CREAR.
  --    Al editar una cita existente, el panel admin ya avisa y permite forzarlo.
  if TG_OP = 'INSERT' then
    select r.id into conflicto_id
    from reservas r
    where r.profesional_id = new.profesional_id
      and r.fecha = new.fecha
      and r.estado <> 'cancelada'
      and new.hora_inicio < r.hora_fin
      and new.hora_fin > r.hora_inicio
    limit 1;

    if conflicto_id is not null then
      raise exception 'Solapamiento con la reserva %', conflicto_id using errcode = 'BR001';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_validar_reserva_sin_conflicto on reservas;
create trigger trg_validar_reserva_sin_conflicto
  before insert or update on reservas
  for each row execute function validar_reserva_sin_conflicto();
