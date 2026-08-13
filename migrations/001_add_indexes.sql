-- Migración 001: índices para las consultas más frecuentes.
--
-- NO destructiva: solo agrega índices, no toca datos ni columnas.
-- Hay que correrla A MANO contra la base de Aiven (este sandbox no tiene
-- acceso a la base de producción, así que nunca se ejecutó acá).
--
-- Es idempotente: cada bloque chequea si el índice ya existe antes de
-- crearlo (MySQL no soporta `CREATE INDEX IF NOT EXISTS` en todas las
-- versiones), así que correr este archivo dos veces no rompe nada.
--
-- Por qué hace falta: sincronizarDrive() y repararFechas() ahora hacen
--   SELECT ... FROM predicas WHERE drive_id IN (...)
-- en vez del SELECT-por-archivo de antes. Sin un índice en `drive_id`,
-- esa consulta sigue siendo un table scan completo cada vez — el índice
-- es lo que la vuelve realmente rápida a medida que crece la tabla.

-- 1) predicas.drive_id — buscado en cada sync (WHERE drive_id IN (...))
SET @idx_exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'predicas' AND index_name = 'idx_predicas_drive_id'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_predicas_drive_id ON predicas (drive_id)',
  'SELECT "idx_predicas_drive_id ya existe" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) predicas.fecha — usado en ORDER BY fecha DESC (listado principal) y
--    GROUP BY YEAR(fecha) (stats)
SET @idx_exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'predicas' AND index_name = 'idx_predicas_fecha'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_predicas_fecha ON predicas (fecha)',
  'SELECT "idx_predicas_fecha ya existe" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) suscripciones_push.endpoint — buscado en cada POST /api/subscribe
--    antes de insertar, para no duplicar suscripciones.
--    endpoint es TEXT/BLOB en esta base, así que MySQL exige un largo de
--    prefijo explícito para indexarla (no puede indexar el TEXT completo).
--    255 alcanza de sobra: los endpoints de push son URLs
--    (https://fcm.googleapis.com/..., https://updates.push.services.mozilla.com/...)
--    que ya difieren bien antes del carácter 255.
SET @idx_exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'suscripciones_push' AND index_name = 'idx_suscripciones_endpoint'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_suscripciones_endpoint ON suscripciones_push (endpoint(255))',
  'SELECT "idx_suscripciones_endpoint ya existe" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================================
-- OPCIONAL — solo si confirmás que no hay duplicados hoy en producción.
-- Un índice UNIQUE en vez de uno normal cierra, a nivel de base de datos,
-- la carrera donde dos requests simultáneos a /api/subscribe (o dos syncs
-- concurrentes) podrían insertar dos filas para el mismo drive_id /
-- endpoint. La app ya se comporta bien sin esto (por eso no se aplica
-- automáticamente), pero es la protección más sólida contra esa carrera.
--
-- Antes de correr esto, verificá que no haya duplicados:
--
--   SELECT drive_id, COUNT(*) FROM predicas GROUP BY drive_id HAVING COUNT(*) > 1;
--   SELECT endpoint, COUNT(*) FROM suscripciones_push GROUP BY endpoint HAVING COUNT(*) > 1;
--
-- Si ambas consultas no devuelven filas, es seguro correr:
--
--   ALTER TABLE predicas ADD UNIQUE INDEX uq_predicas_drive_id (drive_id);
--   ALTER TABLE suscripciones_push ADD UNIQUE INDEX uq_suscripciones_endpoint (endpoint(255));
--
-- Ojo: un UNIQUE con prefijo (255) no garantiza unicidad al 100% si dos
-- endpoints distintos comparten los primeros 255 caracteres (en la
-- práctica no pasa con URLs de push, pero no es una garantía matemática
-- como sí lo sería un UNIQUE sobre la columna completa).
-- =====================================================================
