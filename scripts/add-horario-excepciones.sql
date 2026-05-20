-- Excepciones de horario por día específico
-- Permite a una profesional trabajar un día que no trabaja normalmente
-- o en un horario distinto al habitual

CREATE TABLE IF NOT EXISTS horario_excepciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  motivo text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profesional_id, fecha)
);

ALTER TABLE horario_excepciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read excepciones" ON horario_excepciones FOR SELECT USING (true);
