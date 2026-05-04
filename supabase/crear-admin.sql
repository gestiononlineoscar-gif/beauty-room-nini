-- ================================================
-- CREAR PRIMER USUARIO ADMINISTRADOR
-- ================================================
-- Pasos:
-- 1. Ir a Supabase → Authentication → Users → "Add user"
-- 2. Crear el usuario con email + contraseña
-- 3. Copiar el UUID del usuario creado
-- 4. Ejecutar este SQL reemplazando el UUID y nombre

-- Reemplaza 'TU-UUID-AQUI' con el UUID del usuario de Supabase Auth
-- Reemplaza 'Tu Nombre' con el nombre real

INSERT INTO usuarios (id, nombre, rol, activo)
VALUES (
  'TU-UUID-AQUI',
  'Nini',
  'propietaria',
  true
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- Para crear una EMPLEADA, usa este template:
-- INSERT INTO usuarios (id, nombre, rol, profesional_id, activo)
-- VALUES (
--   'UUID-EMPLEADA',
--   'Nana',
--   'empleada',
--   '11111111-1111-1111-1111-111111111102', -- UUID de Nana en tabla profesionales
--   true
-- );

-- ================================================
-- VERIFICAR USUARIOS CREADOS
-- ================================================
SELECT u.nombre, u.rol, u.activo, p.nombre as profesional
FROM usuarios u
LEFT JOIN profesionales p ON p.id = u.profesional_id;
