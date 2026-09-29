PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS subtemas (id INTEGER PRIMARY KEY AUTOINCREMENT, tema_id TEXT NOT NULL, nome TEXT NOT NULL, descricao TEXT, ordem INTEGER NOT NULL DEFAULT 0, ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)), UNIQUE(tema_id,nome), FOREIGN KEY(tema_id) REFERENCES temas(id));
CREATE TABLE IF NOT EXISTS fontes (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, tipo TEXT, orgao TEXT, ano INTEGER, referencia TEXT, url TEXT, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS alternativas (id INTEGER PRIMARY KEY AUTOINCREMENT, pergunta_id TEXT NOT NULL, ordem INTEGER NOT NULL, texto TEXT NOT NULL, correta INTEGER NOT NULL DEFAULT 0 CHECK(correta IN(0,1)), UNIQUE(pergunta_id,ordem), FOREIGN KEY(pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS pergunta_tags (pergunta_id TEXT NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY(pergunta_id,tag_id), FOREIGN KEY(pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE, FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS pergunta_fontes (pergunta_id TEXT NOT NULL, fonte_id INTEGER NOT NULL, observacao TEXT, PRIMARY KEY(pergunta_id,fonte_id), FOREIGN KEY(pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE, FOREIGN KEY(fonte_id) REFERENCES fontes(id) ON DELETE CASCADE);

-- Converte o JSON legado de opções para linhas normalizadas sem apagar os campos antigos.
INSERT OR IGNORE INTO alternativas (pergunta_id, ordem, texto, correta)
SELECT p.id, CAST(j.key AS INTEGER), CAST(j.value AS TEXT), CASE WHEN CAST(j.key AS INTEGER)=p.correta THEN 1 ELSE 0 END
FROM perguntas p, json_each(p.opcoes) j
WHERE p.opcoes IS NOT NULL AND json_valid(p.opcoes);

CREATE INDEX IF NOT EXISTS idx_alternativas_pergunta ON alternativas(pergunta_id,ordem);
INSERT OR IGNORE INTO schema_migrations(id) VALUES ('002-normalize-question-bank');
COMMIT;
