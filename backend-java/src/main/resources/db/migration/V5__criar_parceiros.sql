CREATE TABLE parceiro (
  id BIGSERIAL PRIMARY KEY,
  membro_id BIGINT NOT NULL UNIQUE REFERENCES membro_familia (id) ON DELETE RESTRICT,
  token VARCHAR(64) NOT NULL UNIQUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE familia
  ADD COLUMN parceiro_cadastro_id BIGINT;

ALTER TABLE familia
  ADD CONSTRAINT fk_familia_parceiro
  FOREIGN KEY (parceiro_cadastro_id)
  REFERENCES parceiro (id);

CREATE INDEX idx_familia_parceiro_cadastro
  ON familia (parceiro_cadastro_id);
