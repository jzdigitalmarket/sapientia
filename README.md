# Sapientia

Plataforma de treino para o concurso de Agente em Atividades Administrativas da Prefeitura de Itajaí/SC.

## Arquitetura atual

O site é publicado no Cloudflare Pages. O banco de questões pode ser servido pelo Cloudflare D1 por meio de Pages Functions. O desempenho agregado continua disponível no navegador via `localStorage`, enquanto cada resposta validada pela API é registrada no D1. Se a API/D1 estiver temporariamente indisponível, o treino mantém fallback para o banco local durante a fase de migração.

## Estrutura

- `index.html`: aplicação principal.
- `ui_school_modern.js` e CSS: interface e integração progressiva com D1.
- `content_*.js`: fontes temporárias ainda usadas pelo gerador do seed; não remover até a consolidação final.
- `functions/api`: endpoints do Cloudflare Pages.
- `db/schema.sql`: schema normalizado para instalações novas.
- `db/migrations`: migrações incrementais para bancos D1 existentes.
- `db/imports`: provas oficiais e metadados de importação.
- `tools/build-d1-seed.mjs`: consolida, corrige e remove duplicatas.
- `tools/validate-d1-seed.mjs`: valida os artefatos gerados.

## Modelo de dados

O modelo definitivo separa `temas`, `subtemas`, `perguntas`, `alternativas`, `fontes`, `tags` e `respostas`. As tabelas `pergunta_fontes` e `pergunta_tags` implementam relacionamentos N:N. Durante a migração, os campos legados `opcoes` e `correta` permanecem em `perguntas` para compatibilidade com o seed existente; novas questões também são gravadas em `alternativas`.

## Gerar e validar o seed

Requer Node.js 20 ou superior.

```bash
node tools/build-d1-seed.mjs
node tools/validate-d1-seed.mjs
```

São gerados `db/seed.generated.sql` e `db/dedupe-report.json`.

## Cloudflare Pages e D1

Crie no projeto Pages um binding D1 chamado exatamente `DB`.

### Banco novo

1. Aplique `db/schema.sql`.
2. Aplique `db/seed.generated.sql`.
3. Faça o deploy do Pages.

### Banco existente no schema antigo

1. Faça backup.
2. Aplique `db/migrations/002-normalize-question-bank.sql`.
3. Reaplique `db/seed.generated.sql` quando necessário.
4. Faça o deploy do Pages.

A migração 002 cria a tabela normalizada de alternativas e converte automaticamente o JSON legado com `json_each`, sem apagar `opcoes`/`correta`.

## APIs

- `GET /api/perguntas?tema=1&limite=40`: seleciona questões ativas aleatoriamente e entrega alternativas sem gabarito.
- `POST /api/validar`: valida no servidor e registra a tentativa em `respostas`.
- `GET /api/stats`: total de questões por tema.
- `POST /api/criar-pergunta`: cadastra questão + alternativas em batch, protegido por token.

O endpoint administrativo exige o secret `ADMIN_API_TOKEN` no Cloudflare:

```text
Authorization: Bearer <token>
```

Nunca coloque esse token no HTML, JavaScript público ou GitHub.

## Segurança e integridade

- O gabarito não é enviado junto com a questão.
- A validação ocorre no servidor.
- O cadastro administrativo é fechado sem `ADMIN_API_TOKEN`.
- Enunciados são normalizados para detectar duplicatas.
- Alternativas duplicadas e índices inválidos são rejeitados.
- Revise questões e fontes antes da publicação.

## Migração restante

O frontend já tenta carregar o treino do D1 e usa o banco embutido somente como fallback. Quando o D1 de produção estiver validado, a etapa final será retirar `DATA`, `content_*.js` e `perguntas.json` do runtime/gerador, tornando o D1 a fonte única e eliminando definitivamente a duplicação de dados.
