const jwt = require('jsonwebtoken');
const autenticar = require('../../src/middlewares/auth');

function criarResposta() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middleware autenticar', () => {
  test('rejeita quando não há header Authorization', () => {
    const req = { headers: {} };
    const res = criarResposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Token não informado.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejeita token inválido', () => {
    const req = { headers: { authorization: 'Bearer token-invalido' } };
    const res = criarResposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Token inválido.' });
  });

  test('caso extremo: token expirado tem mensagem específica de sessão', () => {
    const tokenExpirado = jwt.sign({ id: 1, nome: 'Ana' }, process.env.JWT_SECRET, {
      expiresIn: -1,
    });
    const req = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res = criarResposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Sessão expirada. Faça login novamente.' });
  });

  test('caminho feliz: token válido popula req.usuario e chama next', () => {
    const token = jwt.sign({ id: 42, nome: 'Ana' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = criarResposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario).toEqual({ id: 42, nome: 'Ana' });
  });
});
