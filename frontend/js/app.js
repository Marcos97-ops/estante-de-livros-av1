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
function mostrarErro(mensagem) {
  errorMsg.textContent = `⚠️ ${mensagem}`;
  errorMsg.classList.remove('hidden');
}

function esconderErro() {
  errorMsg.classList.add('hidden');
}

// ── Carregar categorias (form + filtro) ───────────────────────
async function carregarCategorias() {
  try {
    categorias = await api.get('/api/categorias');

    categorias.forEach(cat => {
      const optForm = document.createElement('option');
      optForm.value = cat.id;
      optForm.textContent = cat.nome;
      inputCategoria.appendChild(optForm);

      const optFiltro = document.createElement('option');
      optFiltro.value = cat.id;
      optFiltro.textContent = cat.nome;
      filterCategoria.appendChild(optFiltro);
    });
  } catch (err) {
    console.error('Falha ao carregar categorias:', err.message);
  }
}

// ── Carregar livros do usuário logado ─────────────────────────
async function carregarLivros() {
  try {
    livros = await api.get('/api/livros');
    renderizarLivros();
    atualizarContadores();
  } catch (err) {
    mostrarErro(err.message);
  }
}

// ── Adicionar livro ──────────────────────────────────────────
async function adicionarLivro() {
  const titulo = inputTitulo.value.trim();
  const autor  = inputAutor.value.trim();
  const status = inputStatus.value;
  const categoriaId = inputCategoria.value || null;

  // Validação: campos obrigatórios
  if (!titulo || !autor) {
    mostrarErro('Preencha o título e o autor antes de adicionar.');
    (titulo ? inputAutor : inputTitulo).focus();
    return;
  }

  esconderErro();
  btnAdicionar.disabled = true;

  try {
    const novoLivro = await api.post('/api/livros', { titulo, autor, status, categoriaId });
    livros.unshift(novoLivro);
    renderizarLivros();
    atualizarContadores();

    // Limpar formulário
    inputTitulo.value = '';
    inputAutor.value  = '';
    inputStatus.value = 'quero-ler';
    inputCategoria.value = '';
    inputTitulo.focus();
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    btnAdicionar.disabled = false;
  }
}

// ── Remover livro ────────────────────────────────────────────
async function removerLivro(id) {
  try {
    await api.delete(`/api/livros/${id}`);
    livros = livros.filter(l => l.id !== id);
    renderizarLivros();
    atualizarContadores();
  } catch (err) {
    mostrarErro(err.message);
  }
}

// ── Atualizar status pelo select do card ─────────────────────
async function atualizarStatus(id, novoStatus) {
  const livro = livros.find(l => l.id === id);
  if (!livro) return;

  try {
    const atualizado = await api.put(`/api/livros/${id}`, {
      titulo: livro.titulo,
      autor: livro.autor,
      status: novoStatus,
      categoriaId: livro.categoria_id,
    });
    livros = livros.map(l => (l.id === id ? atualizado : l));
    renderizarLivros();
    atualizarContadores();
  } catch (err) {
    mostrarErro(err.message);
  }
}

// ── Criar card DOM a partir do template ──────────────────────
function criarCard(livro) {
  const clone = cardTemplate.content.cloneNode(true);
  const article = clone.querySelector('article');

  article.setAttribute('data-status', livro.status);
  article.querySelector('.card-title').textContent  = livro.titulo;
  article.querySelector('.card-author').textContent = `por ${livro.autor}`;
  article.querySelector('.card-categoria').textContent = livro.categoria_nome ? `📂 ${livro.categoria_nome}` : '';
  article.querySelector('.card-status-badge').textContent = STATUS_LABEL[livro.status];

  // Select de status
  const sel = article.querySelector('.card-status-select');
  Object.entries(STATUS_LABEL).forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (val === livro.status) opt.selected = true;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => atualizarStatus(livro.id, sel.value));

  // Botão remover
  article.querySelector('.btn-remove').addEventListener('click', () => removerLivro(livro.id));

  return article;
}

// ── Renderizar lista filtrada ─────────────────────────────────
function renderizarLivros() {
  booksGrid.innerHTML = '';

  const filtrados = livros.filter(l => {
    const passaStatus = filtroStatusAtivo === 'todos' || l.status === filtroStatusAtivo;
    const passaCategoria = filtroCategoriaAtiva === 'todas' || String(l.categoria_id) === filtroCategoriaAtiva;
    return passaStatus && passaCategoria;
  });

  if (filtrados.length === 0) {
    emptyState.classList.remove('hidden');
    booksGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  booksGrid.classList.remove('hidden');

  filtrados.forEach(livro => {
    booksGrid.appendChild(criarCard(livro));
  });
}

// ── Atualizar contadores no header ────────────────────────────
function atualizarContadores() {
  countLido.textContent  = livros.filter(l => l.status === 'lido').length;
  countLendo.textContent = livros.filter(l => l.status === 'lendo').length;
  countQuero.textContent = livros.filter(l => l.status === 'quero-ler').length;
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
  input.addEventListener('input', () => esconderErro());
});

// ── Init ─────────────────────────────────────────────────────
iniciarCabecalhoUsuario();
carregarCategorias();
carregarLivros();
