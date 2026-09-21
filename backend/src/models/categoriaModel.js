/**
 * categoriaModel — acesso à tabela `categorias`.
 */
const pool = require('../config/db');

async function listarTodas() {
  const { rows } = await pool.query('SELECT id, nome FROM categorias ORDER BY nome ASC');
  return rows;
}

module.exports = { listarTodas };
