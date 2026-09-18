// tools/build-d1-seed.mjs
// Executa localmente com Node 18+.
// Extrai questões do index.html e arquivos de expansão, remove duplicatas semânticas
// e gera db/seed.generated.sql.

import fs from "node:fs";
import vm from "node:vm";

const PREFIXES = [
  /^em uma situação prática,\s*/i,
  /^no contexto de uma repartição pública,\s*/i,
  /^considerando a rotina administrativa,\s*/i,
];

function stripPrefixes(s) {
  let out = String(s || "").trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of PREFIXES) {
      const next = out.replace(re, "");
      if (next !== out) {
        out = next.trim();
        changed = true;
      }
    }
  }
  return out;
}

function normalizeText(s) {
  return stripPrefixes(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"'‘’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s) {
  return String(s ?? "").replace(/'/g, "''");
}

function extractDataFromIndex(html) {
  const m = html.match(/const DATA\s*=\s*(\[[\s\S]*?\]);\s*\n\s*const THEMES/);
  if (!m) throw new Error("DATA não encontrado em index.html");
  return JSON.parse(m[1]);
}

function runExpansion(file, data) {
  const code = fs.readFileSync(file, "utf8");
  const sandbox = { DATA: data, window: {}, console: { info() {}, warn() {}, error() {} } };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
}

const data = extractDataFromIndex(fs.readFileSync("index.html", "utf8"));
for (const f of [
  "content_admin_publica_v2.js",
  "content_other_themes_v2.js",
  "content_all_themes_v3.js",
]) {
  if (fs.existsSync(f)) runExpansion(f, data);
}

const legacy = JSON.parse(fs.readFileSync("perguntas.json", "utf8"));
legacy.forEach((q, i) => {
  const options = q.opcoes || [];
  data.push({
    id: `legacy-pt-${String(i + 1).padStart(3, "0")}`,
    theme: "7",
    q: q.pergunta,
    options,
    answer: options[q.correta],
    explanation: q.explicacao || "",
    basis: "Banco legado perguntas.json",
  });
});

// Correções evidentes já detectadas pela própria explicação/base.
const FIXES = new Map([
  [
    normalizeText("A publicidade, como princípio administrativo, relaciona-se principalmente à"),
    "transparência e divulgação dos atos, ressalvadas hipóteses legais de sigilo",
  ],
  [
    normalizeText("O princípio da impessoalidade busca evitar que a atuação administrativa seja orientada por"),
    "favorecimento pessoal ou perseguição",
  ],
]);

const byKey = new Map();
const discarded = [];
const audit = [];

for (const q of data) {
  const baseQuestion = stripPrefixes(q.q);
  const key = normalizeText(baseQuestion);
  const options = Array.isArray(q.options) ? q.options.map(String) : [];

  if (!key || options.length < 2) {
    discarded.push({ id: q.id, reason: "questão inválida/incompleta" });
    continue;
  }

  let answer = q.answer;
  const fixed = FIXES.get(key);
  if (fixed && options.includes(fixed)) answer = fixed;

  let correctIndex = options.findIndex(o => o === answer);
  if (correctIndex < 0) {
    const normalizedAnswer = normalizeText(answer);
    correctIndex = options.findIndex(o => normalizeText(o) === normalizedAnswer);
  }

  if (correctIndex < 0) {
    audit.push({
      id: q.id,
      q: baseQuestion,
      issue: "gabarito não encontrado entre as alternativas",
      answer,
    });
    continue;
  }

  const candidate = {
    ...q,
    q: baseQuestion,
    options,
    answer: options[correctIndex],
    correctIndex,
    normalized: key,
  };

  if (!byKey.has(key)) {
    byKey.set(key, candidate);
    continue;
  }

  // Prefere a questão com fundamentação mais rica e maior conjunto de alternativas.
  const prev = byKey.get(key);
  const prevScore = (prev.basis?.length || 0) + (prev.explanation?.length || 0) + prev.options.length * 10;
  const newScore = (candidate.basis?.length || 0) + (candidate.explanation?.length || 0) + candidate.options.length * 10;
  if (newScore > prevScore) {
    discarded.push({ id: prev.id, duplicateOf: candidate.id, reason: "duplicata semântica" });
    byKey.set(key, candidate);
  } else {
    discarded.push({ id: candidate.id, duplicateOf: prev.id, reason: "duplicata semântica" });
  }
}

// Importações oficiais adicionais entram antes da geração do seed.
if (fs.existsSync("db/imports/fepese-itajai-2020-vm1-questoes.json")) {
  const official = JSON.parse(fs.readFileSync("db/imports/fepese-itajai-2020-vm1-questoes.json","utf8"));
  for (const q of official.questions || []) {
    if (q.anulada) continue;
    const idx = "ABCDE".indexOf(String(q.gabarito || "").toUpperCase());
    if (idx < 0 || idx >= (q.options || []).length) continue;

    const text = q.context ? q.q + "\n\nContexto:\n" + q.context : q.q;
    const normalized = normalizeText(text);

    if (byKey.has(normalized)) {
      discarded.push({
        id: `fepese-itajai-2020-vm1-q${String(q.n).padStart(2,"0")}`,
        duplicateOf: byKey.get(normalized).id,
        reason: "duplicata semântica de prova oficial"
      });
      continue;
    }

    byKey.set(normalized, {
      id: `fepese-itajai-2020-vm1-q${String(q.n).padStart(2,"0")}`,
      theme: String(q.tema),
      q: text,
      options: q.options,
      answer: q.options[idx],
      correctIndex: idx,
      explanation: "Gabarito definitivo FEPESE 2020.",
      basis: "Prova oficial FEPESE - Prefeitura de Itajaí/SC - 2020",
      normalized,
      origem: {
        tipo: "prova-oficial",
        banca: "FEPESE",
        orgao: "Prefeitura de Itajaí/SC",
        ano: 2020,
        cargo: "Agente em Atividades Administrativas",
        numero: q.n,
        url: official.source_url
      }
    });
  }
}

const unique = [...byKey.values()].sort((a, b) =>
  String(a.theme).localeCompare(String(b.theme), "pt-BR", { numeric: true }) ||
  String(a.id).localeCompare(String(b.id), "pt-BR", { numeric: true })
);

const questionsById = new Map();
for (const q of unique) {
  const previous = questionsById.get(String(q.id));
  if (previous) {
    throw new Error(`ID de questão duplicado: ${q.id} (${previous} / ${q.normalized})`);
  }
  questionsById.set(String(q.id), q.normalized);
}

const themes = [
  ["1","Fundamentos da Administração Pública",1],
  ["2","Rotinas Administrativas e Gestão de Documentos",2],
  ["3","Atendimento ao Público e Comunicação",3],
  ["4","Atividades de Apoio Administrativo e Logística",4],
  ["5","Informática Básica Aplicada ao Serviço Público",5],
  ["6","Legislação e Transparência",6],
  ["7","Língua Portuguesa",7],
  ["8","Raciocínio Lógico e Resolução de Problemas",8],
];

let sql = "-- GERADO por tools/build-d1-seed.mjs\nPRAGMA foreign_keys = ON;\n" +
  "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, aplicado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);\n" +
  "BEGIN TRANSACTION;\n\n";

// Migração única: mantém cada resposta ligada ao mesmo enunciado ao estabilizar os IDs.
const identityMigration = "001-stable-question-identities";
const firstQuestionNormalized = "no conjunto limpe a letra i corresponde a";
const migrationPending = `NOT EXISTS (SELECT 1 FROM schema_migrations WHERE id = '${identityMigration}')`;
const firstQuestionStillOnLegacyId = `EXISTS (SELECT 1 FROM perguntas WHERE id = '1-2-1' AND pergunta_normalizada = '${firstQuestionNormalized}')`;

sql += `INSERT INTO perguntas (id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base,dificuldade,ativa,origem_tipo,origem_banca,origem_orgao,origem_ano,origem_cargo,origem_numero,origem_url,criado_em,atualizado_em)
SELECT 'adm-base-limpe-i',tema,pergunta,'__migration__adm-base-limpe-i',opcoes,correta,explicacao,base,dificuldade,0,origem_tipo,origem_banca,origem_orgao,origem_ano,origem_cargo,origem_numero,origem_url,criado_em,CURRENT_TIMESTAMP
FROM perguntas WHERE id = '1-2-1' AND pergunta_normalizada = '${firstQuestionNormalized}' AND ${migrationPending}
ON CONFLICT(id) DO NOTHING;\n`;
sql += `UPDATE respostas SET pergunta_id = 'adm-base-limpe-i' WHERE pergunta_id = '1-2-1' AND ${firstQuestionStillOnLegacyId} AND ${migrationPending};\n`;
sql += `UPDATE respostas SET pergunta_id = '1-2-1' WHERE pergunta_id = 'adm-pdf-001' AND ${firstQuestionStillOnLegacyId} AND ${migrationPending};\n`;
sql += `UPDATE perguntas SET pergunta_normalizada = '__migration__adm-pdf-001', ativa = 0, atualizado_em = CURRENT_TIMESTAMP WHERE id = 'adm-pdf-001' AND ${firstQuestionStillOnLegacyId} AND ${migrationPending};\n`;
sql += `UPDATE perguntas SET pergunta_normalizada = '__migration__1-2-1', ativa = 0, atualizado_em = CURRENT_TIMESTAMP WHERE id = '1-2-1' AND pergunta_normalizada = '${firstQuestionNormalized}' AND ${migrationPending};\n`;
sql += `INSERT INTO schema_migrations (id) SELECT '${identityMigration}' WHERE ${migrationPending};\n\n`;

sql += "-- Atualização idempotente: preserva respostas e registros existentes.\n\n";

for (const [id,nome,ordem] of themes) {
  sql += `INSERT INTO temas (id,nome,ordem,ativo) VALUES ('${id}','${esc(nome)}',${ordem},1) ON CONFLICT(id) DO UPDATE SET nome=excluded.nome,ordem=excluded.ordem,ativo=excluded.ativo;\n`;
}
sql += "\n";

for (const q of unique) {
  const o = q.origem || {};
  sql += `INSERT INTO perguntas (id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base,dificuldade,ativa,origem_tipo,origem_banca,origem_orgao,origem_ano,origem_cargo,origem_numero,origem_url) VALUES (` +
    `'${esc(q.id)}','${esc(q.theme)}','${esc(q.q)}','${esc(q.normalized)}','${esc(JSON.stringify(q.options))}',${q.correctIndex},'${esc(q.explanation || "")}','${esc(q.basis || "")}',2,1,` +
    `${o.tipo ? "'" + esc(o.tipo) + "'" : "NULL"},${o.banca ? "'" + esc(o.banca) + "'" : "NULL"},${o.orgao ? "'" + esc(o.orgao) + "'" : "NULL"},${Number.isInteger(o.ano) ? o.ano : "NULL"},${o.cargo ? "'" + esc(o.cargo) + "'" : "NULL"},${Number.isInteger(o.numero) ? o.numero : "NULL"},${o.url ? "'" + esc(o.url) + "'" : "NULL"}) ON CONFLICT(id) DO UPDATE SET tema=excluded.tema,pergunta=excluded.pergunta,pergunta_normalizada=excluded.pergunta_normalizada,opcoes=excluded.opcoes,correta=excluded.correta,explicacao=excluded.explicacao,base=excluded.base,dificuldade=excluded.dificuldade,ativa=excluded.ativa,origem_tipo=excluded.origem_tipo,origem_banca=excluded.origem_banca,origem_orgao=excluded.origem_orgao,origem_ano=excluded.origem_ano,origem_cargo=excluded.origem_cargo,origem_numero=excluded.origem_numero,origem_url=excluded.origem_url,atualizado_em=CURRENT_TIMESTAMP;\n`;
}

sql += "\nCOMMIT;\n";

fs.mkdirSync("db", { recursive: true });
fs.writeFileSync("db/seed.generated.sql", sql);

const officialCount = unique.filter(q => q.origem?.tipo === "prova-oficial").length;
const report = {
  sourceCount: data.length,
  uniqueCount: unique.length,
  officialCount,
  removedAsDuplicates: discarded.length,
  auditPending: audit.length,
  discarded,
  audit
};

fs.writeFileSync("db/dedupe-report.json", JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
