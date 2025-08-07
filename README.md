# Gestor Político

Projeto para gerenciar contatos e atividades políticas. Inicialmente está sendo criada a tela de login utilizando Angular no frontend e Node.js com Express e PostgreSQL no backend.

## Requisitos
- Node.js 18+
- PostgreSQL

## Banco de Dados
Criar um banco `gestor_politico` e a tabela `usuarios`:

```sql
CREATE DATABASE gestor_politico;
\c gestor_politico
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL
);
```

O usuário padrão do PostgreSQL deve possuir senha `admin`.

## Backend
1. Acesse a pasta `backend`.
2. Instale dependências e execute:
   ```bash
   npm install
   npm start
   ```

## Frontend
1. Acesse a pasta `frontend`.
2. Instale dependências e execute:
   ```bash
   npm install
   npm start
   ```

A aplicação frontend executará em `http://localhost:4200` e se comunicará com o backend em `http://localhost:3000`.
