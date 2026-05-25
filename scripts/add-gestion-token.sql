-- Token único por reserva para que el cliente pueda cancelar/modificar desde el email
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS gestion_token uuid DEFAULT gen_random_uuid();
UPDATE reservas SET gestion_token = gen_random_uuid() WHERE gestion_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_gestion_token ON reservas(gestion_token);
