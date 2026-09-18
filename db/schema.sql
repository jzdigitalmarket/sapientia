PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS temas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perguntas (
  id TEXT PRIMARY KEY,
  tema TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  pergunta_normalizada TEXT NOT NULL UNIQUE,
  opcoes TEXT NOT NULL CHECK (json_valid(opcoes)),
  correta INTEGER NOT NULL,
  explicacao TEXT,
  base TEXT,
  dificuldade INTEGER DEFAULT 2 CHECK (dificuldade BETWEEN 1 AND 3),
  ativa INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0,1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tema) REFERENCES temas(id)
);

CREATE INDEX IF NOT EXISTS idx_perguntas_tema ON perguntas(tema);
CREATE INDEX IF NOT EXISTS idx_perguntas_ativas ON perguntas(ativa);
CREATE INDEX IF NOT EXISTS idx_perguntas_tema_ativa ON perguntas(tema, ativa);

CREATE TABLE IF NOT EXISTS respostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT,
  pergunta_id TEXT NOT NULL,
  resposta_usuario INTEGER NOT NULL,
  correta INTEGER NOT NULL CHECK (correta IN (0,1)),
  respondida_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id)
);

CREATE INDEX IF NOT EXISTS idx_respostas_pergunta ON respostas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_respostas_usuario ON respostas(usuario_id);


-- Metadados para questões importadas de provas oficiais
ALTER TABLE perguntas ADD COLUMN origem_tipo TEXT;
ALTER TABLE perguntas ADD COLUMN origem_banca TEXT;
ALTER TABLE perguntas ADD COLUMN origem_orgao TEXT;
ALTER TABLE perguntas ADD COLUMN origem_ano INTEGER;
ALTER TABLE perguntas ADD COLUMN origem_cargo TEXT;
ALTER TABLE perguntas ADD COLUMN origem_numero INTEGER;
ALTER TABLE perguntas ADD COLUMN origem_url TEXT;

CREATE INDEX IF NOT EXISTS idx_perguntas_origem
ON perguntas(origem_banca, origem_orgao, origem_ano, origem_cargo);
