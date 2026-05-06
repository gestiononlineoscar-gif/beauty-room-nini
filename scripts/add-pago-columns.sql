-- Añadir columnas de pago a reservas
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS pagado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metodo_pago text;
