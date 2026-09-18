import json
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parent.parent
schema = (root / "db/schema.sql").read_text(encoding="utf-8")
seed = (root / "db/seed.generated.sql").read_text(encoding="utf-8")
report = json.loads((root / "db/dedupe-report.json").read_text(encoding="utf-8"))

db = sqlite3.connect(":memory:")
db.executescript(schema)
db.executescript(seed)

expected = report["uniqueCount"]
questions = db.execute("SELECT COUNT(*) FROM perguntas").fetchone()[0]
if questions != expected:
    raise RuntimeError(f"Banco contém {questions} questões; relatório declara {expected}.")

question_id = db.execute("SELECT id FROM perguntas ORDER BY id LIMIT 1").fetchone()[0]
db.execute(
    "INSERT INTO respostas (usuario_id, pergunta_id, resposta_usuario, correta) VALUES (?, ?, ?, ?)",
    ("seed-integrity-test", question_id, 0, 0),
)
db.commit()
responses_before = db.execute("SELECT COUNT(*) FROM respostas").fetchone()[0]

db.executescript(seed)
db.executescript(seed)
responses_after = db.execute("SELECT COUNT(*) FROM respostas").fetchone()[0]
questions_after = db.execute("SELECT COUNT(*) FROM perguntas").fetchone()[0]

if responses_after != responses_before:
    raise RuntimeError("Reaplicar o seed alterou ou removeu respostas existentes.")
if questions_after != expected:
    raise RuntimeError(f"Reaplicação resultou em {questions_after} questões; esperado: {expected}.")

print(json.dumps({
    "valid": True,
    "questions": questions_after,
    "responsesPreserved": responses_after,
    "reapplications": 2,
}, ensure_ascii=False, indent=2))
