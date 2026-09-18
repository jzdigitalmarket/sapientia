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

const unique = [...byKey.values()].sort((a, b) =>
  String(a.theme).localeCompare(String(b.theme), "pt-BR", { numeric: true }) ||
  String(a.id).localeCompare(String(b.id), "pt-BR", { numeric: true })
);

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

let sql = "-- GERADO por tools/build-d1-seed.mjs\nPRAGMA foreign_keys = ON;\nBEGIN TRANSACTION;\n\n";
sql += "DELETE FROM respostas;\nDELETE FROM perguntas;\nDELETE FROM temas;\n\n";
for (const [id,nome,ordem] of themes) {
  sql += `INSERT INTO temas (id,nome,ordem,ativo) VALUES ('${id}','${esc(nome)}',${ordem},1);\n`;
}
sql += "\n";

for (const q of unique) {
  sql += `INSERT INTO perguntas (id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base,dificuldade,ativa) VALUES (` +
    `'${esc(q.id)}','${esc(q.theme)}','${esc(q.q)}','${esc(q.normalized)}','${esc(JSON.stringify(q.options))}',${q.correctIndex},'${esc(q.explanation || "")}','${esc(q.basis || "")}',2,1);\n`;
}
sql += "\nCOMMIT;\n";

fs.mkdirSync("db", { recursive: true });
fs.writeFileSync("db/seed.generated.sql", sql);
fs.writeFileSync("db/dedupe-report.json", JSON.stringify({
  sourceCount: data.length,
  uniqueCount: unique.length,
  removedAsDuplicates: discarded.length,
  auditPending: audit.length,
  discarded,
  audit,
}, null, 2));

console.log(JSON.stringify({
  sourceCount: data.length,
  uniqueCount: unique.length,
  removedAsDuplicates: discarded.length,
  auditPending: audit.length,
}, null, 2));


// Importações oficiais adicionais
if (fs.existsSync("db/imports/fepese-itajai-2020-vm1-questoes.json")) {
  const official = JSON.parse(fs.readFileSync("db/imports/fepese-itajai-2020-vm1-questoes.json","utf8"));
  for (const q of official.questions || []) {
    if (q.anulada) continue;
    const idx = "ABCDE".indexOf(String(q.gabarito || "").toUpperCase());
    if (idx < 0 || idx >= (q.options || []).length) continue;
    const text = q.context ? q.q + "\n\nContexto:\n" + q.context : q.q;
    const normalized = normalizeText(text);
    if (byKey.has(normalized)) continue;
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
