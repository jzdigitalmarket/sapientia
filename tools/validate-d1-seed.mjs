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

const insertCount = (seed.match(/INSERT INTO perguntas/g) || []).length;
if (insertCount !== report.uniqueCount) {
  throw new Error(
    `Quantidade divergente: ${insertCount} INSERTs para ${report.uniqueCount} questões únicas.`
  );
}

if (!seed.includes("BEGIN TRANSACTION;") || !seed.includes("COMMIT;")) {
  throw new Error("O seed não está protegido por uma transação completa.");
}

console.log(JSON.stringify({
  valid: true,
  uniqueQuestions: report.uniqueCount,
  officialQuestions: report.officialCount,
  removedDuplicates: report.removedAsDuplicates
}, null, 2));
