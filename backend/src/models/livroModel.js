/**
 * livroModel — acesso à tabela `livros`.
 * Todas as queries são parametrizadas ($1, $2, ...) — nunca concatenar
 * valores vindos do cliente diretamente na string SQL.
 */
const pool = require('../config/db');

const SELECT_BASE = `
  SELECT
    l.id, l.titulo, l.autor, l.status, l.usuario_id, l.criado_em,
    l.categoria_id,
    c.nome AS categoria_nome
  FROM livros l
  LEFT JOIN categorias c ON c.id = l.categoria_id
`;

async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `${SELECT_BASE} WHERE l.usuario_id = $1 ORDER BY l.criado_em DESC`,
    [usuarioId]
  );
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE l.id = $1`, [id]);
  return rows[0] || null;
}

async function criar({ titulo, autor, status, usuarioId, categoriaId }) {
  const { rows } = await pool.query(
    `INSERT INTO livros (titulo, autor, status, usuario_id, categoria_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [titulo, autor, status, usuarioId, categoriaId || null]
  );
  return buscarPorId(rows[0].id);
}

async function atualizar(id, { titulo, autor, status, categoriaId }) {
  await pool.query(
    `UPDATE livros
     SET titulo = $1, autor = $2, status = $3, categoria_id = $4
     WHERE id = $5`,
    [titulo, autor, status, categoriaId || null, id]
  );
  return buscarPorId(id);
}

async function remover(id) {
  await pool.query('DELETE FROM livros WHERE id = $1', [id]);
}

module.exports = { listarPorUsuario, buscarPorId, criar, atualizar, remover };
