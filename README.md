# Sapientia

Plataforma de treino para o concurso de Agente em Atividades Administrativas da Prefeitura de Itajaí/SC.

## Estado atual

O frontend ainda funciona de forma local, com desempenho salvo no `localStorage`. O repositório também contém uma base inicial para Cloudflare D1 e Pages Functions. A integração completa entre frontend, API e usuários será feita progressivamente.

## Estrutura

- `index.html`: aplicação de treino atual.
- `content_*.js`: complementos temporários do banco de questões.
- `functions/api`: endpoints para Cloudflare Pages Functions.
- `db/schema.sql`: schema inicial do D1.
- `db/imports`: provas oficiais e metadados de importação.
- `tools/build-d1-seed.mjs`: consolida, corrige e remove duplicatas.
- `tools/validate-d1-seed.mjs`: valida os artefatos gerados.

## Gerar e validar o seed

Requer Node.js 20 ou superior.

```bash
node tools/build-d1-seed.mjs
node tools/validate-d1-seed.mjs
```

São gerados:

- `db/seed.generated.sql`
- `db/dedupe-report.json`

## Cloudflare Pages e D1

No painel do projeto Pages, crie um binding D1 com o nome obrigatório `DB`. Aplique primeiro `db/schema.sql` e depois `db/seed.generated.sql`. O seed usa `UPSERT`, pode ser reaplicado e preserva as respostas já registradas. Ainda assim, faça backup antes de qualquer atualização de produção.

O endpoint `POST /api/criar-pergunta` fica bloqueado quando o secret `ADMIN_API_TOKEN` não está configurado. Quando o painel administrativo autenticado for implementado, configure esse valor exclusivamente como secret no Cloudflare e envie-o no cabeçalho:

```text
Authorization: Bearer <token>
```

Nunca coloque esse token em HTML, JavaScript público ou no repositório.

## APIs existentes

- `GET /api/perguntas`: lista perguntas ativas sem enviar o gabarito.
- `POST /api/validar`: valida uma alternativa no servidor.
- `GET /api/stats`: total de perguntas por tema.
- `POST /api/criar-pergunta`: cadastro administrativo protegido por token.

## Segurança

- Não publique secrets no GitHub.
- Mantenha o cadastro administrativo desabilitado até haver autenticação e perfis.
- Não retorne mensagens internas do banco para o navegador.
- Revise as questões e suas fontes antes da publicação.

## Próximas etapas

1. Tornar o D1 a fonte única de questões.
2. Adicionar migrações numeradas.
3. Implementar usuários, tentativas e respostas.
4. Criar painel editorial com revisão e versionamento.
5. Implementar favoritos, caderno de erros e simulados completos.
