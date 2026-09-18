import fs from "node:fs";

const reportPath = "db/dedupe-report.json";
const seedPath = "db/seed.generated.sql";

for (const file of [reportPath, seedPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo gerado ausente: ${file}`);
  }
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const seed = fs.readFileSync(seedPath, "utf8");

if (!Number.isInteger(report.uniqueCount) || report.uniqueCount < 1) {
  throw new Error("O relatório não contém questões únicas válidas.");
}

if (report.auditPending !== 0 || (report.audit || []).length !== 0) {
  throw new Error(`Existem ${report.auditPending} questões pendentes de auditoria estrutural.`);
}

const forbiddenStatements = [
  /\bDELETE\s+FROM\s+respostas\b/i,
  /\bDELETE\s+FROM\s+perguntas\b/i,
  /\bDELETE\s+FROM\s+temas\b/i,
  /\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:respostas|perguntas|temas)\b/i,
];

if (forbiddenStatements.some((pattern) => pattern.test(seed))) {
  throw new Error("O seed contém operação destrutiva sobre dados persistentes.");
}

const insertedIds = [...seed.matchAll(/^INSERT INTO perguntas .* VALUES \('((?:''|[^'])+)'/gm)]
  .map((match) => match[1].replace(/''/g, "'"));
const duplicateIds = [...new Set(insertedIds.filter((id, index) => insertedIds.indexOf(id) !== index))];
if (duplicateIds.length > 0) {
  throw new Error(`IDs de questões duplicados no seed: ${duplicateIds.join(", ")}`);
}
const insertCount = (seed.match(/^INSERT INTO perguntas .* VALUES \(/gm) || []).length;
if (insertCount !== report.uniqueCount) {
  throw new Error(
    `Quantidade divergente: ${insertCount} INSERTs para ${report.uniqueCount} questões únicas.`
  );
}

const questionUpsertCount = (seed.match(/origem_url=excluded\.origem_url,atualizado_em=CURRENT_TIMESTAMP;/g) || []).length;
if (questionUpsertCount !== report.uniqueCount) {
  throw new Error(`UPSERTs divergentes: ${questionUpsertCount} para ${report.uniqueCount} questões únicas.`);
}

if (!seed.includes("BEGIN TRANSACTION;") || !seed.includes("COMMIT;")) {
  throw new Error("O seed não está protegido por uma transação completa.");
}

console.log(JSON.stringify({
  valid: true,
  nonDestructive: true,
  uniqueQuestions: report.uniqueCount,
  officialQuestions: report.officialCount,
  removedDuplicates: report.removedAsDuplicates
}, null, 2));
