/**
 * Helper de banco para os testes de integração.
 * Reseta o schema aplicando schema.sql + seed.sql direto no Postgres de
 * teste (mesma estratégia usada em produção), garantindo que cada suíte
 * comece do mesmo estado conhecido.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../../src/config/db');

const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
const SEED_SQL = fs.readFileSync(path.join(__dirname, '../../db/seed.sql'), 'utf8');

async function resetarBanco() {
  await pool.query(SCHEMA_SQL);
  await pool.query(SEED_SQL);
}

async function encerrarConexao() {
  await pool.end();
}

module.exports = { resetarBanco, encerrarConexao, pool };
