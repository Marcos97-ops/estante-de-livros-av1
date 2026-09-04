# 📚 Estante de Livros

Aplicação full-stack para gerenciar sua biblioteca pessoal. Projeto Final do curso — evolução do projeto de frontend da AV1 (Módulo 2) para uma aplicação completa com backend, banco de dados relacional, autenticação e deploy.

Cada usuário cria sua própria conta e vê apenas os livros que cadastrou. É possível organizar os livros por status — **Quero ler**, **Lendo** ou **Lido** —, categorizá-los e filtrar por status ou categoria.

> 📋 Este repositório é a cópia do projeto dedicada à **revisão formal de qualidade de código**. O levantamento completo de code smells e métricas está em [`DIAGNOSTICO.md`](DIAGNOSTICO.md), e o que mudou a partir dele está resumido em [O que foi melhorado na refatoração](#-o-que-foi-melhorado-na-refatoração).

## 🔗 URLs de produção

| | URL |
|---|---|
| Frontend (Vercel) | `TODO: preencher após o deploy` |
| Backend (Render) | `TODO: preencher após o deploy` |

## 🔑 Usuário de teste

Para logar sem precisar cadastrar uma conta nova:

- **E-mail:** `leitor@teste.com`
- **Senha:** `leitor123`

> ⚠️ O plano gratuito do Render "hiberna" o backend após ~15 minutos sem tráfego. A primeira requisição depois de um tempo parado pode levar até ~50 segundos para responder — não é erro, é o servidor "acordando".

## 🛠 Tecnologias

**Backend:** Node.js, Express, PostgreSQL (driver `pg`, SQL puro), JWT (`jsonwebtoken`), `bcryptjs`, CORS.
**Frontend:** HTML5 semântico, Tailwind CSS (via CDN), CSS3 (Flexbox e Media Queries), JavaScript puro (`fetch`, manipulação de DOM).

## 📁 Estrutura do repositório

```
estante-de-livros/
├── backend/                 # API REST — Node/Express + PostgreSQL
│   ├── db/
│   │   ├── schema.sql       # DDL das tabelas e chaves estrangeiras
│   │   └── seed.sql         # categorias iniciais + usuário de teste
│   └── src/
│       ├── server.js        # ponto de entrada (sobe a porta)
│       ├── app.js           # configuração do Express (rotas, CORS, erros)
│       ├── config/db.js     # pool de conexão com o Postgres
│       ├── models/          # queries SQL (sem req/res)
│       ├── controllers/     # regra de negócio (sem SQL)
│       ├── routes/          # definição dos endpoints
│       └── middlewares/     # autenticação JWT e tratamento de erros
└── frontend/                 # SPA estática — vanilla JS
    ├── index.html            # estante (exige login)
    ├── login.html            # login + cadastro
    ├── css/style.css
    └── js/
        ├── api.js            # wrapper de fetch: injeta token, trata 401/403
        ├── ui.js             # helpers de interface compartilhados entre as telas
        ├── auth.js           # lógica de login/cadastro
        └── app.js             # CRUD de livros via API
```

## 🗄 Modelo de dados

Três tabelas, com `livros` relacionada a `usuarios` e a `categorias` por chave estrangeira:

```
usuarios (1) ──────< (N) livros (N) >────── (1) categorias
   id                   id                      id
   nome                 titulo                  nome
   email                autor
   senha_hash           status
                        usuario_id   -> usuarios.id
                        categoria_id -> categorias.id
```

- `livros.usuario_id` → `usuarios.id` (`ON DELETE CASCADE`): apagar o usuário apaga seus livros.
- `livros.categoria_id` → `categorias.id` (`ON DELETE SET NULL`): apagar uma categoria não apaga os livros, só remove a categorização.

Definição completa em [`backend/db/schema.sql`](backend/db/schema.sql).

## 🔐 Autenticação

Login e cadastro devolvem um token JWT (expira em 2 horas), que o frontend guarda no `localStorage` e envia no header `Authorization: Bearer <token>` em toda requisição a `/api/livros`. Rotas de leitura (`/api/categorias`) são públicas; todas as rotas de escrita de livros exigem token válido. Um usuário só pode editar/remover os próprios livros — tentar mexer no livro de outro usuário retorna `403`.

## 📡 Endpoints da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | não | Cria conta e devolve token |
| POST | `/api/auth/login` | não | Autentica e devolve token |
| GET | `/api/categorias` | não | Lista categorias disponíveis |
| GET | `/api/livros` | sim | Lista os livros do usuário logado |
| POST | `/api/livros` | sim | Cria um livro |
| PUT | `/api/livros/:id` | sim (dono) | Atualiza um livro |
| DELETE | `/api/livros/:id` | sim (dono) | Remove um livro |
| GET | `/api/health` | não | Healthcheck |

**Exemplo — criar livro:**
```http
POST /api/livros
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Dom Casmurro",
  "autor": "Machado de Assis",
  "status": "lido",
  "categoriaId": 1
}
```

**Resposta (201):**
```json
{
  "id": 1,
  "titulo": "Dom Casmurro",
  "autor": "Machado de Assis",
  "status": "lido",
  "usuario_id": 1,
  "categoria_id": 1,
  "categoria_nome": "Ficção",
  "criado_em": "2026-08-02T17:22:28.650Z"
}
```

**Erros seguem o formato** `{ "erro": "mensagem" }`, com o status HTTP correspondente (`400` validação, `401` não autenticado, `403` sem permissão, `404` não encontrado, `409` e-mail duplicado).

## 🚀 Como rodar o projeto do zero

### Pré-requisitos
- Node.js 18+
- Uma instância PostgreSQL (local ou um projeto gratuito no [Neon](https://neon.tech))

### 1. Clonar o repositório
```bash
git clone https://github.com/Marcos97-ops/estante-de-livros-av1.git
cd estante-de-livros-av1
```

### 2. Configurar o banco de dados
Crie um banco (local ou no Neon) e rode os scripts SQL na ordem:
```bash
psql "<sua-connection-string>" -f backend/db/schema.sql
psql "<sua-connection-string>" -f backend/db/seed.sql
```

Para subir um Postgres local descartável com Docker:
```bash
docker run -d --name estante-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=estante -p 5432:5432 postgres:16-alpine
```
A connection string fica `postgresql://postgres:postgres@localhost:5432/estante`.

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# edite o .env com sua DATABASE_URL e um JWT_SECRET próprio
npm run dev
```
O servidor sobe em `http://localhost:3000`.

### 4. Frontend
Sirva a pasta `frontend/` com qualquer servidor estático (ex.: extensão "Live Server" do VS Code, ou):
```bash
cd frontend
python -m http.server 5500
```
Acesse `http://localhost:5500/index.html`. Localmente, `js/api.js` já aponta para `http://localhost:3000` automaticamente.

## ⚙️ Variáveis de ambiente (backend)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres (inclua `?sslmode=require` em serviços hospedados) |
| `JWT_SECRET` | Segredo para assinar os tokens — use um valor longo e aleatório |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `2h`) |
| `CORS_ORIGIN` | Origem(ns) do frontend permitidas no CORS, separadas por vírgula |
| `PORT` | Porta do servidor (padrão `3000`) |
| `NODE_ENV` | `development` ou `production` (ativa SSL na conexão com o Postgres) |

Veja [`backend/.env.example`](backend/.env.example) para o modelo completo.

## ☁️ Deploy

- **Backend → Render:** Web Service com *Root Directory* `backend`, build `npm install`, start `npm start`. Configure as variáveis de ambiente da tabela acima (`CORS_ORIGIN` apontando para a URL da Vercel).
- **Frontend → Vercel:** importe o repositório com *Root Directory* `frontend`, framework "Other", sem build command.
- **Banco → Neon:** crie um projeto gratuito, copie a connection string e rode `schema.sql` + `seed.sql` pelo SQL Editor do painel.

Depois do primeiro deploy, atualize `API_URL` em `frontend/js/api.js` com a URL real do Render.

## ✨ Funcionalidades

- Cadastro e login com senha criptografada (bcrypt) e sessão via JWT
- CRUD completo de livros (título, autor, status, categoria)
- Cada usuário só acessa a própria estante
- Filtro por status e por categoria
- Contador de livros por status, atualizado em tempo real
- Tratamento de sessão expirada/inválida (401) e de permissão negada (403)
- Layout responsivo (mobile e desktop)

## 🧹 O que foi melhorado na refatoração

O diagnóstico completo — com trechos de código, arquivo:linha e cálculo de complexidade ciclomática — está em [`DIAGNOSTICO.md`](DIAGNOSTICO.md). Esta seção resume o que foi corrigido a partir dele.

**Nenhum comportamento visível para o usuário mudou.** A refatoração alterou como o código está organizado, não o que a aplicação faz.

### Duplicação eliminada

| Problema | Solução |
|---|---|
| A verificação de dono do livro (404 se não existe, 403 se é de outro usuário) estava escrita duas vezes, em `atualizar` e `remover` | Extraída para `buscarLivroDoUsuario()`. A regra de autorização mais sensível da aplicação passa a existir em um lugar só |
| O tratamento do erro `23503` do Postgres (categoria inexistente) estava duplicado em `criar` e `atualizar` | Movido para o `errorHandler` central. Os controllers não conhecem mais códigos de erro do banco |
| `renderizarLivros()` e `atualizarContadores()` eram sempre chamadas em par, em 4 lugares | Unificadas em `atualizarInterface()` |
| `mostrarErro`/`esconderErro` existiam quase idênticas em `app.js` e `auth.js`, ambas no escopo global | Extraídas para `js/ui.js`, compartilhado pelas duas telas via `criarAvisoDeErro(elemento)` |

### Funções que faziam coisas demais

- **`adicionarLivro()`** acumulava seis responsabilidades em 34 linhas. Virou uma orquestração de três funções coesas: `lerFormularioDeLivro()`, `validarFormularioDeLivro()` e `limparFormularioDeLivro()`. A validação agora é pura — não toca no DOM — e segue o mesmo contrato da validação do backend (devolve a mensagem de erro ou `null`).
- **`atualizar()`** no backend misturava validação, autorização, tradução de erro de banco e persistência. Com a extração de `buscarLivroDoUsuario()` e a centralização do erro de chave estrangeira, sobrou só a orquestração.

### Tratamento de erro explícito

| Antes | Depois |
|---|---|
| `console.error(err)` no `errorHandler`, sem nenhum contexto | Log estruturado em JSON com horário, método, rota, status e mensagem. Stack trace só em erro 5xx, já que 4xx é falha esperada do cliente. Além disso, 4xx sai por **stdout** e 5xx por **stderr**, para um 404 não disparar alerta junto com um 500 nos coletores de log |
| Sem `CORS_ORIGIN`, o servidor subia normalmente e bloqueava **todas** as requisições do navegador em silêncio | Aviso explícito no boot dizendo o que configurar e onde |
| Falha ao carregar categorias aparecia só no console — o usuário via os selects vazios sem explicação | O usuário é avisado na tela, deixando claro que ainda dá para cadastrar livros sem categoria |
| `catch` vazio ao ler o corpo da resposta engolia qualquer falha de parsing | Passa a registrar quando a resposta é de **sucesso** e mesmo assim veio sem JSON válido — isso é bug do servidor, não corpo vazio esperado |
| Quem digitava a senha errada via **"Sessão expirada. Faça login novamente."**, porque todo 401 era tratado como token vencido | Na tela de login, o 401 passa a exibir a mensagem real do backend (`E-mail ou senha inválidos.`). Bug encontrado durante o teste manual da refatoração |

### Nomes que explicam a intenção

`dados` → `corpoDaResposta` · `raw` → `usuarioSerializado` · `l` → `livro` · `sel` → `selectDeStatus` · `opt` → `opcao` · `cat` → `categoria` · `optForm`/`optFiltro` → `opcaoDoFormulario`/`opcaoDoFiltro` · `filtrados` → `livrosVisiveis` · `clone`/`article` → `cardClonado`/`cardDoLivro` · `validarCampos` → `validarDadosDoLivro`

Também foi extraída a constante `STATUS_PADRAO`, no lugar da string `'quero-ler'` repetida no reset do formulário.
