# Diagnóstico de Qualidade de Código — Estante de Livros

Análise realizada sobre o estado do projeto no commit inicial (`main`), antes da refatoração da branch `refactor/limpeza-codigo`.

**Escopo analisado:** 27 arquivos versionados, 1.556 linhas de código (backend: 407 linhas em `src/`; frontend: 1.045 linhas).

**Método:** leitura integral dos arquivos de lógica (controllers, models, middlewares, scripts do frontend), busca por padrões repetidos e contagem manual de complexidade ciclomática.

---

## Sumário dos achados

| # | Code smell | Categoria | Onde |
|---|---|---|---|
| 1 | Verificação de dono do livro duplicada | Duplicação | `backend/src/controllers/livroController.js` |
| 2 | Tratamento de erro de chave estrangeira duplicado | Duplicação | `backend/src/controllers/livroController.js` |
| 3 | Par de chamadas de atualização de UI repetido 4x | Duplicação | `frontend/js/app.js` |
| 4 | `mostrarErro`/`esconderErro` duplicadas entre arquivos | Duplicação | `frontend/js/app.js`, `frontend/js/auth.js` |
| 5 | `adicionarLivro()` com 6 responsabilidades | Função longa demais | `frontend/js/app.js` |
| 6 | `request()` com complexidade ciclomática 12 | Função longa demais | `frontend/js/api.js` |
| 7 | Bloco `catch` vazio | Tratamento de erro | `frontend/js/api.js` |
| 8 | Falha de carregamento invisível para o usuário | Tratamento de erro | `frontend/js/app.js` |
| 9 | Log de erro sem nenhum contexto | Tratamento de erro | `backend/src/middlewares/errorHandler.js` |
| 10 | Configuração de CORS falha em silêncio | Tratamento de erro | `backend/src/app.js` |
| 11 | Nomes vagos em variáveis e callbacks | Nomenclatura | `frontend/js/api.js`, `frontend/js/app.js` |
| 12 | Números e strings mágicos | Valores mágicos | `backend/`, `frontend/` |

---

## 1. Duplicação

### 1.1 Verificação de dono do livro repetida — `backend/src/controllers/livroController.js`

O mesmo trio de operações (buscar o livro → responder 404 se não existe → responder 403 se não pertence ao usuário logado) aparece duas vezes, mudando apenas o verbo da mensagem de erro.

**Em `atualizar()`, linhas 60-66:**
```js
const livroAtual = await livroModel.buscarPorId(id);
if (!livroAtual) {
  return res.status(404).json({ erro: 'Livro não encontrado.' });
}
if (livroAtual.usuario_id !== req.usuario.id) {
  return res.status(403).json({ erro: 'Você não tem permissão para alterar este livro.' });
}
```

**Em `remover()`, linhas 88-93:** bloco idêntico, trocando `alterar` por `remover` na mensagem.

**Por que é um problema:** essa é a regra de autorização mais sensível da aplicação — é o que impede um usuário de mexer no acervo de outro. Estando escrita em dois lugares, uma correção futura (por exemplo, passar a registrar tentativas de acesso indevido) pode ser aplicada em um ponto e esquecida no outro, abrindo uma brecha silenciosa. Um terceiro endpoint que precise da mesma regra tenderia a copiar o bloco de novo.

### 1.2 Tratamento de erro de chave estrangeira repetido — `backend/src/controllers/livroController.js`

**Em `criar()`, linhas 45-47** e **em `atualizar()`, linhas 77-79**, exatamente o mesmo bloco:
```js
if (err.code === '23503') {
  return res.status(400).json({ erro: 'Categoria informada não existe.' });
}
```

**Por que é um problema:** conhecimento sobre códigos de erro do PostgreSQL (`23503` = violação de chave estrangeira) vazou para dentro do controller, que deveria tratar apenas regra de negócio. O projeto já possui um middleware central de erros (`errorHandler.js`), que é o lugar natural para traduzir erro de banco em resposta HTTP.

### 1.3 Par de atualização da interface repetido 4 vezes — `frontend/js/app.js`

As duas chamadas sempre aparecem juntas, nunca isoladas:
```js
renderizarLivros();
atualizarContadores();
```
Linhas **92-93** (`carregarLivros`), **119-120** (`adicionarLivro`), **140-141** (`removerLivro`) e **160-161** (`atualizarStatus`).

**Por que é um problema:** as duas funções formam, na prática, uma operação só — "redesenhar a tela com o estado atual". Se um terceiro elemento passar a depender do estado (um total geral, por exemplo), será preciso lembrar de adicionar a chamada nos quatro pontos. Esquecer um deles gera um bug de interface dessincronizada, difícil de perceber.

### 1.4 Funções de mensagem de erro duplicadas entre arquivos

**`frontend/js/app.js`, linhas 58-65:**
```js
function mostrarErro(mensagem) {
  errorMsg.textContent = `⚠️ ${mensagem}`;
  errorMsg.classList.remove('hidden');
}
function esconderErro() {
  errorMsg.classList.add('hidden');
}
```

**`frontend/js/auth.js`, linhas 20-27:** as mesmas duas funções, mudando só o nome da referência de DOM (`erroMsg` em vez de `errorMsg`) e a ausência do emoji.

**Por que é um problema:** além da duplicação de lógica, os dois arquivos são carregados no escopo global (nenhum `<script>` usa `type="module"`). Hoje não há colisão porque as páginas nunca carregam os dois juntos, mas basta uma futura página que precise de ambos para uma definição sobrescrever a outra silenciosamente. Também gera inconsistência visual: o mesmo tipo de aviso aparece com emoji em uma tela e sem emoji na outra.

---

## 2. Funções fazendo coisas demais

### 2.1 `adicionarLivro()` — `frontend/js/app.js`, linhas 100-133

Em 34 linhas, a função acumula **seis responsabilidades distintas**:

1. Ler e normalizar os quatro campos do formulário (linhas 101-104)
2. Validar campos obrigatórios (linha 107)
3. Controlar o foco do DOM para o campo faltante (linha 109)
4. Controlar o estado visual do botão (linhas 114 e 131)
5. Chamar a API e mutar o estado global (linhas 117-118)
6. Redesenhar a tela e limpar o formulário (linhas 119-127)

**Por que é um problema:** nenhuma dessas etapas pode ser lida, reutilizada ou testada isoladamente. A regra de validação — que é lógica de negócio pura — está presa a `document.getElementById` e ao foco do cursor. Para testar "livro sem título é rejeitado", seria preciso simular o DOM inteiro. É o exemplo mais claro de violação do princípio da responsabilidade única no projeto.

### 2.2 `request()` — `frontend/js/api.js`, linhas 37-79

Em um único bloco linear, a função trata cinco situações diferentes de resposta HTTP (erro de rede, 401, 204, 403, erro genérico) mais o parsing tolerante a falha do corpo. Sua complexidade ciclomática é **12** — a maior do projeto (cálculo na seção 4).

**Por que é um problema:** o arquivo tem uma boa intenção de design (centralizar o contato com o backend), mas a função virou uma sequência de casos especiais. Adicionar um novo tratamento — um 429 com retry, por exemplo — significa inserir mais um `if` no meio da cadeia, aumentando a chance de ordená-lo errado em relação aos demais.

---

## 3. Tratamento de erro frágil

### 3.1 Bloco `catch` vazio — `frontend/js/api.js`, linha 66

```js
try {
  dados = await resposta.json();
} catch (_) {
  // resposta sem corpo JSON (ex.: erro genérico do servidor)
}
```

**Por que é um problema:** o comentário documenta a intenção (resposta legitimamente sem corpo), mas o `catch` engole **qualquer** falha de parsing. Um JSON malformado por bug real do servidor produz exatamente o mesmo resultado silencioso de uma resposta vazia esperada. O sintoma que chega ao usuário é uma mensagem genérica, sem nenhum rastro do que de fato aconteceu.

### 3.2 Falha de carregamento invisível ao usuário — `frontend/js/app.js`, linhas 83-85

```js
} catch (err) {
  console.error('Falha ao carregar categorias:', err.message);
}
```

**Por que é um problema:** se a chamada falhar, os selects de categoria ficam vazios e o usuário não recebe nenhuma explicação — a tela simplesmente parece ter menos opções do que deveria. É uma inconsistência dentro do próprio arquivo: `carregarLivros()`, logo abaixo, avisa o usuário via `mostrarErro()`; `carregarCategorias()` não. Além disso, **nenhum dos quatro `catch` de `app.js`** (linhas 94, 128, 142, 162) registra o erro no console — só exibem a mensagem e a descartam.

### 3.3 Log de erro sem contexto — `backend/src/middlewares/errorHandler.js`, linha 7

```js
function errorHandler(err, req, res, _next) {
  console.error(err);
  // ...
}
```

**Por que é um problema:** o middleware central recebe `req` — logo, tem acesso a método HTTP, rota, e usuário autenticado —, mas descarta tudo e imprime apenas o objeto de erro. Em produção, o log resultante mostra um stack trace sem indicar qual requisição o provocou, sem timestamp e sem status. Investigar um erro relatado por um usuário vira adivinhação.

### 3.4 Configuração de CORS falha em silêncio — `backend/src/app.js`, linhas 11-16

```js
const origensPermitidas = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors({ origin: origensPermitidas }));
```

**Por que é um problema:** se `CORS_ORIGIN` não estiver definida, `origensPermitidas` vira um array vazio e o servidor passa a **rejeitar todas as origens** — sem lançar erro, sem aviso no boot. O servidor sobe "com sucesso", os endpoints respondem via `curl`, e apenas o navegador falha. É o pior tipo de falha de configuração: aparenta funcionar e o sintoma aparece longe da causa.

---

## 4. Métrica: complexidade ciclomática

Calculada pelo método de contagem de pontos de decisão: **CC = número de pontos de decisão + 1**, contando `if`, `for`, `while`, `case`, operador ternário, operadores lógicos `&&` / `||` e blocos `catch`.

### 4.1 `request()` — `frontend/js/api.js`, linhas 37-79 → **CC = 12**

| # | Ponto de decisão | Linha |
|---|---|---|
| 1 | `if (token)` | 40 |
| 2 | ternário `body !== undefined ? ... : ...` | 47 |
| 3 | `catch (err)` do `fetch` | 49 |
| 4 | `if (resposta.status === 401)` | 53 |
| 5 | `if (!window.location.pathname.endsWith(...))` | 55 |
| 6 | `if (resposta.status === 204)` | 61 |
| 7 | `catch (_)` do parse de JSON | 66 |
| 8 | `if (resposta.status === 403)` | 70 |
| 9 | `\|\|` em `dados?.erro \|\| '...'` | 71 |
| 10 | `if (!resposta.ok)` | 74 |
| 11 | `\|\|` em `dados?.erro \|\| '...'` | 75 |
| | **Base** | +1 |
| | **Total** | **12** |

**Leitura:** 12 caminhos de execução linearmente independentes em 43 linhas. A referência usual de Clean Code trata CC acima de 10 como sinal de que a função precisa ser quebrada, e acima de 7 como ponto de atenção. É a função mais complexa do projeto e a que mais se beneficia de extração.

### 4.2 `registrar()` — `backend/src/controllers/authController.js`, linhas 19-50 → **CC = 8**

| # | Ponto de decisão | Linha | Contribuição |
|---|---|---|---|
| 1 | `if (!nome \|\| !email \|\| !senha)` | 23 | 3 (o `if` + dois `\|\|`) |
| 2 | `if (!EMAIL_REGEX.test(email))` | 26 | 1 |
| 3 | `if (senha.length < 6)` | 29 | 1 |
| 4 | `if (existente)` | 34 | 1 |
| 5 | `catch (err)` | 47 | 1 |
| | **Base** | | +1 |
| | **Total** | | **8** |

**Leitura:** acima do limiar de atenção. As quatro primeiras decisões são todas validação de payload — extraí-las para uma função dedicada derrubaria a CC para cerca de 4, isolando as regras de validação de forma testável.

### 4.3 `atualizar()` — `backend/src/controllers/livroController.js`, linhas 52-82 → **CC = 7**

Pontos de decisão: `if (erro)` (58), `if (!livroAtual)` (61), `if (livroAtual.usuario_id !== ...)` (64), ternário de `categoriaId` (72), `catch` (76), `if (err.code === '23503')` (77) — total 6, mais a base = **7**.

**Leitura:** a CC não é alarmante, mas a função concentra quatro responsabilidades diferentes (validação, autorização, tradução de erro de banco e persistência). É o caso em que a complexidade *de responsabilidades* é maior do que a métrica numérica sugere — e é por isso que ela entra na refatoração mesmo não sendo a de maior CC.

### 4.4 Métricas complementares

| Métrica | Valor |
|---|---|
| Pontos de duplicação mapeados | **4** (itens 1.1 a 1.4) |
| Blocos de código duplicados | **8** (cada ponto aparece 2x ou mais) |
| Testes automatizados | **0** — nenhum framework de teste em nenhum `package.json` |
| Linters / formatadores | **0** — sem ESLint, sem Prettier |
| Maior arquivo de lógica | `frontend/js/app.js`, 260 linhas, sem separação de camadas |

---

## 5. Nomenclatura

### 5.1 Nomes vagos

| Nome | Onde | Problema |
|---|---|---|
| `dados` | `frontend/js/api.js`, linhas 63, 65, 71, 75, 78 | Equivalente direto do clássico `data`: carrega o corpo da resposta HTTP, mas o nome não diz nada sobre o que contém nem de onde veio |
| `l` | `frontend/js/app.js`, linhas 139, 149, 159, 200-203 | Callbacks usando `l` para "livro", enquanto o resto do arquivo escreve `livro` por extenso (`criarCard(livro)`) — inconsistência dentro do mesmo arquivo |
| `sel`, `opt` | `frontend/js/app.js`, linhas 179-186 | Abreviações que economizam poucos caracteres e custam clareza |
| `cat`, `optForm`, `optFiltro` | `frontend/js/app.js`, linhas 72-81 | `cat` é ambíguo; os dois `opt*` só se distinguem por sufixo |
| `raw` | `frontend/js/api.js`, linha 17 | Não indica que é o usuário serializado vindo do `localStorage` |
| `validarCampos` | `backend/src/controllers/livroController.js`, linha 9 | "Campos" de quê? O projeto tem validação de livro e de cadastro |

**Por que é um problema:** nomes vagos obrigam quem lê a reconstruir o significado a partir do contexto ao redor. O custo aparece na manutenção: `l` não é pesquisável, e `dados` aparece em cinco linhas com significados sutilmente diferentes.

### 5.2 Valores mágicos

| Valor | Onde | Deveria ser |
|---|---|---|
| `10` | `backend/src/controllers/authController.js`, linha 38 | Constante nomeada para o custo do bcrypt |
| `6` | `backend/src/controllers/authController.js`, linha 29 | Constante para o tamanho mínimo de senha |
| `'quero-ler'`, `'lendo'`, `'lido'` | `frontend/js/app.js` (41-44, 125, 200-203), `frontend/index.html` (62-64, 94-96), `backend/src/controllers/livroController.js` (7), `backend/db/schema.sql` (27) | Uma fonte única de verdade — hoje a mesma lista de status existe em quatro lugares |

**Por que é um problema:** os status válidos estarem replicados em quatro camadas (banco, controller, script do frontend e HTML) significa que adicionar um status novo exige quatro edições coordenadas. Esquecer a do `schema.sql` produz um erro de constraint em produção; esquecer a do HTML produz uma opção que o backend rejeita.

---

## 6. Observações de segurança

Verificação feita com `git log --all --diff-filter=A --name-only` sobre todo o histórico e busca por padrões de segredo (`postgresql://` com credenciais, `sk-`, `AKIA`, `BEGIN PRIVATE KEY`, `api_key=`) em todos os arquivos.

**Nenhum segredo real foi encontrado versionado.** Pontos registrados apenas como boa prática:

1. `backend/.env.example` contém somente placeholders (`usuario:senha@host.neon.tech`, `troque-por-um-segredo-longo-e-aleatorio`) — está correto e é o padrão recomendado.
2. A credencial da conta de teste (`leitor@teste.com` / `leitor123`) aparece em texto claro em `frontend/login.html` (linha 57), no `README.md` e em comentário no `backend/db/seed.sql`. Não é segredo de produção e é intencional para avaliação, mas em um projeto real credenciais não deveriam ser exibidas na interface publicada.
3. `frontend/js/api.js`, linha 10: a URL de produção do backend está fixa no código com um `TODO` não resolvido. Configuração de ambiente embutida no fonte dificulta promover o mesmo código entre ambientes.
4. Todas as queries do backend usam parâmetros (`$1`, `$2`), sem concatenação de entrada do usuário — **nenhum risco de SQL injection identificado**.

---

## 7. Prioridade de refatoração

Ordem adotada na branch `refactor/limpeza-codigo`, da maior para a menor relação impacto/esforço:

| Prioridade | Item | Justificativa |
|---|---|---|
| Alta | 1.1 Verificação de dono duplicada | Regra de autorização — duplicá-la é risco de segurança |
| Alta | 3.3 e 3.4 Erros sem contexto e CORS silencioso | Falhas invisíveis custam horas de diagnóstico |
| Alta | 2.1 `adicionarLivro()` | Maior violação de responsabilidade única do projeto |
| Média | 1.2 Erro de FK duplicado | Vazamento de detalhe de banco para o controller |
| Média | 1.3 e 1.4 Duplicações de UI | Risco de dessincronização de tela e colisão de escopo global |
| Média | 3.1 e 3.2 Erros engolidos | Perda de rastreabilidade e de feedback ao usuário |
| Baixa | 5.1 Nomes vagos | Custo baixo, ganho imediato de legibilidade |
| Baixa | 5.2 Valores mágicos | Encapsular os mais críticos (bcrypt, senha mínima) |
