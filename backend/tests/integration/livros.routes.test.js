/**
 * Teste de integração: fluxo completo de /api/livros contra Postgres real,
 * incluindo autorização (dono do livro) e violação de chave estrangeira.
 */
const request = require('supertest');
const app = require('../../src/app');
const { resetarBanco, encerrarConexao } = require('../helpers/db');

let tokenLeitor;
let tokenOutroUsuario;
let idLivroCriado;

beforeAll(async () => {
  await resetarBanco();

  const loginLeitor = await request(app)
    .post('/api/auth/login')
    .send({ email: 'leitor@teste.com', senha: 'leitor123' });
  tokenLeitor = loginLeitor.body.token;

  const cadastroOutro = await request(app)
    .post('/api/auth/register')
    .send({ nome: 'Outro Usuário', email: 'outro@teste.com', senha: 'senha123' });
  tokenOutroUsuario = cadastroOutro.body.token;
});

afterAll(async () => {
  await encerrarConexao();
});

test('GET /api/health responde ok', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});

test('rota inexistente devolve 404', async () => {
  const res = await request(app).get('/api/rota-que-nao-existe');
  expect(res.status).toBe(404);
});

test('GET /api/categorias lista as categorias do seed', async () => {
  const res = await request(app).get('/api/categorias');
  expect(res.status).toBe(200);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty('nome');
});

describe('/api/livros sem autenticação', () => {
  test('devolve 401', async () => {
    const res = await request(app).get('/api/livros');
    expect(res.status).toBe(401);
  });
});

describe('fluxo completo de um livro', () => {
  test('POST cria o livro do usuário autenticado', async () => {
    const res = await request(app)
      .post('/api/livros')
      .set('Authorization', `Bearer ${tokenLeitor}`)
      .send({ titulo: '  O Alienista  ', autor: '  Machado de Assis  ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      titulo: 'O Alienista',
      autor: 'Machado de Assis',
      status: 'quero-ler',
    });
    idLivroCriado = res.body.id;
  });

  test('GET lista inclui o livro recém-criado', async () => {
    const res = await request(app).get('/api/livros').set('Authorization', `Bearer ${tokenLeitor}`);

    expect(res.status).toBe(200);
    expect(res.body.some((livro) => livro.id === idLivroCriado)).toBe(true);
  });

  test('PUT atualiza o livro', async () => {
    const res = await request(app)
      .put(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenLeitor}`)
      .send({ titulo: 'O Alienista', autor: 'Machado de Assis', status: 'lendo' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('lendo');
  });

  test('caso extremo: categoria inexistente devolve 400 (violação de chave estrangeira real)', async () => {
    const res = await request(app)
      .put(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenLeitor}`)
      .send({ titulo: 'O Alienista', autor: 'Machado de Assis', categoriaId: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Categoria informada não existe.');
  });

  test('caso extremo: outro usuário não pode alterar o livro (403)', async () => {
    const res = await request(app)
      .put(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenOutroUsuario}`)
      .send({ titulo: 'Tentativa', autor: 'Invasor' });

    expect(res.status).toBe(403);
  });

  test('caso extremo: outro usuário não pode remover o livro (403)', async () => {
    const res = await request(app)
      .delete(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenOutroUsuario}`);

    expect(res.status).toBe(403);
  });

  test('DELETE remove o livro do dono', async () => {
    const res = await request(app)
      .delete(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenLeitor}`);

    expect(res.status).toBe(204);
  });

  test('DELETE de um livro já removido devolve 404', async () => {
    const res = await request(app)
      .delete(`/api/livros/${idLivroCriado}`)
      .set('Authorization', `Bearer ${tokenLeitor}`);

    expect(res.status).toBe(404);
  });
});
