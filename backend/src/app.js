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
