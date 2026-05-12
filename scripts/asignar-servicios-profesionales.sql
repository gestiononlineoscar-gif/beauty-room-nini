-- Asignar servicios a: Delcy, Diana, Nana, Shirley, Viviana
-- NO modifica ninguna otra profesional
-- Seguro ejecutarlo varias veces (borra y reinsertar solo estas 5)
-- Ejecutar en: Supabase Dashboard → SQL Editor

DO $$
DECLARE
  delcy_id   uuid;
  diana_id   uuid;
  nana_id    uuid;
  shirley_id uuid;
  viviana_id uuid;
  insertadas int;
  rec        record;
BEGIN

  -- ── Buscar IDs ───────────────────────────────────────────────────────────────
  SELECT id INTO delcy_id   FROM profesionales WHERE nombre ILIKE '%Delcy%'   LIMIT 1;
  SELECT id INTO diana_id   FROM profesionales WHERE nombre ILIKE '%Diana%'   LIMIT 1;
  SELECT id INTO nana_id    FROM profesionales WHERE nombre ILIKE '%Nana%'    LIMIT 1;
  SELECT id INTO shirley_id FROM profesionales WHERE nombre ILIKE '%Shirley%' LIMIT 1;
  SELECT id INTO viviana_id FROM profesionales WHERE nombre ILIKE '%Viviana%' LIMIT 1;

  IF delcy_id   IS NULL THEN RAISE EXCEPTION 'No se encontró profesional: Delcy';   END IF;
  IF diana_id   IS NULL THEN RAISE EXCEPTION 'No se encontró profesional: Diana';   END IF;
  IF nana_id    IS NULL THEN RAISE EXCEPTION 'No se encontró profesional: Nana';    END IF;
  IF shirley_id IS NULL THEN RAISE EXCEPTION 'No se encontró profesional: Shirley'; END IF;
  IF viviana_id IS NULL THEN RAISE EXCEPTION 'No se encontró profesional: Viviana'; END IF;

  -- ── Limpiar SOLO estas 5 profesionales (no toca a las demás) ─────────────────
  DELETE FROM profesional_servicio
  WHERE profesional_id IN (delcy_id, diana_id, nana_id, shirley_id, viviana_id);

  -- ════════════════════════════════════════════════════════════════════════════
  -- DELCY
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO profesional_servicio (profesional_id, servicio_id)
  SELECT delcy_id, id FROM servicios WHERE nombre IN (
    -- 💅 Manicura
    'Uñas acrigel o poligel con molde',
    'Uñas acrigel o poligel con tips',
    'Relleno/Refuerzo con acrigel o poligel',
    'Uñas de gel con molde',
    'Uñas de gel con tips',
    'Relleno/Refuerzo con gel',
    'Uñas soft gel',
    'Uñas acrílicas con molde',
    'Uñas acrílicas con tips',
    'Relleno/Refuerzo con acrílico',
    'Semipermanente completo',
    'Semipermanente exprés',
    'Esmaltado normal completa',
    'Esmaltado normal exprés',
    'Manicura sin esmaltar',
    'Solo cortar y limar en manos',
    'Retirada de uñas acrílicas con torno',
    'Retirada de uñas acrílicas solo acetona',
    'Retirada de semipermanente con torno',
    'Retirada de semipermanente con solo acetona',
    'Decoración de uñas',
    'Reconstrucción de uña/Uña rota',
    -- 🦶 Pedicura
    'Pedicura completa con semipermanente',
    'Pedicura completa con esmaltado normal',
    'Pedicura completa sin esmaltar',
    'Retirada de acrílico en los pies',
    'Retirada de semipermanente en los pies',
    -- ✂️ Depilación Pinza
    'Depilación de cejas con pinzas (Solo limpieza)',
    'Depilación de cejas con pinzas + Diseño',
    'Depilación de cejas con pinzas + Diseño + Tinte',
    -- 🟡 Depilación Cera
    'Depilación de ingles con cera',
    'Depilación de ingles completas con cera',
    'Depilación de zona perianal con cera',
    'Depilación de patillas con cera',
    'Depilación de barbilla con cera',
    'Depilación de labio superior con cera',
    'Depilación de cejas con cera + Diseño + Tinte',
    'Depilación de cejas con cera + Diseño',
    'Depilación de cejas con cera (Solo limpieza)',
    'Depilación de espalda con cera',
    'Depilación de brazos con cera',
    'Depilación de piernas con cera',
    'Depilación de axilas con cera',
    -- ✨ Estética
    'Higiene facial profunda',
    'Higienización facial',
    'Tratamiento facial anti acné',
    'Tratamiento facial foto led',
    'Laminado de cejas',
    'Lifting y tinte de pestañas'
  );
  GET DIAGNOSTICS insertadas = ROW_COUNT;
  RAISE NOTICE '✅ Delcy   → % servicios asignados', insertadas;

  -- ════════════════════════════════════════════════════════════════════════════
  -- DIANA
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO profesional_servicio (profesional_id, servicio_id)
  SELECT diana_id, id FROM servicios WHERE nombre IN (
    -- 💅 Manicura
    'Relleno/Refuerzo con base fibra',
    'Semipermanente completo',
    'Semipermanente exprés',
    'Esmaltado normal completa',
    'Esmaltado normal exprés',
    'Manicura sin esmaltar',
    'Solo cortar y limar en manos',
    'Retirada de uñas acrílicas con torno',
    'Retirada de uñas acrílicas solo acetona',
    'Retirada de semipermanente con torno',
    'Retirada de semipermanente con solo acetona',
    'Decoración de uñas',
    -- 🦶 Pedicura
    'Pedicura completa con semipermanente',
    'Pedicura exprés con semipermanente',
    'Pedicura completa con esmaltado normal',
    'Pedicura exprés con esmaltado normal',
    'Pedicura completa sin esmaltar',
    'Corte de uñas en los pies',
    'Retirada de acrílico en los pies',
    'Retirada de semipermanente en los pies',
    -- ✂️ Depilación Pinza
    'Depilación de cejas con pinzas (Solo limpieza)',
    'Depilación de cejas con pinzas + Diseño',
    'Depilación de cejas con pinzas + Diseño + Tinte',
    -- 🟡 Depilación Cera
    'Depilación de patillas con cera',
    'Depilación de barbilla con cera',
    'Depilación de labio superior con cera',
    'Depilación de cejas con cera + Diseño + Tinte',
    'Depilación de cejas con cera + Diseño',
    'Depilación de cejas con cera (Solo limpieza)',
    'Depilación de espalda con cera',
    'Depilación de brazos con cera',
    'Depilación de piernas con cera',
    'Depilación de axilas con cera',
    -- 💇 Peluquería
    'Hilos de luz',
    'Solo lavar',
    'Corte',
    'Corte de flequillo',
    'Lavado y peinado',
    'Lavado y secado',
    'Alisado con keratina',
    'Alisado orgánico',
    'Botox capilar',
    'Hidratación y nutrición',
    'Retoque de raíz',
    'Tinte completo',
    'Mechas',
    'Mechas Contouring',
    'Mechas Balayage',
    -- ✨ Estética
    'Masaje relajante'
  );
  GET DIAGNOSTICS insertadas = ROW_COUNT;
  RAISE NOTICE '✅ Diana   → % servicios asignados', insertadas;

  -- ════════════════════════════════════════════════════════════════════════════
  -- NANA  (⚠️ lista posiblemente incompleta — confirmar con la propietaria)
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO profesional_servicio (profesional_id, servicio_id)
  SELECT nana_id, id FROM servicios WHERE nombre IN (
    -- 💅 Manicura
    'Uñas acrílicas con tips',
    'Relleno/Refuerzo con acrílico',
    'Relleno/Refuerzo con base fibra',
    'Semipermanente completo',
    'Semipermanente exprés',
    'Esmaltado normal completa',
    'Esmaltado normal exprés',
    'Manicura sin esmaltar',
    'Solo cortar y limar en manos',
    'Retirada de uñas acrílicas con torno',
    'Retirada de uñas acrílicas solo acetona',
    'Retirada de semipermanente con torno',
    'Retirada de semipermanente con solo acetona',
    'Decoración de uñas',
    'Reconstrucción de uña/Uña rota',
    -- 🦶 Pedicura
    'Pedicura exprés con semipermanente',
    'Pedicura exprés con esmaltado normal',
    'Retirada de acrílico en los pies',
    'Retirada de semipermanente en los pies'
  );
  GET DIAGNOSTICS insertadas = ROW_COUNT;
  RAISE NOTICE '✅ Nana    → % servicios asignados', insertadas;

  -- ════════════════════════════════════════════════════════════════════════════
  -- SHIRLEY
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO profesional_servicio (profesional_id, servicio_id)
  SELECT shirley_id, id FROM servicios WHERE nombre IN (
    -- 🌿 Bienestar y Salud
    'Biomagnetismo',
    'Terapia completa',
    -- 💅 Manicura
    'Uñas acrílicas con molde',
    'Uñas acrílicas con tips',
    'Relleno/Refuerzo con acrílico',
    'Relleno/Refuerzo con base fibra',
    'Semipermanente completo',
    'Semipermanente exprés',
    'Esmaltado normal completa',
    'Esmaltado normal exprés',
    'Manicura sin esmaltar',
    'Solo cortar y limar en manos',
    'Retirada de uñas acrílicas con torno',
    'Retirada de uñas acrílicas solo acetona',
    'Retirada de semipermanente con torno',
    'Retirada de semipermanente con solo acetona',
    'Decoración de uñas',
    'Reconstrucción de uña/Uña rota',
    -- 🦶 Pedicura
    'Pedicura completa con semipermanente',
    'Pedicura exprés con semipermanente',
    'Pedicura completa con esmaltado normal',
    'Pedicura exprés con esmaltado normal',
    'Pedicura completa sin esmaltar',
    'Corte de uñas en los pies',
    'Retirada de acrílico en los pies',
    'Retirada de semipermanente en los pies',
    'Reconstrucción de uña en los pies',
    -- 🧵 Depilación Hilo
    'Depilación de barbilla con hilo',
    'Depilación facial completo con hilo',
    'Depilación de patillas con hilo',
    'Depilación de labio con hilo',
    'Depilación de cejas con hilo',
    'Depilación de cejas con hilo + Tinte',
    -- ✂️ Depilación Pinza
    'Depilación de cejas con pinzas (Solo limpieza)',
    'Depilación de cejas con pinzas + Diseño',
    'Depilación de cejas con pinzas + Diseño + Tinte',
    -- 🟡 Depilación Cera
    'Depilación de patillas con cera',
    'Depilación de barbilla con cera',
    'Depilación de labio superior con cera',
    'Depilación de cejas con cera + Diseño + Tinte',
    'Depilación de cejas con cera + Diseño',
    'Depilación de cejas con cera (Solo limpieza)',
    'Depilación de espalda con cera',
    'Depilación de brazos con cera',
    'Depilación de piernas con cera',
    'Depilación de axilas con cera',
    -- ✨ Estética
    'Masaje relajante'
  );
  GET DIAGNOSTICS insertadas = ROW_COUNT;
  RAISE NOTICE '✅ Shirley → % servicios asignados', insertadas;

  -- ════════════════════════════════════════════════════════════════════════════
  -- VIVIANA
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO profesional_servicio (profesional_id, servicio_id)
  SELECT viviana_id, id FROM servicios WHERE nombre IN (
    -- 💅 Manicura
    'Uñas acrigel o poligel con molde',
    'Uñas acrigel o poligel con tips',
    'Relleno/Refuerzo con acrigel o poligel',
    'Uñas de gel con molde',
    'Uñas de gel con tips',
    'Relleno/Refuerzo con gel',
    'Uñas soft gel',
    'Uñas acrílicas con molde',
    'Uñas acrílicas con tips',
    'Relleno/Refuerzo con acrílico',
    'Relleno/Refuerzo con base fibra',
    'Semipermanente completo',
    'Semipermanente exprés',
    'Esmaltado normal completa',
    'Esmaltado normal exprés',
    'Manicura sin esmaltar',
    'Solo cortar y limar en manos',
    'Retirada de uñas acrílicas con torno',
    'Retirada de uñas acrílicas solo acetona',
    'Retirada de semipermanente con torno',
    'Retirada de semipermanente con solo acetona',
    'Decoración de uñas',
    'Reconstrucción de uña/Uña rota',
    -- 🦶 Pedicura
    'Pedicura completa con semipermanente',
    'Pedicura exprés con semipermanente',
    'Pedicura completa con esmaltado normal',
    'Pedicura exprés con esmaltado normal',
    'Pedicura completa sin esmaltar',
    'Corte de uñas en los pies',
    'Retirada de acrílico en los pies',
    'Retirada de semipermanente en los pies',
    'Reconstrucción de uña en los pies',
    -- 🟡 Depilación Cera
    'Depilación de patillas con cera',
    'Depilación de barbilla con cera',
    'Depilación de labio superior con cera',
    'Depilación de cejas con cera + Diseño + Tinte',
    'Depilación de cejas con cera + Diseño',
    'Depilación de cejas con cera (Solo limpieza)',
    'Depilación de espalda con cera',
    'Depilación de brazos con cera',
    'Depilación de piernas con cera',
    'Depilación de axilas con cera'
  );
  GET DIAGNOSTICS insertadas = ROW_COUNT;
  RAISE NOTICE '✅ Viviana → % servicios asignados', insertadas;

  -- ── Diagnóstico: nombres no encontrados en la BD ─────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Servicios NO encontrados en la BD (comprobar nombre exacto):';

  FOR rec IN
    SELECT profesional, nombre_buscado
    FROM (VALUES
      -- Delcy
      ('Delcy','Uñas acrigel o poligel con molde'),
      ('Delcy','Uñas acrigel o poligel con tips'),
      ('Delcy','Relleno/Refuerzo con acrigel o poligel'),
      ('Delcy','Uñas de gel con molde'),
      ('Delcy','Uñas de gel con tips'),
      ('Delcy','Relleno/Refuerzo con gel'),
      ('Delcy','Uñas soft gel'),
      ('Delcy','Uñas acrílicas con molde'),
      ('Delcy','Uñas acrílicas con tips'),
      ('Delcy','Relleno/Refuerzo con acrílico'),
      ('Delcy','Semipermanente completo'),
      ('Delcy','Semipermanente exprés'),
      ('Delcy','Esmaltado normal completa'),
      ('Delcy','Esmaltado normal exprés'),
      ('Delcy','Manicura sin esmaltar'),
      ('Delcy','Solo cortar y limar en manos'),
      ('Delcy','Retirada de uñas acrílicas con torno'),
      ('Delcy','Retirada de uñas acrílicas solo acetona'),
      ('Delcy','Retirada de semipermanente con torno'),
      ('Delcy','Retirada de semipermanente con solo acetona'),
      ('Delcy','Decoración de uñas'),
      ('Delcy','Reconstrucción de uña/Uña rota'),
      ('Delcy','Pedicura completa con semipermanente'),
      ('Delcy','Pedicura completa con esmaltado normal'),
      ('Delcy','Pedicura completa sin esmaltar'),
      ('Delcy','Retirada de acrílico en los pies'),
      ('Delcy','Retirada de semipermanente en los pies'),
      ('Delcy','Depilación de cejas con pinzas (Solo limpieza)'),
      ('Delcy','Depilación de cejas con pinzas + Diseño'),
      ('Delcy','Depilación de cejas con pinzas + Diseño + Tinte'),
      ('Delcy','Depilación de ingles con cera'),
      ('Delcy','Depilación de ingles completas con cera'),
      ('Delcy','Depilación de zona perianal con cera'),
      ('Delcy','Depilación de patillas con cera'),
      ('Delcy','Depilación de barbilla con cera'),
      ('Delcy','Depilación de labio superior con cera'),
      ('Delcy','Depilación de cejas con cera + Diseño + Tinte'),
      ('Delcy','Depilación de cejas con cera + Diseño'),
      ('Delcy','Depilación de cejas con cera (Solo limpieza)'),
      ('Delcy','Depilación de espalda con cera'),
      ('Delcy','Depilación de brazos con cera'),
      ('Delcy','Depilación de piernas con cera'),
      ('Delcy','Depilación de axilas con cera'),
      ('Delcy','Higiene facial profunda'),
      ('Delcy','Higienización facial'),
      ('Delcy','Tratamiento facial anti acné'),
      ('Delcy','Tratamiento facial foto led'),
      ('Delcy','Laminado de cejas'),
      ('Delcy','Lifting y tinte de pestañas'),
      -- Diana
      ('Diana','Relleno/Refuerzo con base fibra'),
      ('Diana','Semipermanente completo'),
      ('Diana','Semipermanente exprés'),
      ('Diana','Esmaltado normal completa'),
      ('Diana','Esmaltado normal exprés'),
      ('Diana','Manicura sin esmaltar'),
      ('Diana','Solo cortar y limar en manos'),
      ('Diana','Retirada de uñas acrílicas con torno'),
      ('Diana','Retirada de uñas acrílicas solo acetona'),
      ('Diana','Retirada de semipermanente con torno'),
      ('Diana','Retirada de semipermanente con solo acetona'),
      ('Diana','Decoración de uñas'),
      ('Diana','Pedicura completa con semipermanente'),
      ('Diana','Pedicura exprés con semipermanente'),
      ('Diana','Pedicura completa con esmaltado normal'),
      ('Diana','Pedicura exprés con esmaltado normal'),
      ('Diana','Pedicura completa sin esmaltar'),
      ('Diana','Corte de uñas en los pies'),
      ('Diana','Retirada de acrílico en los pies'),
      ('Diana','Retirada de semipermanente en los pies'),
      ('Diana','Depilación de cejas con pinzas (Solo limpieza)'),
      ('Diana','Depilación de cejas con pinzas + Diseño'),
      ('Diana','Depilación de cejas con pinzas + Diseño + Tinte'),
      ('Diana','Depilación de patillas con cera'),
      ('Diana','Depilación de barbilla con cera'),
      ('Diana','Depilación de labio superior con cera'),
      ('Diana','Depilación de cejas con cera + Diseño + Tinte'),
      ('Diana','Depilación de cejas con cera + Diseño'),
      ('Diana','Depilación de cejas con cera (Solo limpieza)'),
      ('Diana','Depilación de espalda con cera'),
      ('Diana','Depilación de brazos con cera'),
      ('Diana','Depilación de piernas con cera'),
      ('Diana','Depilación de axilas con cera'),
      ('Diana','Hilos de luz'),
      ('Diana','Solo lavar'),
      ('Diana','Corte'),
      ('Diana','Corte de flequillo'),
      ('Diana','Lavado y peinado'),
      ('Diana','Lavado y secado'),
      ('Diana','Alisado con keratina'),
      ('Diana','Alisado orgánico'),
      ('Diana','Botox capilar'),
      ('Diana','Hidratación y nutrición'),
      ('Diana','Retoque de raíz'),
      ('Diana','Tinte completo'),
      ('Diana','Mechas'),
      ('Diana','Mechas Contouring'),
      ('Diana','Mechas Balayage'),
      ('Diana','Masaje relajante'),
      -- Nana
      ('Nana','Uñas acrílicas con tips'),
      ('Nana','Relleno/Refuerzo con acrílico'),
      ('Nana','Relleno/Refuerzo con base fibra'),
      ('Nana','Semipermanente completo'),
      ('Nana','Semipermanente exprés'),
      ('Nana','Esmaltado normal completa'),
      ('Nana','Esmaltado normal exprés'),
      ('Nana','Manicura sin esmaltar'),
      ('Nana','Solo cortar y limar en manos'),
      ('Nana','Retirada de uñas acrílicas con torno'),
      ('Nana','Retirada de uñas acrílicas solo acetona'),
      ('Nana','Retirada de semipermanente con torno'),
      ('Nana','Retirada de semipermanente con solo acetona'),
      ('Nana','Decoración de uñas'),
      ('Nana','Reconstrucción de uña/Uña rota'),
      ('Nana','Pedicura exprés con semipermanente'),
      ('Nana','Pedicura exprés con esmaltado normal'),
      ('Nana','Retirada de acrílico en los pies'),
      ('Nana','Retirada de semipermanente en los pies'),
      -- Shirley
      ('Shirley','Biomagnetismo'),
      ('Shirley','Terapia completa'),
      ('Shirley','Uñas acrílicas con molde'),
      ('Shirley','Uñas acrílicas con tips'),
      ('Shirley','Relleno/Refuerzo con acrílico'),
      ('Shirley','Relleno/Refuerzo con base fibra'),
      ('Shirley','Semipermanente completo'),
      ('Shirley','Semipermanente exprés'),
      ('Shirley','Esmaltado normal completa'),
      ('Shirley','Esmaltado normal exprés'),
      ('Shirley','Manicura sin esmaltar'),
      ('Shirley','Solo cortar y limar en manos'),
      ('Shirley','Retirada de uñas acrílicas con torno'),
      ('Shirley','Retirada de uñas acrílicas solo acetona'),
      ('Shirley','Retirada de semipermanente con torno'),
      ('Shirley','Retirada de semipermanente con solo acetona'),
      ('Shirley','Decoración de uñas'),
      ('Shirley','Reconstrucción de uña/Uña rota'),
      ('Shirley','Pedicura completa con semipermanente'),
      ('Shirley','Pedicura exprés con semipermanente'),
      ('Shirley','Pedicura completa con esmaltado normal'),
      ('Shirley','Pedicura exprés con esmaltado normal'),
      ('Shirley','Pedicura completa sin esmaltar'),
      ('Shirley','Corte de uñas en los pies'),
      ('Shirley','Retirada de acrílico en los pies'),
      ('Shirley','Retirada de semipermanente en los pies'),
      ('Shirley','Reconstrucción de uña en los pies'),
      ('Shirley','Depilación de barbilla con hilo'),
      ('Shirley','Depilación facial completo con hilo'),
      ('Shirley','Depilación de patillas con hilo'),
      ('Shirley','Depilación de labio con hilo'),
      ('Shirley','Depilación de cejas con hilo'),
      ('Shirley','Depilación de cejas con hilo + Tinte'),
      ('Shirley','Depilación de cejas con pinzas (Solo limpieza)'),
      ('Shirley','Depilación de cejas con pinzas + Diseño'),
      ('Shirley','Depilación de cejas con pinzas + Diseño + Tinte'),
      ('Shirley','Depilación de patillas con cera'),
      ('Shirley','Depilación de barbilla con cera'),
      ('Shirley','Depilación de labio superior con cera'),
      ('Shirley','Depilación de cejas con cera + Diseño + Tinte'),
      ('Shirley','Depilación de cejas con cera + Diseño'),
      ('Shirley','Depilación de cejas con cera (Solo limpieza)'),
      ('Shirley','Depilación de espalda con cera'),
      ('Shirley','Depilación de brazos con cera'),
      ('Shirley','Depilación de piernas con cera'),
      ('Shirley','Depilación de axilas con cera'),
      ('Shirley','Masaje relajante'),
      -- Viviana
      ('Viviana','Uñas acrigel o poligel con molde'),
      ('Viviana','Uñas acrigel o poligel con tips'),
      ('Viviana','Relleno/Refuerzo con acrigel o poligel'),
      ('Viviana','Uñas de gel con molde'),
      ('Viviana','Uñas de gel con tips'),
      ('Viviana','Relleno/Refuerzo con gel'),
      ('Viviana','Uñas soft gel'),
      ('Viviana','Uñas acrílicas con molde'),
      ('Viviana','Uñas acrílicas con tips'),
      ('Viviana','Relleno/Refuerzo con acrílico'),
      ('Viviana','Relleno/Refuerzo con base fibra'),
      ('Viviana','Semipermanente completo'),
      ('Viviana','Semipermanente exprés'),
      ('Viviana','Esmaltado normal completa'),
      ('Viviana','Esmaltado normal exprés'),
      ('Viviana','Manicura sin esmaltar'),
      ('Viviana','Solo cortar y limar en manos'),
      ('Viviana','Retirada de uñas acrílicas con torno'),
      ('Viviana','Retirada de uñas acrílicas solo acetona'),
      ('Viviana','Retirada de semipermanente con torno'),
      ('Viviana','Retirada de semipermanente con solo acetona'),
      ('Viviana','Decoración de uñas'),
      ('Viviana','Reconstrucción de uña/Uña rota'),
      ('Viviana','Pedicura completa con semipermanente'),
      ('Viviana','Pedicura exprés con semipermanente'),
      ('Viviana','Pedicura completa con esmaltado normal'),
      ('Viviana','Pedicura exprés con esmaltado normal'),
      ('Viviana','Pedicura completa sin esmaltar'),
      ('Viviana','Corte de uñas en los pies'),
      ('Viviana','Retirada de acrílico en los pies'),
      ('Viviana','Retirada de semipermanente en los pies'),
      ('Viviana','Reconstrucción de uña en los pies'),
      ('Viviana','Depilación de patillas con cera'),
      ('Viviana','Depilación de barbilla con cera'),
      ('Viviana','Depilación de labio superior con cera'),
      ('Viviana','Depilación de cejas con cera + Diseño + Tinte'),
      ('Viviana','Depilación de cejas con cera + Diseño'),
      ('Viviana','Depilación de cejas con cera (Solo limpieza)'),
      ('Viviana','Depilación de espalda con cera'),
      ('Viviana','Depilación de brazos con cera'),
      ('Viviana','Depilación de piernas con cera'),
      ('Viviana','Depilación de axilas con cera')
    ) AS t(profesional, nombre_buscado)
    WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = t.nombre_buscado)
    ORDER BY profesional, nombre_buscado
  LOOP
    RAISE NOTICE '  [%] %', rec.profesional, rec.nombre_buscado;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Listo. Revisa los avisos anteriores.';

END $$;
