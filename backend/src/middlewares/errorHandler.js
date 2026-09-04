/**
 * Middleware central de tratamento de erros.
 * Qualquer `next(err)` ou exceção em rota async (Express 5 encaminha
 * automaticamente) cai aqui, evitando vazar stack trace pro cliente.
 */
// 23503 = violação de chave estrangeira no Postgres. Na prática só acontece
// quando o livro aponta para uma categoria que não existe.
const VIOLACAO_DE_CHAVE_ESTRANGEIRA = '23503';

function errorHandler(err, req, res, _next) {
  console.error(err);

  const categoriaInexistente = err.code === VIOLACAO_DE_CHAVE_ESTRANGEIRA;
  const status = categoriaInexistente ? 400 : err.status || 500;

  let mensagem;
  if (categoriaInexistente) {
    mensagem = 'Categoria informada não existe.';
  } else {
    mensagem = status === 500 ? 'Erro interno do servidor.' : err.message;
  }

  res.status(status).json({ erro: mensagem });
}

module.exports = errorHandler;
