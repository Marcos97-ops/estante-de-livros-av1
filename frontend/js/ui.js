/**
 * ui.js — helpers de interface usados por mais de uma tela.
 * Precisa ser carregado antes de app.js e auth.js.
 */

/**
 * Liga as funções de aviso a um elemento de mensagem específico.
 * Cada tela tem o seu (#error-msg na estante, #erro-msg no login), mas o
 * comportamento é idêntico — por isso mora aqui, e não copiado nos dois.
 */
function criarAvisoDeErro(elemento) {
  return {
    mostrar(mensagem) {
      elemento.textContent = `⚠️ ${mensagem}`;
      elemento.classList.remove('hidden');
    },
    esconder() {
      elemento.classList.add('hidden');
    },
  };
}
