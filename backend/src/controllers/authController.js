/**
 * authController — cadastro e login. Nenhuma query SQL aqui,
 * toda persistência passa pelo usuarioModel.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

async function registrar(req, res, next) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'E-mail inválido.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha precisa ter ao menos 6 caracteres.' });
    }

    const existente = await usuarioModel.buscarPorEmail(email.toLowerCase().trim());
    if (existente) {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await usuarioModel.criar({
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      senhaHash,
    });

    const token = gerarToken(usuario);
    return res.status(201).json({ token, usuario });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await usuarioModel.buscarPorEmail(email.toLowerCase().trim());
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
  } catch (err) {
    return next(err);
  }
}

module.exports = { registrar, login };
