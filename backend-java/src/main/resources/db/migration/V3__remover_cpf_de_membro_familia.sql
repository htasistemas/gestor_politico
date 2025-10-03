-- Remove a coluna CPF da tabela membro_familia caso ainda exista
ALTER TABLE membro_familia
  DROP COLUMN IF EXISTS cpf;
