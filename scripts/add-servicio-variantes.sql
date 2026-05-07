-- ============================================================
-- SERVICIO VARIANTES
-- ============================================================

CREATE TABLE IF NOT EXISTS servicio_variantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id uuid NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  duracion_min integer NOT NULL,
  precio numeric(10,2) NOT NULL,
  orden integer NOT NULL DEFAULT 0
);

ALTER TABLE servicio_variantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read variantes" ON servicio_variantes;
CREATE POLICY "Public read variantes" ON servicio_variantes FOR SELECT USING (true);

-- Añadir variante_id a reservas
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS variante_id uuid REFERENCES servicio_variantes(id) ON DELETE SET NULL;

-- Borrar variantes existentes (idempotente)
DELETE FROM servicio_variantes;

-- ============================================================
-- MANICURA — Uñas acrigel o poligel con molde
-- ============================================================
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 135, 35.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%molde%'
UNION ALL
SELECT id, 'Tamaño L',   150, 37.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%molde%'
UNION ALL
SELECT id, 'Tamaño XL',  165, 39.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%molde%';

-- Uñas acrigel o poligel con tips
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 90,  32.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%tips%'
UNION ALL
SELECT id, 'Tamaño L',   100, 34.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%tips%'
UNION ALL
SELECT id, 'Tamaño XL',  110, 36.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas acrigel%tips%';

-- Uñas de gel con molde
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 135, 39.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas de gel%molde%'
UNION ALL
SELECT id, 'Tamaño L',   150, 41.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas de gel%molde%'
UNION ALL
SELECT id, 'Tamaño XL',  165, 43.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas de gel%molde%';

-- Uñas de gel con tips
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 90,  35.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas de gel%tips%'
UNION ALL
SELECT id, 'Tamaño L',   100, 37.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas de gel%tips%'
UNION ALL
SELECT id, 'Tamaño XL',  110, 39.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas de gel%tips%';

-- Uñas acrílicas con molde
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 120, 32.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%molde%'
UNION ALL
SELECT id, 'Tamaño L',   135, 34.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%molde%'
UNION ALL
SELECT id, 'Tamaño XL',  150, 36.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%molde%';

-- Uñas acrílicas con tips
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Tamaño S/M', 80,  29.00, 1 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%tips%'
UNION ALL
SELECT id, 'Tamaño L',   90,  31.00, 2 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%tips%'
UNION ALL
SELECT id, 'Tamaño XL',  100, 34.00, 3 FROM servicios WHERE nombre ILIKE 'Uñas acrílicas%tips%';

-- ============================================================
-- DEPILACIÓN CERA — Brazos
-- ============================================================
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Medios brazos',      20, 7.00,  1 FROM servicios WHERE nombre ILIKE 'Depilación de brazos%cera%'
UNION ALL
SELECT id, 'Brazos completos',   40, 10.00, 2 FROM servicios WHERE nombre ILIKE 'Depilación de brazos%cera%';

-- Piernas
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Medias piernas',     20, 9.00,  1 FROM servicios WHERE nombre ILIKE 'Depilación de piernas%cera%'
UNION ALL
SELECT id, 'Piernas completas',  40, 18.00, 2 FROM servicios WHERE nombre ILIKE 'Depilación de piernas%cera%';

-- ============================================================
-- PELUQUERÍA — Lavado y peinado
-- ============================================================
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto',   30, 12.00, 1 FROM servicios WHERE nombre ILIKE 'Lavado y peinado%'
UNION ALL
SELECT id, 'Cabello medio',   40, 15.00, 2 FROM servicios WHERE nombre ILIKE 'Lavado y peinado%'
UNION ALL
SELECT id, 'Cabello largo',   50, 20.00, 3 FROM servicios WHERE nombre ILIKE 'Lavado y peinado%'
UNION ALL
SELECT id, 'Cabello especial', 60, 25.00, 4 FROM servicios WHERE nombre ILIKE 'Lavado y peinado%';

-- Alisado con keratina
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto', 120, 120.00, 1 FROM servicios WHERE nombre ILIKE 'Alisado con keratina%'
UNION ALL
SELECT id, 'Cabello medio', 180, 150.00, 2 FROM servicios WHERE nombre ILIKE 'Alisado con keratina%'
UNION ALL
SELECT id, 'Cabello largo', 240, 180.00, 3 FROM servicios WHERE nombre ILIKE 'Alisado con keratina%'
UNION ALL
SELECT id, 'Cabello extra', 240, 210.00, 4 FROM servicios WHERE nombre ILIKE 'Alisado con keratina%';

-- Alisado orgánico
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto', 150, 120.00, 1 FROM servicios WHERE nombre ILIKE 'Alisado orgánico%'
UNION ALL
SELECT id, 'Cabello medio', 180, 150.00, 2 FROM servicios WHERE nombre ILIKE 'Alisado orgánico%'
UNION ALL
SELECT id, 'Cabello largo', 240, 180.00, 3 FROM servicios WHERE nombre ILIKE 'Alisado orgánico%';

-- Botox capilar
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto', 60,  25.00, 1 FROM servicios WHERE nombre ILIKE 'Botox capilar%'
UNION ALL
SELECT id, 'Cabello medio', 90,  40.00, 2 FROM servicios WHERE nombre ILIKE 'Botox capilar%'
UNION ALL
SELECT id, 'Cabello largo', 120, 50.00, 3 FROM servicios WHERE nombre ILIKE 'Botox capilar%';

-- Hidratación y nutrición
INSERT INTO servicio_variantes (servicio_id, nombre, duracion_min, precio, orden)
SELECT id, 'Cabello corto', 60, 15.00, 1 FROM servicios WHERE nombre ILIKE 'Hidratación y nutrición%'
UNION ALL
SELECT id, 'Cabello medio', 60, 20.00, 2 FROM servicios WHERE nombre ILIKE 'Hidratación y nutrición%'
UNION ALL
SELECT id, 'Cabello largo', 60, 25.00, 3 FROM servicios WHERE nombre ILIKE 'Hidratación y nutrición%';

-- ============================================================
-- VERIFICACIÓN (opcional)
-- ============================================================
-- SELECT s.nombre, count(v.id) as variantes
-- FROM servicios s
-- LEFT JOIN servicio_variantes v ON v.servicio_id = s.id
-- WHERE s.precio_desde = true
-- GROUP BY s.nombre ORDER BY s.nombre;
