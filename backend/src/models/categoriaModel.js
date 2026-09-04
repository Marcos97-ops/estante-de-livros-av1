/**
 * categoriaModel — acesso à tabela `categorias`.
 */
const pool = require('../config/db');

async function listarTodas() {
  const { rows } = await pool.query(
    'SELECT id, nome FROM categorias ORDER BY nome ASC'
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    'SELECT id, nome FROM categorias WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

module.exports = { listarTodas, buscarPorId };
