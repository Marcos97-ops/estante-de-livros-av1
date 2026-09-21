/**
 * authController — cadastro e login. Nenhuma query SQL aqui,
 * toda persistência passa pelo usuarioModel.
 *
 * Recebe o model por parâmetro (injeção de dependência) em vez de importar
 * o módulo concreto: o controller depende da abstração "um model de usuário
 * com buscarPorEmail/criar", não da implementação em Postgres. Isso permite
 * testar a orquestração HTTP com um model fake, sem tocar no banco.
 *
 * Express 5 encaminha automaticamente qualquer rejeição de uma função async
 * de rota para o errorHandler — por isso os handlers não precisam de
 * try/catch + next(err) em cada um.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModelPadrao = require('../models/usuarioModel');
const { normalizarEmail, validarCadastro, validarLogin } = require('../validators/authValidator');

const CUSTO_DO_HASH = 10;

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

function criarAuthController({ usuarioModel } = { usuarioModel: usuarioModelPadrao }) {
  async function registrar(req, res) {
    const { nome, email, senha } = req.body;

    const mensagemDeErro = validarCadastro({ nome, email, senha });
    if (mensagemDeErro) return res.status(400).json({ erro: mensagemDeErro });

    const emailNormalizado = normalizarEmail(email);
    const existente = await usuarioModel.buscarPorEmail(emailNormalizado);
    if (existente) {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, CUSTO_DO_HASH);
    const usuario = await usuarioModel.criar({
      nome: nome.trim(),
      email: emailNormalizado,
      senhaHash,
    });

    const token = gerarToken(usuario);
    return res.status(201).json({ token, usuario });
  }

  async function login(req, res) {
    const { email, senha } = req.body;

    const mensagemDeErro = validarLogin({ email, senha });
    if (mensagemDeErro) return res.status(400).json({ erro: mensagemDeErro });

    const usuario = await usuarioModel.buscarPorEmail(normalizarEmail(email));
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = gerarToken(usuario);
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  }

  return { registrar, login };
}

module.exports = { criarAuthController, ...criarAuthController() };
