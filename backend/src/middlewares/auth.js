/**
 * Middleware de autenticação JWT.
 * Exige header `Authorization: Bearer <token>`. Sem header, token malformado
 * ou expirado -> 401. Em caso de sucesso, popula req.usuario e segue adiante.
 */
const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, nome: payload.nome };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

module.exports = autenticar;
