-- ============================================================
-- Estante de Livros — seed.sql
-- Categorias iniciais + usuário de teste (documentado no README)
-- ============================================================

INSERT INTO categorias (nome) VALUES
  ('Ficção'),
  ('Técnico'),
  ('Biografia'),
  ('Fantasia'),
  ('História')
ON CONFLICT (nome) DO NOTHING;

-- Usuário de teste para a avaliação.
-- E-mail: leitor@teste.com | Senha: leitor123
-- (hash gerado com bcrypt, custo 10 — nunca armazenar a senha em texto puro)
INSERT INTO usuarios (nome, email, senha_hash) VALUES
  ('Leitor Teste', 'leitor@teste.com', '$2b$10$Nu9lEjRVNzPUr40K1Mumo.Se2NLRw9Gn/GSVWHbtvnzQBXbVjXtUe')
ON CONFLICT (email) DO NOTHING;

-- Um livro de exemplo já na estante do usuário de teste
INSERT INTO livros (titulo, autor, status, usuario_id, categoria_id)
SELECT 'Dom Casmurro', 'Machado de Assis', 'lido', u.id, c.id
FROM usuarios u, categorias c
WHERE u.email = 'leitor@teste.com' AND c.nome = 'Ficção';
