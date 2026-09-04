/**
 * api.js — ponto único de contato com o backend.
 * Injeta o token, centraliza o tratamento de 401/403 e erros de rede.
 */

// Em produção (Vercel), aponta pro backend publicado no Render.
// Em desenvolvimento local, aponta pro servidor rodando na máquina.
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://estante-de-livros-api.onrender.com'; // TODO: atualizar com a URL real do Render após o deploy

function getToken() {
  return localStorage.getItem('token');
}

function getUsuario() {
  const usuarioSerializado = localStorage.getItem('usuario');
  return usuarioSerializado ? JSON.parse(usuarioSerializado) : null;
}

function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

/**
 * Faz a requisição autenticada e trata os erros de forma centralizada.
 * - 401 -> sessão inválida/expirada: limpa o storage e manda pro login.
 * - 403 -> autenticado, mas sem permissão sobre o recurso.
 * - demais erros -> rejeita com a mensagem vinda da API (campo `erro`).
 */
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  }

  if (resposta.status === 401) {
    limparSessao();
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html?expirado=1';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (resposta.status === 204) return null;

  let corpoDaResposta = null;
  try {
    corpoDaResposta = await resposta.json();
  } catch (_) {
    // resposta sem corpo JSON (ex.: erro genérico do servidor)
  }

  if (resposta.status === 403) {
    throw new Error(corpoDaResposta?.erro || 'Você não tem permissão para realizar esta ação.');
  }

  if (!resposta.ok) {
    throw new Error(corpoDaResposta?.erro || 'Ocorreu um erro inesperado.');
  }

  return corpoDaResposta;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  getToken,
  getUsuario,
  salvarSessao,
  limparSessao,
};
