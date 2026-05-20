-- ============================================================
-- Tinte completo — variantes por largo de cabello
-- ============================================================
DELETE FROM servicio_variantes WHERE servicio_id IN (
  SELECT id FROM servicios WHERE nombre ILIKE 'Tinte completo%'
);

INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto', 90, 30.00, 1 FROM servicios WHERE nombre ILIKE 'Tinte completo%'
UNION ALL
SELECT id, 'Cabello medio', 90, 40.00, 2 FROM servicios WHERE nombre ILIKE 'Tinte completo%'
UNION ALL
SELECT id, 'Cabello largo', 90, 50.00, 3 FROM servicios WHERE nombre ILIKE 'Tinte completo%';

-- ============================================================
-- Mechas Balayage — precio_desde = true, sin variantes
-- La reserva se permite aunque no haya variantes (valoración en persona)
-- No hay nada que ejecutar aquí; el comportamiento lo controla el código
-- ============================================================
