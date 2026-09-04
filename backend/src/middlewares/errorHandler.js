/**
 * Middleware central de tratamento de erros.
 * Qualquer `next(err)` ou exceção em rota async (Express 5 encaminha
 * automaticamente) cai aqui, evitando vazar stack trace pro cliente.
 */
// 23503 = violação de chave estrangeira no Postgres. Na prática só acontece
// quando o livro aponta para uma categoria que não existe.
const VIOLACAO_DE_CHAVE_ESTRANGEIRA = '23503';

/**
 * Registra o erro com o contexto da requisição que o provocou.
 * Sem método, rota e horário, o stack trace sozinho não diz qual chamada falhou.
 */
function registrarErro(err, req, status) {
  const registro = {
    nivel: status >= 500 ? 'error' : 'warn',
    momento: new Date().toISOString(),
    metodo: req.method,
    rota: req.originalUrl,
    status,
    mensagem: err.message,
  };

  // Stack só interessa em erro de servidor; 4xx é falha esperada do cliente.
  if (status >= 500) {
    registro.stack = err.stack;
  }

  console.error(JSON.stringify(registro));
}

function errorHandler(err, req, res, _next) {
  const categoriaInexistente = err.code === VIOLACAO_DE_CHAVE_ESTRANGEIRA;
  const status = categoriaInexistente ? 400 : err.status || 500;

  let mensagem;
  if (categoriaInexistente) {
    mensagem = 'Categoria informada não existe.';
  } else {
    mensagem = status === 500 ? 'Erro interno do servidor.' : err.message;
  }

  registrarErro(err, req, status);

  res.status(status).json({ erro: mensagem });
}

module.exports = errorHandler;
