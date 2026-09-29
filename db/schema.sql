PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  aplicado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subtemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tema_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
  UNIQUE (tema_id, nome),
  FOREIGN KEY (tema_id) REFERENCES temas(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fontes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT,
  orgao TEXT,
  ano INTEGER,
  referencia TEXT,
  url TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perguntas (
  id TEXT PRIMARY KEY,
  tema TEXT NOT NULL,
  subtema_id INTEGER,
  pergunta TEXT NOT NULL,
  pergunta_normalizada TEXT NOT NULL UNIQUE,
  opcoes TEXT CHECK (opcoes IS NULL OR json_valid(opcoes)),
  correta INTEGER,
  explicacao TEXT,
  base TEXT,
  dificuldade INTEGER NOT NULL DEFAULT 2 CHECK (dificuldade BETWEEN 1 AND 3),
  ativa INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0,1)),
  status TEXT NOT NULL DEFAULT 'publicada' CHECK (status IN ('rascunho','revisao','publicada','arquivada')),
  origem_tipo TEXT,
  origem_banca TEXT,
  origem_orgao TEXT,
  origem_ano INTEGER,
  origem_cargo TEXT,
  origem_numero INTEGER,
  origem_url TEXT,
  revisada_em TEXT,
  revisada_por TEXT,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tema) REFERENCES temas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (subtema_id) REFERENCES subtemas(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alternativas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pergunta_id TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  texto TEXT NOT NULL,
  correta INTEGER NOT NULL DEFAULT 0 CHECK (correta IN (0,1)),
  UNIQUE (pergunta_id, ordem),
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pergunta_tags (
  pergunta_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (pergunta_id, tag_id),
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pergunta_fontes (
  pergunta_id TEXT NOT NULL,
  fonte_id INTEGER NOT NULL,
  observacao TEXT,
  PRIMARY KEY (pergunta_id, fonte_id),
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (fonte_id) REFERENCES fontes(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS respostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id TEXT,
  sessao_id TEXT,
  pergunta_id TEXT NOT NULL,
  alternativa_id INTEGER,
  resposta_usuario INTEGER NOT NULL,
  correta INTEGER NOT NULL CHECK (correta IN (0,1)),
  tempo_ms INTEGER CHECK (tempo_ms IS NULL OR tempo_ms >= 0),
  respondida_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (alternativa_id) REFERENCES alternativas(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subtemas_tema ON subtemas(tema_id, ativo);
CREATE INDEX IF NOT EXISTS idx_perguntas_tema ON perguntas(tema);
CREATE INDEX IF NOT EXISTS idx_perguntas_ativas ON perguntas(ativa);
CREATE INDEX IF NOT EXISTS idx_perguntas_tema_ativa ON perguntas(tema, ativa, status);
CREATE INDEX IF NOT EXISTS idx_perguntas_subtema ON perguntas(subtema_id);
CREATE INDEX IF NOT EXISTS idx_perguntas_origem ON perguntas(origem_banca, origem_orgao, origem_ano, origem_cargo);
CREATE INDEX IF NOT EXISTS idx_alternativas_pergunta ON alternativas(pergunta_id, ordem);
CREATE INDEX IF NOT EXISTS idx_respostas_pergunta ON respostas(pergunta_id);
CREATE INDEX IF NOT EXISTS idx_respostas_usuario ON respostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_sessao ON respostas(sessao_id);
