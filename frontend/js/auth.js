/**
 * auth.js — alterna login/cadastro, envia pra API e guarda a sessão.
 */

// Se já está logado, não faz sentido ficar na tela de login.
if (api.getToken()) {
  window.location.href = 'index.html';
}

const tabLogin     = document.getElementById('tab-login');
const tabCadastro  = document.getElementById('tab-cadastro');
const formLogin    = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');
const erroMsg      = document.getElementById('erro-msg');
const avisoExpirado = document.getElementById('aviso-expirado');

const btnLogin    = document.getElementById('btn-login');
const btnCadastro = document.getElementById('btn-cadastro');

function mostrarErro(mensagem) {
  erroMsg.textContent = mensagem;
  erroMsg.classList.remove('hidden');
}

function esconderErro() {
  erroMsg.classList.add('hidden');
}

function irPara(aba) {
  esconderErro();
  const ehLogin = aba === 'login';
  tabLogin.classList.toggle('active', ehLogin);
  tabCadastro.classList.toggle('active', !ehLogin);
  tabLogin.setAttribute('aria-selected', String(ehLogin));
  tabCadastro.setAttribute('aria-selected', String(!ehLogin));
  formLogin.classList.toggle('hidden', !ehLogin);
  formCadastro.classList.toggle('hidden', ehLogin);
}

tabLogin.addEventListener('click', () => irPara('login'));
tabCadastro.addEventListener('click', () => irPara('cadastro'));

// Aviso de sessão expirada (redirecionado pelo api.js após 401)
if (new URLSearchParams(window.location.search).get('expirado') === '1') {
  avisoExpirado.classList.remove('hidden');
}

function definirCarregando(botao, carregando, textoPadrao) {
  botao.disabled = carregando;
  botao.textContent = carregando ? 'Aguarde…' : textoPadrao;
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderErro();

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  definirCarregando(btnLogin, true, 'Entrar');
  try {
    const { token, usuario } = await api.post('/api/auth/login', { email, senha });
    api.salvarSessao(token, usuario);
    window.location.href = 'index.html';
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    definirCarregando(btnLogin, false, 'Entrar');
  }
});

formCadastro.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderErro();

  const nome  = document.getElementById('cadastro-nome').value.trim();
  const email = document.getElementById('cadastro-email').value.trim();
  const senha = document.getElementById('cadastro-senha').value;

  definirCarregando(btnCadastro, true, 'Criar conta');
  try {
    const { token, usuario } = await api.post('/api/auth/register', { nome, email, senha });
    api.salvarSessao(token, usuario);
    window.location.href = 'index.html';
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    definirCarregando(btnCadastro, false, 'Criar conta');
  }
});
