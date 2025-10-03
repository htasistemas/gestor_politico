-- Ajusta a coluna de parentesco para armazenar o valor textual do enum Java
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'membro_familia'
      AND column_name = 'parentesco'
      AND udt_name = 'grau_parentesco'
  ) THEN
    ALTER TABLE membro_familia
      ALTER COLUMN parentesco TYPE VARCHAR(50)
      USING parentesco::TEXT;

    DROP TYPE IF EXISTS grau_parentesco;
  END IF;
END $$;
