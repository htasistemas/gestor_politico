CREATE TABLE IF NOT EXISTS login (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL
);

INSERT INTO login (usuario, senha, nome)
VALUES ('admin@plataforma.gov', '123456', 'Administrador')
ON CONFLICT (usuario) DO NOTHING;
