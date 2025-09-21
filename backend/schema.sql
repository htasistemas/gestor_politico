CREATE TABLE IF NOT EXISTS login (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL
);

INSERT INTO login (usuario, senha, nome)
VALUES ('admin@plataforma.gov', '123456', 'Administrador')
ON CONFLICT (usuario) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grau_parentesco') THEN
    CREATE TYPE grau_parentesco AS ENUM (
      'Pai',
      'Mãe',
      'Filho(a)',
      'Filha',
      'Filho',
      'Irmão(ã)',
      'Primo(a)',
      'Tio(a)',
      'Sobrinho(a)',
      'Cônjuge',
      'Avô(ó)',
      'Enteado(a)',
      'Outro'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS familia (
  id SERIAL PRIMARY KEY,
  endereco VARCHAR(255) NOT NULL,
  bairro VARCHAR(120) NOT NULL,
  telefone VARCHAR(30) NOT NULL,
  criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membro_familia (
  id SERIAL PRIMARY KEY,
  familia_id INTEGER NOT NULL REFERENCES familia(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  profissao VARCHAR(255),
  parentesco grau_parentesco NOT NULL,
  responsavel_principal BOOLEAN DEFAULT FALSE,
  probabilidade_voto VARCHAR(20) NOT NULL,
  telefone VARCHAR(30),
  criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE membro_familia
DROP COLUMN IF EXISTS papel_na_familia;

ALTER TABLE membro_familia
ALTER COLUMN parentesco TYPE grau_parentesco
USING parentesco::grau_parentesco;

CREATE UNIQUE INDEX IF NOT EXISTS idx_membro_familia_principal
ON membro_familia (familia_id)
WHERE responsavel_principal;
