const {
  validarDadosDoLivro,
  STATUS_VALIDOS,
  STATUS_PADRAO,
} = require('../../src/validators/livroValidator');

describe('validarDadosDoLivro', () => {
  test('aceita dados válidos com status', () => {
    const erro = validarDadosDoLivro({
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      status: 'lido',
    });
    expect(erro).toBeNull();
  });

  test('aceita dados válidos sem status (usa o padrão depois, fora do validador)', () => {
    const erro = validarDadosDoLivro({ titulo: 'Dom Casmurro', autor: 'Machado de Assis' });
    expect(erro).toBeNull();
  });

  test('rejeita título vazio', () => {
    const erro = validarDadosDoLivro({ titulo: '', autor: 'Machado de Assis' });
    expect(erro).toBe('Título e autor são obrigatórios.');
  });

  test('rejeita título só com espaços (caso extremo)', () => {
    const erro = validarDadosDoLivro({ titulo: '   ', autor: 'Machado de Assis' });
    expect(erro).toBe('Título e autor são obrigatórios.');
  });

  test('rejeita autor ausente', () => {
    const erro = validarDadosDoLivro({ titulo: 'Dom Casmurro' });
    expect(erro).toBe('Título e autor são obrigatórios.');
  });

  test('rejeita status fora da lista permitida', () => {
    const erro = validarDadosDoLivro({
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      status: 'lendo-de-novo',
    });
    expect(erro).toContain('Status inválido');
    STATUS_VALIDOS.forEach((status) => expect(erro).toContain(status));
  });

  test('STATUS_PADRAO é um dos status válidos', () => {
    expect(STATUS_VALIDOS).toContain(STATUS_PADRAO);
  });
});
