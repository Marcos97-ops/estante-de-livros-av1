/**
 * Pool de conexões com o Postgres.
 * SSL é decidido pelo host de destino, não por NODE_ENV: um Postgres remoto
 * (Neon, Render) exige SSL mesmo quando acessado a partir do ambiente de
 * desenvolvimento local; um Postgres em localhost não usa SSL nem em produção.
 */
const { Pool } = require('pg');

const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  // Erro em um cliente ocioso do pool — não deve derrubar o processo.
  console.error('Erro inesperado no pool do Postgres:', err);
});

module.exports = pool;
