-- Script de criação das tabelas principais para o módulo de pessoas

CREATE TABLE IF NOT EXISTS cidades (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  uf CHAR(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS regioes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cidade_id BIGINT NOT NULL REFERENCES cidades (id) ON DELETE CASCADE,
  UNIQUE (cidade_id, nome)
);

CREATE TABLE IF NOT EXISTS bairros (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  regiao VARCHAR(120),
  cidade_id BIGINT NOT NULL REFERENCES cidades (id) ON DELETE CASCADE,
  nome_normalizado VARCHAR(160) NOT NULL,
  UNIQUE (cidade_id, nome_normalizado)
);

CREATE TABLE IF NOT EXISTS enderecos (
  id BIGSERIAL PRIMARY KEY,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(30) NOT NULL,
  cep VARCHAR(9),
  bairro_id BIGINT REFERENCES bairros (id),
  cidade_id BIGINT NOT NULL REFERENCES cidades (id) ON DELETE RESTRICT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7)
);

CREATE TABLE IF NOT EXISTS familia (
  id BIGSERIAL PRIMARY KEY,
  endereco VARCHAR(255) NOT NULL,
  bairro VARCHAR(120) NOT NULL,
  telefone VARCHAR(30) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membro_familia (
  id BIGSERIAL PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  data_nascimento DATE,
  profissao VARCHAR(255),
  parentesco VARCHAR(255) NOT NULL,
  responsavel_principal BOOLEAN NOT NULL DEFAULT FALSE,
  probabilidade_voto VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  familia_id BIGINT NOT NULL REFERENCES familia (id) ON DELETE CASCADE,
  endereco_id BIGINT NOT NULL REFERENCES enderecos (id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
