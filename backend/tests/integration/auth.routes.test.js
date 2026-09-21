/**
 * Teste de integração: rota completa /api/auth, ponta a ponta, contra um
 * Postgres real (schema + seed aplicados pelo helper antes de cada suíte).
 */
const request = require('supertest');
const app = require('../../src/app');
const { resetarBanco, encerrarConexao } = require('../helpers/db');

beforeAll(async () => {
  await resetarBanco();
});

afterAll(async () => {
  await encerrarConexao();
});

describe('POST /api/auth/register', () => {
  test('caminho feliz: cadastra e devolve token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Nova Leitora', email: 'nova.leitora@teste.com', senha: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toMatchObject({
      nome: 'Nova Leitora',
      email: 'nova.leitora@teste.com',
    });
  });

  test('caso extremo: e-mail já cadastrado devolve 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Duplicado', email: 'leitor@teste.com', senha: 'senha123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('caminho feliz: usuário do seed consegue logar', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'leitor@teste.com', senha: 'leitor123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('caso extremo: senha errada devolve 401 com a mensagem real', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'leitor@teste.com', senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('E-mail ou senha inválidos.');
  });
});
