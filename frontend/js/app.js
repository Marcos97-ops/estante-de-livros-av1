/**
 * Estante de Livros — app.js
 * Renderização e eventos de DOM. Os dados agora vêm da API (backend/src),
 * não mais de um array em memória — por isso a estante sobrevive a um F5.
 */

// ── Guarda de autenticação ──────────────────────────────────
if (!api.getToken()) {
  window.location.href = 'login.html';
}

// ── Estado ───────────────────────────────────────────────────
let livros = [];
let categorias = [];
let filtroStatusAtivo = 'todos';
let filtroCategoriaAtiva = 'todas';

// ── Referências ──────────────────────────────────────────────
const inputTitulo    = document.getElementById('input-titulo');
const inputAutor     = document.getElementById('input-autor');
const inputStatus    = document.getElementById('input-status');
const inputCategoria = document.getElementById('input-categoria');
const btnAdicionar   = document.getElementById('btn-adicionar');
const errorMsg       = document.getElementById('error-msg');
const booksGrid      = document.getElementById('books-grid');
const emptyState     = document.getElementById('empty-state');
const filterBtns     = document.querySelectorAll('.filter-btn');
const filterCategoria = document.getElementById('filter-categoria');

const countLido   = document.getElementById('count-lido');
const countLendo  = document.getElementById('count-lendo');
const countQuero  = document.getElementById('count-quero');

const saudacaoUsuario = document.getElementById('saudacao-usuario');
const btnSair = document.getElementById('btn-sair');

const cardTemplate = document.getElementById('card-template');

// ── Labels legíveis de status ─────────────────────────────────
const STATUS_LABEL = {
  'lido':      '✅ Lido',
  'lendo':     '🔖 Lendo',
  'quero-ler': '📖 Quero ler',
};

const STATUS_PADRAO = 'quero-ler';

// ── Sessão ───────────────────────────────────────────────────
function iniciarCabecalhoUsuario() {
  const usuario = api.getUsuario();
  saudacaoUsuario.textContent = usuario ? `Olá, ${usuario.nome}` : '';
}

btnSair.addEventListener('click', () => {
  api.limparSessao();
  window.location.href = 'login.html';
});

// ── Mensagens de erro ────────────────────────────────────────
const avisoDeErro = criarAvisoDeErro(errorMsg);

// ── Carregar categorias (form + filtro) ───────────────────────
async function carregarCategorias() {
  try {
    categorias = await api.get('/api/categorias');

    categorias.forEach(categoria => {
      const opcaoDoFormulario = document.createElement('option');
      opcaoDoFormulario.value = categoria.id;
      opcaoDoFormulario.textContent = categoria.nome;
      inputCategoria.appendChild(opcaoDoFormulario);

      const opcaoDoFiltro = document.createElement('option');
      opcaoDoFiltro.value = categoria.id;
      opcaoDoFiltro.textContent = categoria.nome;
      filterCategoria.appendChild(opcaoDoFiltro);
    });
  } catch (err) {
    // Sem esse aviso, os selects apenas ficariam vazios e o usuário não teria
    // como saber que faltou algo. Cadastrar sem categoria continua funcionando.
    console.error('Falha ao carregar categorias:', err);
    avisoDeErro.mostrar(
      'Não foi possível carregar as categorias. Você ainda pode cadastrar livros sem categoria.'
    );
  }
}

// ── Carregar livros do usuário logado ─────────────────────────
async function carregarLivros() {
  try {
    livros = await api.get('/api/livros');
    atualizarInterface();
  } catch (err) {
    avisoDeErro.mostrar(err.message);
  }
}

// ── Adicionar livro ──────────────────────────────────────────
function lerFormularioDeLivro() {
  return {
    titulo: inputTitulo.value.trim(),
    autor: inputAutor.value.trim(),
    status: inputStatus.value,
    categoriaId: inputCategoria.value || null,
  };
}

// Devolve a mensagem de erro, ou null se estiver tudo certo — mesmo contrato
// da validação do backend, e sem tocar no DOM.
function validarFormularioDeLivro({ titulo, autor }) {
  if (!titulo || !autor) {
    return 'Preencha o título e o autor antes de adicionar.';
  }
  return null;
}

function limparFormularioDeLivro() {
  inputTitulo.value = '';
  inputAutor.value  = '';
  inputStatus.value = STATUS_PADRAO;
  inputCategoria.value = '';
  inputTitulo.focus();
}

async function adicionarLivro() {
  const dadosDoLivro = lerFormularioDeLivro();

  const mensagemDeErro = validarFormularioDeLivro(dadosDoLivro);
  if (mensagemDeErro) {
    avisoDeErro.mostrar(mensagemDeErro);
    (dadosDoLivro.titulo ? inputAutor : inputTitulo).focus();
    return;
  }

  avisoDeErro.esconder();
  btnAdicionar.disabled = true;

  try {
    const livroCriado = await api.post('/api/livros', dadosDoLivro);
    livros.unshift(livroCriado);
    atualizarInterface();
    limparFormularioDeLivro();
  } catch (err) {
    avisoDeErro.mostrar(err.message);
  } finally {
    btnAdicionar.disabled = false;
  }
}

// ── Remover livro ────────────────────────────────────────────
async function removerLivro(id) {
  try {
    await api.delete(`/api/livros/${id}`);
    livros = livros.filter(livro => livro.id !== id);
    atualizarInterface();
  } catch (err) {
    avisoDeErro.mostrar(err.message);
  }
}

// ── Atualizar status pelo select do card ─────────────────────
async function atualizarStatus(id, novoStatus) {
  const livro = livros.find(candidato => candidato.id === id);
  if (!livro) return;

  try {
    const livroAtualizado = await api.put(`/api/livros/${id}`, {
      titulo: livro.titulo,
      autor: livro.autor,
      status: novoStatus,
      categoriaId: livro.categoria_id,
    });
    livros = livros.map(atual => (atual.id === id ? livroAtualizado : atual));
    atualizarInterface();
  } catch (err) {
    avisoDeErro.mostrar(err.message);
  }
}

// ── Criar card DOM a partir do template ──────────────────────
function criarCard(livro) {
  const cardClonado = cardTemplate.content.cloneNode(true);
  const cardDoLivro = cardClonado.querySelector('article');

  cardDoLivro.setAttribute('data-status', livro.status);
  cardDoLivro.querySelector('.card-title').textContent  = livro.titulo;
  cardDoLivro.querySelector('.card-author').textContent = `por ${livro.autor}`;
  cardDoLivro.querySelector('.card-categoria').textContent = livro.categoria_nome ? `📂 ${livro.categoria_nome}` : '';
  cardDoLivro.querySelector('.card-status-badge').textContent = STATUS_LABEL[livro.status];

  // Select de status
  const selectDeStatus = cardDoLivro.querySelector('.card-status-select');
  Object.entries(STATUS_LABEL).forEach(([valorDoStatus, rotulo]) => {
    const opcao = document.createElement('option');
    opcao.value = valorDoStatus;
    opcao.textContent = rotulo;
    if (valorDoStatus === livro.status) opcao.selected = true;
    selectDeStatus.appendChild(opcao);
  });

  selectDeStatus.addEventListener('change', () => atualizarStatus(livro.id, selectDeStatus.value));

  // Botão remover
  cardDoLivro.querySelector('.btn-remove').addEventListener('click', () => removerLivro(livro.id));

  return cardDoLivro;
}

// ── Renderizar lista filtrada ─────────────────────────────────
function renderizarLivros() {
  booksGrid.innerHTML = '';

  const livrosVisiveis = livros.filter(livro => {
    const passaStatus = filtroStatusAtivo === 'todos' || livro.status === filtroStatusAtivo;
    const passaCategoria = filtroCategoriaAtiva === 'todas' || String(livro.categoria_id) === filtroCategoriaAtiva;
    return passaStatus && passaCategoria;
  });

  if (livrosVisiveis.length === 0) {
    emptyState.classList.remove('hidden');
    booksGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  booksGrid.classList.remove('hidden');

  livrosVisiveis.forEach(livro => {
    booksGrid.appendChild(criarCard(livro));
  });
}

// ── Atualizar contadores no header ────────────────────────────
function atualizarContadores() {
  countLido.textContent  = livros.filter(livro => livro.status === 'lido').length;
  countLendo.textContent = livros.filter(livro => livro.status === 'lendo').length;
  countQuero.textContent = livros.filter(livro => livro.status === 'quero-ler').length;
}

// Redesenhar a lista e recontar são sempre a mesma operação: refletir o estado
// atual na tela. Mantê-las juntas evita que uma delas seja esquecida.
function atualizarInterface() {
  renderizarLivros();
  atualizarContadores();
}

// ── Filtros ──────────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroStatusAtivo = btn.dataset.filter;
    renderizarLivros();
  });
});

filterCategoria.addEventListener('change', () => {
  filtroCategoriaAtiva = filterCategoria.value;
  renderizarLivros();
});

// ── Event listeners ───────────────────────────────────────────
btnAdicionar.addEventListener('click', adicionarLivro);

// Permitir Enter para adicionar
[inputTitulo, inputAutor].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') adicionarLivro();
  });
});

// Esconder erro ao digitar
[inputTitulo, inputAutor].forEach(input => {
  input.addEventListener('input', () => avisoDeErro.esconder());
});

// ── Init ─────────────────────────────────────────────────────
iniciarCabecalhoUsuario();
carregarCategorias();
carregarLivros();
