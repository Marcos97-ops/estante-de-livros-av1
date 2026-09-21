// Executado pelo Jest antes de qualquer teste (jest.config.js -> setupFiles).
// Garante variáveis de ambiente previsíveis, independentemente do .env local.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste-nao-usar-em-producao';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5500';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/estante_test';
