-- ============================================================
-- BEAUTY ROOM NINI — Servicios, categorías y asignaciones
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- 1. Añadir columna precio_desde si no existe
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS precio_desde boolean NOT NULL DEFAULT false;

-- 2. Limpiar tablas
-- Desvinculamos reservas existentes para no violar la FK
UPDATE reservas SET servicio_id = NULL WHERE servicio_id IS NOT NULL;
DELETE FROM profesional_servicio;
DELETE FROM servicios;

-- 3. Insertar todos los servicios
INSERT INTO servicios (categoria, nombre, duracion_min, precio, precio_desde, activo) VALUES

-- ══ MANICURA ══
('Manicura', 'Uñas acrigel o poligel con molde',        150, 35,  true,  true),
('Manicura', 'Uñas acrigel o poligel con tips',          100, 32,  true,  true),
('Manicura', 'Relleno/Refuerzo con acrigel o poligel',   75,  27,  false, true),
('Manicura', 'Uñas de gel con molde',                    150, 39,  true,  true),
('Manicura', 'Uñas de gel con tips',                     100, 35,  true,  true),
('Manicura', 'Relleno/Refuerzo con gel',                 75,  30,  false, true),
('Manicura', 'Uñas soft gel',                            60,  30,  false, true),
('Manicura', 'Uñas acrílicas con molde',                 120, 32,  true,  true),
('Manicura', 'Uñas acrílicas con tips',                  90,  29,  true,  true),
('Manicura', 'Relleno/Refuerzo con acrílico',            60,  25,  false, true),
('Manicura', 'Relleno/Refuerzo con base fibra',          60,  25,  false, true),
('Manicura', 'Semipermanente completo',                  45,  18,  false, true),
('Manicura', 'Semipermanente exprés',                    40,  14,  false, true),
('Manicura', 'Esmaltado normal completa',                40,  14,  false, true),
('Manicura', 'Esmaltado normal exprés',                  30,  10,  false, true),
('Manicura', 'Manicura sin esmaltar',                    30,  10,  false, true),
('Manicura', 'Solo cortar y limar en manos',             15,  5,   false, true),
('Manicura', 'Retirada de uñas acrílicas con torno',     30,  10,  false, true),
('Manicura', 'Retirada de uñas acrílicas solo acetona',  40,  12,  false, true),
('Manicura', 'Retirada de semipermanente con torno',     10,  6,   false, true),
('Manicura', 'Retirada de semipermanente con acetona',   25,  10,  false, true),
('Manicura', 'Decoración de uñas',                       20,  1,   false, true),
('Manicura', 'Reconstrucción de uña / Uña rota',         20,  2,   false, true),

-- ══ PEDICURA ══
('Pedicura', 'Pedicura completa con semipermanente',     60,  25,  false, true),
('Pedicura', 'Pedicura exprés con semipermanente',       45,  15,  false, true),
('Pedicura', 'Pedicura completa con esmaltado normal',   60,  20,  false, true),
('Pedicura', 'Pedicura exprés con esmaltado normal',     45,  12,  false, true),
('Pedicura', 'Pedicura completa sin esmaltar',           45,  15,  false, true),
('Pedicura', 'Corte de uñas en los pies',                20,  5,   false, true),
('Pedicura', 'Retirada de acrílico en los pies',         20,  8,   false, true),
('Pedicura', 'Retirada de semipermanente en los pies',   10,  5,   false, true),
('Pedicura', 'Reconstrucción de uña en los pies',        20,  3,   false, true),

-- ══ DEPILACIÓN CON HILO ══
('Depilación Hilo', 'Depilación de barbilla con hilo',           20, 7,  false, true),
('Depilación Hilo', 'Depilación facial completo con hilo',       40, 20, false, true),
('Depilación Hilo', 'Depilación de patillas con hilo',           30, 7,  false, true),
('Depilación Hilo', 'Depilación de labio con hilo',              20, 7,  false, true),
('Depilación Hilo', 'Depilación de cejas con hilo',              30, 12, false, true),
('Depilación Hilo', 'Depilación de cejas con hilo + Tinte',      40, 15, false, true),

-- ══ DEPILACIÓN CON PINZA ══
('Depilación Pinza', 'Depilación de cejas con pinzas (solo limpieza)',       20, 7,  false, true),
('Depilación Pinza', 'Depilación de cejas con pinzas + Diseño',              25, 15, false, true),
('Depilación Pinza', 'Depilación de cejas con pinzas + Diseño + Tinte',      30, 20, false, true),

-- ══ DEPILACIÓN CON CERA ══
('Depilación Cera', 'Depilación de ingles con cera',                    20, 8,   false, true),
('Depilación Cera', 'Depilación de ingles completas con cera',          30, 12,  false, true),
('Depilación Cera', 'Depilación de zona perianal con cera',             30, 6,   false, true),
('Depilación Cera', 'Depilación de patillas con cera',                  20, 7,   false, true),
('Depilación Cera', 'Depilación de barbilla con cera',                  10, 5,   false, true),
('Depilación Cera', 'Depilación de labio superior con cera',            10, 5,   false, true),
('Depilación Cera', 'Depilación de cejas con cera + Diseño + Tinte',   30, 18,  false, true),
('Depilación Cera', 'Depilación de cejas con cera + Diseño',           20, 12,  false, true),
('Depilación Cera', 'Depilación de cejas con cera (solo limpieza)',     15, 5,   false, true),
('Depilación Cera', 'Depilación de espalda con cera',                   30, 12,  false, true),
('Depilación Cera', 'Depilación de brazos con cera',                    30, 7,   true,  true),
('Depilación Cera', 'Depilación de piernas con cera',                   30, 9,   true,  true),
('Depilación Cera', 'Depilación de axilas con cera',                    20, 7,   false, true),

-- ══ PELUQUERÍA ══
('Peluquería', 'Hilos de luz',             15,  5,   false, true),
('Peluquería', 'Solo lavar',               10,  7,   false, true),
('Peluquería', 'Corte',                    30,  15,  false, true),
('Peluquería', 'Corte de flequillo',       10,  7,   false, true),
('Peluquería', 'Lavado y peinado',         45,  12,  true,  true),
('Peluquería', 'Lavado y secado',          15,  10,  false, true),
('Peluquería', 'Alisado con keratina',     180, 120, true,  true),
('Peluquería', 'Alisado orgánico',         195, 120, true,  true),
('Peluquería', 'Botox capilar',            90,  25,  true,  true),
('Peluquería', 'Hidratación y nutrición',  60,  15,  true,  true),
('Peluquería', 'Retoque de raíz',          60,  20,  false, true),
('Peluquería', 'Tinte completo',           90,  20,  true,  true),
('Peluquería', 'Mechas',                   120, 40,  false, true),
('Peluquería', 'Mechas Contouring',        120, 70,  false, true),
('Peluquería', 'Mechas Balayage',          180, 80,  true,  true),

-- ══ ESTÉTICA (faciales y cejas) — Rosa ══
('Estética', 'Higiene facial profunda',          75,  45, false, true),
('Estética', 'Higienización facial',             30,  35, false, true),
('Estética', 'Tratamiento facial anti acné',     80,  80, false, true),
('Estética', 'Tratamiento facial foto LED',      45,  50, false, true),
('Estética', 'Laminado de cejas',                60,  35, false, true),

-- ══ PESTAÑAS — Nini ══
('Pestañas', 'Lifting y tinte de pestañas',           80,  35, false, true),
('Pestañas', 'Retirada de extensiones de pestañas',   20,  8,  false, true),
('Pestañas', 'Extensiones de pestañas pelo a pelo',   120, 40, false, true),
('Pestañas', 'Extensiones de pestañas 2D',            120, 45, false, true),
('Pestañas', 'Extensiones de pestañas 3D',            150, 50, false, true),

-- ══ BIENESTAR Y SALUD — Jenny ══
('Bienestar y Salud', 'Masaje relajante',                             60,  45, false, true),
('Bienestar y Salud', 'Biomagnetismo',                                120, 50, false, true),
('Bienestar y Salud', 'Terapia completa (acupuntura, ventosas, masaje)', 150, 90, false, true),
('Bienestar y Salud', 'Acupuntura',                                   60,  50, false, true),
('Bienestar y Salud', 'Masaje descontracturante',                     45,  40, false, true),
('Bienestar y Salud', 'Masaje con ventosas o chupping',               40,  40, false, true),
('Bienestar y Salud', 'Reiki y Gemología',                            50,  40, false, true),
('Bienestar y Salud', 'Quiromasajes',                                 30,  40, false, true);


-- 4. Asignaciones profesional → servicios por categoría

-- NANA: Manicura, Pedicura
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Nana%' AND s.categoria IN ('Manicura', 'Pedicura');

-- DELCY: Manicura, Pedicura
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Delcy%' AND s.categoria IN ('Manicura', 'Pedicura');

-- DIANA: Peluquería
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Diana%' AND s.categoria = 'Peluquería';

-- JENNY: Bienestar y Salud
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Jenny%' AND s.categoria = 'Bienestar y Salud';

-- NINI: Pestañas
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Nini%' AND s.categoria = 'Pestañas';

-- ROSA: Depilación Hilo, Depilación Pinza, Depilación Cera, Estética
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Rosa%'
  AND s.categoria IN ('Depilación Hilo', 'Depilación Pinza', 'Depilación Cera', 'Estética');

-- SHIRLEY: Manicura, Pedicura, Depilación Hilo
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Shirley%'
  AND s.categoria IN ('Manicura', 'Pedicura', 'Depilación Hilo');

-- VIVIANA: Manicura, Pedicura
INSERT INTO profesional_servicio (profesional_id, servicio_id)
SELECT p.id, s.id FROM profesionales p, servicios s
WHERE p.nombre ILIKE '%Viviana%' AND s.categoria IN ('Manicura', 'Pedicura');
