/**
 * authValidator — regras de validação de cadastro e login.
 * Funções puras: devolvem a mensagem de erro ou `null` quando está tudo certo.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MINIMO_DA_SENHA = 6;

/** E-mail é comparado sem diferenciar maiúsculas e sem espaços nas pontas. */
function normalizarEmail(email) {
  return email.toLowerCase().trim();
}

function validarCadastro({ nome, email, senha }) {
  if (!nome || !email || !senha) {
    return 'Nome, e-mail e senha são obrigatórios.';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'E-mail inválido.';
  }
  if (senha.length < TAMANHO_MINIMO_DA_SENHA) {
    return `A senha precisa ter ao menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`;
  }
  return null;
}

function validarLogin({ email, senha }) {
  if (!email || !senha) {
    return 'E-mail e senha são obrigatórios.';
  }
  return null;
}

module.exports = { normalizarEmail, validarCadastro, validarLogin };
