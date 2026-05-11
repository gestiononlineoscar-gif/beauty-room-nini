-- Añadir soporte de inasistencias y bloqueo de clientes
-- Ejecutar en Supabase Dashboard → SQL Editor

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS inasistencias INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN NOT NULL DEFAULT FALSE;
