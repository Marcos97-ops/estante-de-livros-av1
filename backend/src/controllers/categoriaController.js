/**
 * categoriaController — lista as categorias disponíveis para popular
 * o <select> do formulário no frontend.
 *
 * Express 5 encaminha automaticamente qualquer rejeição de uma função async
 * de rota para o errorHandler — por isso o handler não precisa de
 * try/catch + next(err).
 */
const categoriaModel = require('../models/categoriaModel');

async function listar(req, res) {
  const categorias = await categoriaModel.listarTodas();
  return res.status(200).json(categorias);
}

module.exports = { listar };
