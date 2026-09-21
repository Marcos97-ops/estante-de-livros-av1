const {
  normalizarEmail,
  validarCadastro,
  validarLogin,
} = require('../../src/validators/authValidator');

describe('normalizarEmail', () => {
  test('coloca em minúsculas e remove espaços das pontas', () => {
    expect(normalizarEmail('  Leitor@Teste.COM  ')).toBe('leitor@teste.com');
  });
});

describe('validarCadastro', () => {
  test('aceita dados válidos', () => {
    expect(validarCadastro({ nome: 'Ana', email: 'ana@teste.com', senha: '123456' })).toBeNull();
  });

  test('rejeita quando falta um campo obrigatório', () => {
    expect(validarCadastro({ nome: '', email: 'ana@teste.com', senha: '123456' })).toBe(
      'Nome, e-mail e senha são obrigatórios.'
    );
  });

  test('rejeita e-mail sem formato válido', () => {
    expect(validarCadastro({ nome: 'Ana', email: 'ana-arroba-teste', senha: '123456' })).toBe(
      'E-mail inválido.'
    );
  });

  test('rejeita senha curta (caso extremo: 5 caracteres)', () => {
    const erro = validarCadastro({ nome: 'Ana', email: 'ana@teste.com', senha: '12345' });
    expect(erro).toBe('A senha precisa ter ao menos 6 caracteres.');
  });
});

describe('validarLogin', () => {
  test('aceita e-mail e senha presentes', () => {
    expect(validarLogin({ email: 'ana@teste.com', senha: '123456' })).toBeNull();
  });

  test('rejeita quando falta a senha', () => {
    expect(validarLogin({ email: 'ana@teste.com' })).toBe('E-mail e senha são obrigatórios.');
  });
});
