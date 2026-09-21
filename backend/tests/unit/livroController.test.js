/**
 * Testes unitários do livroController: nada de banco real aqui.
 * O model é um fake injetado (Inversão de Dependência) — o controller só
 * conhece a abstração "listarPorUsuario/criar/buscarPorId/atualizar/remover".
 */
const { criarLivroController } = require('../../src/controllers/livroController');

function criarLivroModelFake(overrides = {}) {
  return {
    listarPorUsuario: jest.fn().mockResolvedValue([]),
    buscarPorId: jest.fn().mockResolvedValue(null),
    criar: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function criarResposta() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('livroController.criar', () => {
  test('caminho feliz: cria com status padrão quando não informado', async () => {
    const livroCriado = {
      id: 1,
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      status: 'quero-ler',
    };
    const livroModel = criarLivroModelFake({ criar: jest.fn().mockResolvedValue(livroCriado) });
    const controller = criarLivroController({ livroModel });

    const req = {
      body: { titulo: '  Dom Casmurro  ', autor: '  Machado de Assis  ' },
      usuario: { id: 7 },
    };
    const res = criarResposta();

    await controller.criar(req, res);

    expect(livroModel.criar).toHaveBeenCalledWith({
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      status: 'quero-ler',
      usuarioId: 7,
      categoriaId: null,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(livroCriado);
  });

  test('caso extremo: retorna 400 e não chama o model quando faltam dados', async () => {
    const livroModel = criarLivroModelFake();
    const controller = criarLivroController({ livroModel });

    const req = { body: { titulo: '', autor: '' }, usuario: { id: 7 } };
    const res = criarResposta();

    await controller.criar(req, res);

    expect(livroModel.criar).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('livroController.atualizar', () => {
  test('propaga 404 quando o livro não existe', async () => {
    const livroModel = criarLivroModelFake({ buscarPorId: jest.fn().mockResolvedValue(null) });
    const controller = criarLivroController({ livroModel });

    const req = { params: { id: 99 }, body: { titulo: 'X', autor: 'Y' }, usuario: { id: 1 } };

    await expect(controller.atualizar(req, criarResposta())).rejects.toMatchObject({
      status: 404,
      message: 'Livro não encontrado.',
    });
  });

  test('propaga 403 quando o livro é de outro usuário', async () => {
    const livroModel = criarLivroModelFake({
      buscarPorId: jest.fn().mockResolvedValue({ id: 5, usuario_id: 2, status: 'lido' }),
    });
    const controller = criarLivroController({ livroModel });

    const req = { params: { id: 5 }, body: { titulo: 'X', autor: 'Y' }, usuario: { id: 1 } };

    await expect(controller.atualizar(req, criarResposta())).rejects.toMatchObject({ status: 403 });
    expect(livroModel.atualizar).not.toHaveBeenCalled();
  });
});

describe('livroController.remover', () => {
  test('caminho feliz: responde 204 após remover', async () => {
    const livroModel = criarLivroModelFake({
      buscarPorId: jest.fn().mockResolvedValue({ id: 5, usuario_id: 1 }),
    });
    const controller = criarLivroController({ livroModel });

    const req = { params: { id: 5 }, usuario: { id: 1 } };
    const res = criarResposta();

    await controller.remover(req, res);

    expect(livroModel.remover).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
