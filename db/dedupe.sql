-- Remove duplicatas exatas já existentes, mantendo o registro de menor rowid.
-- Execute uma única vez antes de criar o índice UNIQUE em pergunta_normalizada
-- caso você esteja migrando uma tabela antiga.
DELETE FROM perguntas
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM perguntas
  GROUP BY pergunta_normalizada
);
