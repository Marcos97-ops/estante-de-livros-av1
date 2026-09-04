/**
 * livroController — CRUD de livros. A regra de dono (só o usuário que
 * criou o livro pode editar/remover) fica aqui, não no model.
 */
const livroModel = require('../models/livroModel');

const STATUS_VALIDOS = ['quero-ler', 'lendo', 'lido'];

function validarCampos({ titulo, autor, status }) {
  if (!titulo || !titulo.trim() || !autor || !autor.trim()) {
    return 'Título e autor são obrigatórios.';
  }
  if (status && !STATUS_VALIDOS.includes(status)) {
    return `Status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}.`;
  }
  return null;
}

async function listar(req, res, next) {
  try {
    const livros = await livroModel.listarPorUsuario(req.usuario.id);
    return res.status(200).json(livros);
  } catch (err) {
    return next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { titulo, autor, status, categoriaId } = req.body;

    const erro = validarCampos({ titulo, autor, status });
    if (erro) return res.status(400).json({ erro });

    const livro = await livroModel.criar({
      titulo: titulo.trim(),
      autor: autor.trim(),
      status: status || 'quero-ler',
      usuarioId: req.usuario.id,
      categoriaId: categoriaId || null,
    });

    return res.status(201).json(livro);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Categoria informada não existe.' });
    }
    return next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { titulo, autor, status, categoriaId } = req.body;

    const erro = validarCampos({ titulo, autor, status });
    if (erro) return res.status(400).json({ erro });

    const livroAtual = await livroModel.buscarPorId(id);
    if (!livroAtual) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }
    if (livroAtual.usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para alterar este livro.' });
    }

    const livroAtualizado = await livroModel.atualizar(id, {
      titulo: titulo.trim(),
      autor: autor.trim(),
      status: status || livroAtual.status,
      categoriaId: categoriaId !== undefined ? categoriaId : livroAtual.categoria_id,
    });

    return res.status(200).json(livroAtualizado);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Categoria informada não existe.' });
    }
    return next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;

    const livroAtual = await livroModel.buscarPorId(id);
    if (!livroAtual) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }
    if (livroAtual.usuario_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para remover este livro.' });
    }

    await livroModel.remover(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, criar, atualizar, remover };
