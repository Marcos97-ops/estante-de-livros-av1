/**
 * livroController — CRUD de livros. A regra de dono (só o usuário que
 * criou o livro pode editar/remover) fica aqui, não no model.
 */
const livroModel = require('../models/livroModel');

const STATUS_VALIDOS = ['quero-ler', 'lendo', 'lido'];

function validarDadosDoLivro({ titulo, autor, status }) {
  if (!titulo || !titulo.trim() || !autor || !autor.trim()) {
    return 'Título e autor são obrigatórios.';
  }
  if (status && !STATUS_VALIDOS.includes(status)) {
    return `Status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}.`;
  }
  return null;
}

function erroDeRequisicao(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

/**
 * Busca o livro garantindo que ele pertence ao usuário logado.
 * Lança 404 se não existe e 403 se é de outro usuário — a regra de posse
 * fica em um lugar só, para não divergir entre os endpoints que a usam.
 *
 * Não recebe o verbo da ação de propósito: uma função de acesso a dados não
 * deveria decidir a redação da mensagem exibida ao usuário.
 */
async function buscarLivroDoUsuario(id, usuarioId) {
  const livro = await livroModel.buscarPorId(id);

  if (!livro) {
    throw erroDeRequisicao(404, 'Livro não encontrado.');
  }
  if (livro.usuario_id !== usuarioId) {
    throw erroDeRequisicao(403, 'Você não tem permissão para acessar este livro.');
  }

  return livro;
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

    const mensagemDeErro = validarDadosDoLivro({ titulo, autor, status });
    if (mensagemDeErro) return res.status(400).json({ erro: mensagemDeErro });

    const livro = await livroModel.criar({
      titulo: titulo.trim(),
      autor: autor.trim(),
      status: status || 'quero-ler',
      usuarioId: req.usuario.id,
      categoriaId: categoriaId || null,
    });

    return res.status(201).json(livro);
  } catch (err) {
    return next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { titulo, autor, status, categoriaId } = req.body;

    const mensagemDeErro = validarDadosDoLivro({ titulo, autor, status });
    if (mensagemDeErro) return res.status(400).json({ erro: mensagemDeErro });

    const livroAtual = await buscarLivroDoUsuario(id, req.usuario.id);

    const livroAtualizado = await livroModel.atualizar(id, {
      titulo: titulo.trim(),
      autor: autor.trim(),
      status: status || livroAtual.status,
      categoriaId: categoriaId !== undefined ? categoriaId : livroAtual.categoria_id,
    });

    return res.status(200).json(livroAtualizado);
  } catch (err) {
    return next(err);
  }
}

async function remover(req, res, next) {
  try {
    const { id } = req.params;

    await buscarLivroDoUsuario(id, req.usuario.id);

    await livroModel.remover(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, criar, atualizar, remover };
