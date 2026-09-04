/**
 * Middleware central de tratamento de erros.
 * Qualquer `next(err)` ou exceção em rota async (Express 5 encaminha
 * automaticamente) cai aqui, evitando vazar stack trace pro cliente.
 */
function errorHandler(err, req, res, _next) {
  console.error(err);

  const status = err.status || 500;
  const mensagem = status === 500 ? 'Erro interno do servidor.' : err.message;

  res.status(status).json({ erro: mensagem });
}

module.exports = errorHandler;
