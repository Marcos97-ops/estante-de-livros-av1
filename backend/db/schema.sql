-- ============================================================
-- Estante de Livros — schema.sql
-- 3 tabelas, 2 chaves estrangeiras (livros -> usuarios, livros -> categorias)
-- ============================================================

DROP TABLE IF EXISTS livros CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id   SERIAL PRIMARY KEY,
  nome VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE livros (
  id           SERIAL PRIMARY KEY,
  titulo       VARCHAR(200) NOT NULL,
  autor        VARCHAR(150) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'quero-ler'
               CHECK (status IN ('quero-ler', 'lendo', 'lido')),
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
  categoria_id INTEGER          REFERENCES categorias(id) ON DELETE SET NULL,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_livros_usuario ON livros(usuario_id);
CREATE INDEX idx_livros_categoria ON livros(categoria_id);
