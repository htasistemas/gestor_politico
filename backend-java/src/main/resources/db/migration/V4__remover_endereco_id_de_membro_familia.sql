-- Remove a coluna endereco_id da tabela membro_familia caso ainda exista
ALTER TABLE membro_familia
  DROP COLUMN IF EXISTS endereco_id;
