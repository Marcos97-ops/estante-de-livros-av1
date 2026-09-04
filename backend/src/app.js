const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const livroRoutes = require('./routes/livroRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const origensPermitidas = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

// Sem essa checagem o servidor sobe normalmente e bloqueia todas as requisições
// do navegador em silêncio — o sintoma aparece longe da causa.
if (origensPermitidas.length === 0) {
  console.warn(
    '[cors] CORS_ORIGIN não definida: nenhuma origem será aceita pelo navegador. ' +
    'Defina CORS_ORIGIN no .env com a URL do frontend (ex.: http://localhost:5500).'
  );
}

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/livros', livroRoutes);

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Sempre por último: captura erros lançados pelas rotas acima.
app.use(errorHandler);

module.exports = app;
