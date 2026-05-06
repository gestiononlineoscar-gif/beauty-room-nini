-- ============================================================
-- Horarios por profesional - Beauty Room Nini
-- Ejecutar en: Supabase > SQL Editor
-- dia_semana: 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
-- ============================================================

-- Borrar horarios existentes de estas profesionales
DELETE FROM horario_profesional
WHERE profesional_id IN (
  SELECT id FROM profesionales
  WHERE nombre ILIKE ANY(ARRAY[
    '%Delcy%', '%Diana%', '%Shirley%', '%Jenny%',
    '%Viviana%', '%Nini%', '%Nana%'
  ])
);

-- ── DELCY ─────────────────────────────────────────
-- Lun–Vie 10:00–18:00 · Sáb 10:00–17:00 · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL,       NULL),
  (1, true,  '10:00:00', '18:00:00'),
  (2, true,  '10:00:00', '18:00:00'),
  (3, true,  '10:00:00', '18:00:00'),
  (4, true,  '10:00:00', '18:00:00'),
  (5, true,  '10:00:00', '18:00:00'),
  (6, true,  '10:00:00', '17:00:00')
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Delcy%';

-- ── DIANA ─────────────────────────────────────────
-- Lun–Vie 10:00–18:00 · Sáb 10:00–17:00 · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL,       NULL),
  (1, true,  '10:00:00', '18:00:00'),
  (2, true,  '10:00:00', '18:00:00'),
  (3, true,  '10:00:00', '18:00:00'),
  (4, true,  '10:00:00', '18:00:00'),
  (5, true,  '10:00:00', '18:00:00'),
  (6, true,  '10:00:00', '17:00:00')
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Diana%';

-- ── SHIRLEY ───────────────────────────────────────
-- Lun–Sáb 10:00–14:00 · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL,       NULL),
  (1, true,  '10:00:00', '14:00:00'),
  (2, true,  '10:00:00', '14:00:00'),
  (3, true,  '10:00:00', '14:00:00'),
  (4, true,  '10:00:00', '14:00:00'),
  (5, true,  '10:00:00', '14:00:00'),
  (6, true,  '10:00:00', '14:00:00')
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Shirley%';

-- ── JENNY ─────────────────────────────────────────
-- Agenda abierta (horario del salón)
-- Lun–Mar 10:00–20:00 · Mié–Vie 10:00–21:00 · Sáb 10:00–17:00 · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL,       NULL),
  (1, true,  '10:00:00', '20:00:00'),
  (2, true,  '10:00:00', '20:00:00'),
  (3, true,  '10:00:00', '21:00:00'),
  (4, true,  '10:00:00', '21:00:00'),
  (5, true,  '10:00:00', '21:00:00'),
  (6, true,  '10:00:00', '17:00:00')
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Jenny%';

-- ── VIVIANA ───────────────────────────────────────
-- Lun–Mar 16:00–20:00 · Mié–Jue 16:00–21:00 · Vie 17:00–21:00 · Sáb 10:00–17:00 · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL,       NULL),
  (1, true,  '16:00:00', '20:00:00'),
  (2, true,  '16:00:00', '20:00:00'),
  (3, true,  '16:00:00', '21:00:00'),
  (4, true,  '16:00:00', '21:00:00'),
  (5, true,  '17:00:00', '21:00:00'),
  (6, true,  '10:00:00', '17:00:00')
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Viviana%';

-- ── NINI ──────────────────────────────────────────
-- Lun–Vie 10:00–16:00 · Sáb cerrada · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL, NULL),
  (1, true,  '10:00:00', '16:00:00'),
  (2, true,  '10:00:00', '16:00:00'),
  (3, true,  '10:00:00', '16:00:00'),
  (4, true,  '10:00:00', '16:00:00'),
  (5, true,  '10:00:00', '16:00:00'),
  (6, false, NULL, NULL)
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Nini%';

-- ── NANA ──────────────────────────────────────────
-- Lun–Mar 12:00–20:00 · Mié–Vie 13:00–21:00 · Sáb cerrada · Dom cerrada
INSERT INTO horario_profesional (profesional_id, dia_semana, trabaja, hora_inicio, hora_fin)
SELECT id, d.dia, d.trabaja, d.hi::time, d.hf::time
FROM profesionales, (VALUES
  (0, false, NULL, NULL),
  (1, true,  '12:00:00', '20:00:00'),
  (2, true,  '12:00:00', '20:00:00'),
  (3, true,  '13:00:00', '21:00:00'),
  (4, true,  '13:00:00', '21:00:00'),
  (5, true,  '13:00:00', '21:00:00'),
  (6, false, NULL, NULL)
) AS d(dia, trabaja, hi, hf)
WHERE nombre ILIKE '%Nana%';
