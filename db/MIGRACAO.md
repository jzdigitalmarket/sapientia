# Migração do banco de questões

O repositório já possuía questões em múltiplas fontes (HTML, JSON e scripts de expansão).
Para evitar repetição no D1, a migração deve seguir estas regras:

1. Normalizar o enunciado em minúsculas, removendo espaços duplicados, pontuação periférica e prefixos artificiais.
2. Remover prefixos que apenas reescrevem a mesma questão, como:
   - "Em uma situação prática,"
   - "No contexto de uma repartição pública,"
   - "Considerando a rotina administrativa,"
3. Usar `pergunta_normalizada` como chave única.
4. Quando duas questões normalizadas coincidirem, manter uma só.
5. Preservar a versão com melhor fundamentação e alternativas mais completas.
6. Não considerar como distintas questões que mudam apenas o contexto introdutório sem mudar o conteúdo avaliado.

O schema em `db/schema.sql` impede novas duplicatas exatas por meio de `UNIQUE(pergunta_normalizada)`.
