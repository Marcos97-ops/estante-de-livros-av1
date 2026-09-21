const errorHandler = require('../../src/middlewares/errorHandler');

function criarResposta() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function criarRequisicao() {
  return { method: 'GET', originalUrl: '/api/livros' };
}

describe('errorHandler', () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('erro de chave estrangeira (23503) vira 400 com mensagem de categoria', () => {
    const err = new Error('insert or update on table "livros" violates foreign key constraint');
    err.code = '23503';
    const res = criarResposta();

    errorHandler(err, criarRequisicao(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Categoria informada não existe.' });
  });

  test('erro com status explícito mantém a própria mensagem (ex.: 404 de rota)', () => {
    const err = new Error('Livro não encontrado.');
    err.status = 404;
    const res = criarResposta();

    errorHandler(err, criarRequisicao(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Livro não encontrado.' });
  });

  test('caso extremo: erro sem status vira 500 e não vaza a mensagem original', () => {
    const err = new Error('detalhe interno sensível de implementação');
    const res = criarResposta();

    errorHandler(err, criarRequisicao(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor.' });
  });

  test('loga 4xx em stdout (console.log) e não em console.error', () => {
    const err = new Error('Livro não encontrado.');
    err.status = 404;

    errorHandler(err, criarRequisicao(), criarResposta(), jest.fn());

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('loga 5xx em stderr (console.error) e não em console.log', () => {
    const err = new Error('falha inesperada');

    errorHandler(err, criarRequisicao(), criarResposta(), jest.fn());

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
