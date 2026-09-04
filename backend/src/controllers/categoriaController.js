/**
 * categoriaController — lista as categorias disponíveis para popular
 * o <select> do formulário no frontend.
 */
const categoriaModel = require('../models/categoriaModel');

async function listar(req, res, next) {
  try {
    const categorias = await categoriaModel.listarTodas();
    return res.status(200).json(categorias);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar };
