/**
 * livroValidator — regras de validação dos dados de um livro.
 * Funções puras: não conhecem req/res nem banco. Devolvem a mensagem de erro
 * a ser exibida ou `null` quando os dados são válidos.
 */
const STATUS_VALIDOS = ['quero-ler', 'lendo', 'lido'];
const STATUS_PADRAO = 'quero-ler';

function textoPreenchido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function validarDadosDoLivro({ titulo, autor, status }) {
  if (!textoPreenchido(titulo) || !textoPreenchido(autor)) {
    return 'Título e autor são obrigatórios.';
  }
  if (status && !STATUS_VALIDOS.includes(status)) {
    return `Status inválido. Use um de: ${STATUS_VALIDOS.join(', ')}.`;
  }
  return null;
}

module.exports = { validarDadosDoLivro, STATUS_VALIDOS, STATUS_PADRAO };
