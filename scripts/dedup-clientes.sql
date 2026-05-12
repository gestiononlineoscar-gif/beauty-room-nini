-- Eliminar clientes duplicados (mismo teléfono o mismo nombre sin teléfono)
-- Conserva el registro con email, o el de nombre más largo, o el más antiguo
-- Ejecutar en Supabase Dashboard → SQL Editor

BEGIN;

-- 1. Reasignar reservas de duplicados al cliente a conservar (por teléfono)
UPDATE reservas r
SET cliente_id = mejor.id
FROM (
  SELECT DISTINCT ON (telefono)
    id, telefono
  FROM clientes
  WHERE telefono IS NOT NULL
  ORDER BY telefono,
    (email IS NOT NULL) DESC,
    length(nombre) DESC,
    created_at ASC
) mejor
JOIN clientes dup ON dup.telefono = mejor.telefono AND dup.id <> mejor.id
WHERE r.cliente_id = dup.id;

-- 2. Eliminar duplicados por teléfono (mantener el mejor)
DELETE FROM clientes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY telefono
        ORDER BY
          (email IS NOT NULL) DESC,
          length(nombre) DESC,
          created_at ASC
      ) AS rn
    FROM clientes
    WHERE telefono IS NOT NULL
  ) t
  WHERE rn > 1
);

-- 3. Reasignar reservas de duplicados al cliente a conservar (por nombre, sin teléfono)
UPDATE reservas r
SET cliente_id = mejor.id
FROM (
  SELECT DISTINCT ON (lower(trim(nombre)))
    id, nombre
  FROM clientes
  WHERE telefono IS NULL
  ORDER BY lower(trim(nombre)),
    (email IS NOT NULL) DESC,
    length(nombre) DESC,
    created_at ASC
) mejor
JOIN clientes dup ON lower(trim(dup.nombre)) = lower(trim(mejor.nombre))
  AND dup.telefono IS NULL
  AND dup.id <> mejor.id
WHERE r.cliente_id = dup.id;

-- 4. Eliminar duplicados por nombre (sin teléfono)
DELETE FROM clientes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY lower(trim(nombre))
        ORDER BY
          (email IS NOT NULL) DESC,
          length(nombre) DESC,
          created_at ASC
      ) AS rn
    FROM clientes
    WHERE telefono IS NULL
  ) t
  WHERE rn > 1
);

-- Resultado
SELECT count(*) AS total_final FROM clientes;

COMMIT;
