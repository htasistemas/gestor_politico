import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gestor_politico',
  password: 'admin',
  port: 5432
});

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS login (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL
  )`);
  await pool.query(
    `INSERT INTO login (usuario, senha, nome)
     VALUES ($1, $2, $3)
     ON CONFLICT (usuario) DO NOTHING`,
    ['admin@plataforma.gov', '123456', 'Administrador']
  );
  await pool.query(`CREATE TABLE IF NOT EXISTS familia (
    id SERIAL PRIMARY KEY,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(120) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS membro_familia (
    id SERIAL PRIMARY KEY,
    familia_id INTEGER NOT NULL REFERENCES familia(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    profissao VARCHAR(255),
    parentesco VARCHAR(120) NOT NULL,
    papel_na_familia VARCHAR(50) NOT NULL,
    responsavel_principal BOOLEAN DEFAULT FALSE,
    probabilidade_voto VARCHAR(20) NOT NULL,
    telefone VARCHAR(30),
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_membro_familia_principal
    ON membro_familia (familia_id)
    WHERE responsavel_principal`);
}

init().catch(err => console.error('Erro ao inicializar o banco', err));

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, usuario, nome FROM login WHERE usuario=$1 AND senha=$2',
      [usuario, senha]
    );
    if (result.rows.length === 1) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));
