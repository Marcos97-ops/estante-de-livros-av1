/**
 * livroController — CRUD de livros. A regra de dono (só o usuário que
 * criou o livro pode editar/remover) fica aqui, não no model.
 *
 * Recebe o model por parâmetro (injeção de dependência): o controller
 * depende da abstração "um model de livro com buscarPorId/criar/..." e não
 * do módulo concreto em Postgres, o que permite testar a orquestração HTTP
 * com um model fake.
 *
 * Express 5 encaminha automaticamente qualquer rejeição de uma função async
 * de rota para o errorHandler — por isso os handlers não precisam de
 * try/catch + next(err) em cada um.
 */
const livroModelPadrao = require('../models/livroModel');
const { validarDadosDoLivro, STATUS_PADRAO } = require('../validators/livroValidator');

function erroDeRequisicao(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function criarLivroController({ livroModel } = { livroModel: livroModelPadrao }) {
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

  async function listar(req, res) {
    const livros = await livroModel.listarPorUsuario(req.usuario.id);
    return res.status(200).json(livros);
  }

  async function criar(req, res) {
    const { titulo, autor, status, categoriaId } = req.body;

    const mensagemDeErro = validarDadosDoLivro({ titulo, autor, status });
    if (mensagemDeErro) return res.status(400).json({ erro: mensagemDeErro });

    const livro = await livroModel.criar({
      titulo: titulo.trim(),
      autor: autor.trim(),
      status: status || STATUS_PADRAO,
      usuarioId: req.usuario.id,
      categoriaId: categoriaId || null,
    });

    return res.status(201).json(livro);
  }

  async function atualizar(req, res) {
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
  }

  async function remover(req, res) {
    const { id } = req.params;

    await buscarLivroDoUsuario(id, req.usuario.id);

    await livroModel.remover(id);
    return res.status(204).send();
  }

  return { listar, criar, atualizar, remover };
}

module.exports = { criarLivroController, ...criarLivroController() };
