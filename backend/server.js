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
