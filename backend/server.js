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
  await pool.query(`DO $$
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
  $$`);
  await pool.query(`CREATE TABLE IF NOT EXISTS membro_familia (
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
  )`);
  await pool.query(`ALTER TABLE membro_familia
    DROP COLUMN IF EXISTS papel_na_familia`);
  await pool.query(`ALTER TABLE membro_familia
    ALTER COLUMN parentesco TYPE grau_parentesco
    USING parentesco::grau_parentesco`);
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

app.get('/api/familias', async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        f.id,
        f.endereco,
        f.bairro,
        f.telefone,
        f.criado_em AS "criadoEm",
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'nomeCompleto', m.nome_completo,
              'dataNascimento', m.data_nascimento,
              'profissao', m.profissao,
              'parentesco', m.parentesco,
              'responsavelPrincipal', m.responsavel_principal,
              'probabilidadeVoto', m.probabilidade_voto,
              'telefone', m.telefone,
              'criadoEm', m.criado_em
            )
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) AS membros
      FROM familia f
      LEFT JOIN membro_familia m ON m.familia_id = f.id
      GROUP BY f.id
      ORDER BY f.criado_em DESC
    `);
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar famílias', erro);
    res.status(500).json({ success: false, message: 'Erro ao listar famílias' });
  }
});

app.post('/api/familias', async (req, res) => {
  const { endereco, bairro, telefone, membros } = req.body;

  if (!endereco || !bairro || !telefone) {
    return res.status(400).json({ success: false, message: 'Dados da família incompletos.' });
  }

  if (!Array.isArray(membros) || membros.length === 0) {
    return res.status(400).json({ success: false, message: 'Informe ao menos um membro da família.' });
  }

  const possuiResponsavel = membros.some(membro => membro && membro.responsavelPrincipal);
  if (!possuiResponsavel) {
    return res.status(400).json({ success: false, message: 'Defina um responsável principal para a família.' });
  }

  let cliente;

  try {
    cliente = await pool.connect();
  } catch (erro) {
    console.error('Erro ao conectar no banco', erro);
    return res.status(500).json({ success: false, message: 'Erro ao conectar ao banco de dados.' });
  }

  try {
    await cliente.query('BEGIN');
    const familiaCriada = await cliente.query(
      `INSERT INTO familia (endereco, bairro, telefone)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [endereco, bairro, telefone]
    );

    if (familiaCriada.rowCount !== 1) {
      await cliente.query('ROLLBACK');
      return res.status(500).json({ success: false, message: 'Não foi possível cadastrar a família.' });
    }

    const familiaId = familiaCriada.rows[0].id;

    for (const membro of membros) {
      if (!membro?.nomeCompleto || !membro?.parentesco || !membro?.probabilidadeVoto) {
        await cliente.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Dados do membro incompletos.' });
      }

      const responsavelPrincipal =
        typeof membro.responsavelPrincipal === 'string'
          ? membro.responsavelPrincipal.toLowerCase() === 'true'
          : Boolean(membro.responsavelPrincipal);

      const membroCriado = await cliente.query(
        `INSERT INTO membro_familia (
          familia_id,
          nome_completo,
          data_nascimento,
          profissao,
          parentesco,
          responsavel_principal,
          probabilidade_voto,
          telefone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          familiaId,
          membro.nomeCompleto,
          membro.dataNascimento || null,
          membro.profissao || null,
          membro.parentesco,
          responsavelPrincipal,
          membro.probabilidadeVoto,
          membro.telefone || null
        ]
      );

      if (membroCriado.rowCount !== 1) {
        await cliente.query('ROLLBACK');
        return res.status(500).json({ success: false, message: 'Erro ao cadastrar membro da família.' });
      }
    }

    await cliente.query('COMMIT');
    const familiaCompleta = await cliente.query(
      `SELECT
         f.id,
         f.endereco,
         f.bairro,
         f.telefone,
         f.criado_em AS "criadoEm",
         COALESCE(
           json_agg(
             json_build_object(
               'id', m.id,
               'nomeCompleto', m.nome_completo,
               'dataNascimento', m.data_nascimento,
               'profissao', m.profissao,
               'parentesco', m.parentesco,
               'responsavelPrincipal', m.responsavel_principal,
               'probabilidadeVoto', m.probabilidade_voto,
               'telefone', m.telefone,
               'criadoEm', m.criado_em
             )
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'::json
         ) AS membros
       FROM familia f
       LEFT JOIN membro_familia m ON m.familia_id = f.id
       WHERE f.id = $1
       GROUP BY f.id`,
      [familiaId]
    );

    res.status(201).json({ success: true, id: familiaId, familia: familiaCompleta.rows[0] });
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('Erro ao cadastrar família', erro);
    res.status(500).json({ success: false, message: 'Erro ao cadastrar família.' });
  } finally {
    cliente.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));
