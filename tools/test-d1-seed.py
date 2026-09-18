import json
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parent.parent
schema = (root / "db/schema.sql").read_text(encoding="utf-8")
seed = (root / "db/seed.generated.sql").read_text(encoding="utf-8")
report = json.loads((root / "db/dedupe-report.json").read_text(encoding="utf-8"))
expected = report["uniqueCount"]

FIRST_TEXT = "No conjunto LIMPE, a letra I corresponde à"
FIRST_NORMALIZED = "no conjunto limpe a letra i corresponde a"
SECOND_TEXT = "Segundo o art. 37, caput, da Constituição Federal, os princípios expressamente aplicáveis à Administração Pública são:"
SECOND_NORMALIZED = "segundo o art 37 caput da constituicao federal os principios expressamente aplicaveis a administracao publica sao"

def new_db():
    db = sqlite3.connect(":memory:")
    db.executescript(schema)
    return db

def insert_theme(db):
    db.execute("INSERT INTO temas (id,nome,ordem,ativo) VALUES ('1','Administração',1,1)")

def insert_question(db, question_id, text, normalized):
    db.execute(
        "INSERT INTO perguntas (id,tema,pergunta,pergunta_normalizada,opcoes,correta,ativa) VALUES (?,?,?,?,?,0,1)",
        (question_id, "1", text, normalized, '["correta","incorreta"]'),
    )

def active_questions(db):
    return db.execute("SELECT COUNT(*) FROM perguntas WHERE ativa = 1").fetchone()[0]

# Instalação nova e reaplicação idempotente.
db = new_db()
db.executescript(seed)
question_id = db.execute("SELECT id FROM perguntas WHERE ativa = 1 ORDER BY id LIMIT 1").fetchone()[0]
db.execute("INSERT INTO respostas (usuario_id,pergunta_id,resposta_usuario,correta) VALUES (?,?,0,0)", ("fresh", question_id))
db.commit()
db.executescript(seed)
db.executescript(seed)
if active_questions(db) != expected:
    raise RuntimeError(f"Banco novo contém {active_questions(db)} questões ativas; esperado: {expected}.")
if db.execute("SELECT COUNT(*) FROM respostas WHERE usuario_id = 'fresh'").fetchone()[0] != 1:
    raise RuntimeError("Reaplicar o seed removeu uma resposta existente.")

# Migração a partir do PR #12: 1-2-1 já representa a segunda questão.
db12 = new_db()
insert_theme(db12)
insert_question(db12, "1-2-1", SECOND_TEXT, SECOND_NORMALIZED)
db12.execute("INSERT INTO respostas (usuario_id,pergunta_id,resposta_usuario,correta) VALUES ('pr12','1-2-1',0,1)")
db12.commit()
db12.executescript(seed)
row12 = db12.execute("SELECT r.pergunta_id,p.pergunta FROM respostas r JOIN perguntas p ON p.id=r.pergunta_id WHERE r.usuario_id='pr12'").fetchone()
if row12 != ("1-2-1", SECOND_TEXT):
    raise RuntimeError(f"Migração do PR #12 alterou o significado da resposta: {row12!r}")

# Migração a partir do PR #13 sem resposta no ID ambíguo: move a resposta
# inequívoca da segunda questão para o ID canônico.
db13 = new_db()
insert_theme(db13)
insert_question(db13, "1-2-1", FIRST_TEXT, FIRST_NORMALIZED)
insert_question(db13, "adm-pdf-001", SECOND_TEXT, SECOND_NORMALIZED)
db13.execute("INSERT INTO respostas (usuario_id,pergunta_id,resposta_usuario,correta) VALUES ('pr13-second','adm-pdf-001',0,1)")
db13.commit()
db13.executescript(seed)
second13 = db13.execute("SELECT r.pergunta_id,p.pergunta FROM respostas r JOIN perguntas p ON p.id=r.pergunta_id WHERE r.usuario_id='pr13-second'").fetchone()
if second13 != ("1-2-1", SECOND_TEXT):
    raise RuntimeError(f"Resposta da segunda questão não foi migrada corretamente: {second13!r}")
if active_questions(db13) != expected:
    raise RuntimeError(f"Migração do PR #13 resultou em {active_questions(db13)} questões ativas; esperado: {expected}.")

# Histórico sequencial ambíguo: o PR #12 recebeu uma resposta em 1-2-1 e,
# depois, o PR #13 trocou o enunciado associado ao mesmo ID. O seed precisa
# abortar antes de remapear essa resposta sem evidência suficiente.
db_sequence = new_db()
insert_theme(db_sequence)
insert_question(db_sequence, "1-2-1", SECOND_TEXT, SECOND_NORMALIZED)
db_sequence.execute("INSERT INTO respostas (usuario_id,pergunta_id,resposta_usuario,correta) VALUES ('sequential','1-2-1',0,1)")
db_sequence.execute(
    "UPDATE perguntas SET pergunta = ?, pergunta_normalizada = ? WHERE id = '1-2-1'",
    (FIRST_TEXT, FIRST_NORMALIZED),
)
insert_question(db_sequence, "adm-pdf-001", SECOND_TEXT, SECOND_NORMALIZED)
db_sequence.commit()
try:
    db_sequence.executescript(seed)
except sqlite3.IntegrityError:
    pass
else:
    raise RuntimeError("O seed deveria bloquear o histórico sequencial ambíguo.")

sequential_response = db_sequence.execute(
    "SELECT pergunta_id FROM respostas WHERE usuario_id = 'sequential'"
).fetchone()
if sequential_response != ("1-2-1",):
    raise RuntimeError(f"O bloqueio alterou a resposta ambígua: {sequential_response!r}")
migration_count = db_sequence.execute(
    "SELECT COUNT(*) FROM schema_migrations WHERE id = '001-stable-question-identities'"
).fetchone()[0]
if migration_count != 0:
    raise RuntimeError("A migração ambígua foi registrada apesar do rollback.")

print(json.dumps({
    "valid": True,
    "activeQuestions": expected,
    "freshReapplication": True,
    "pr12Migration": True,
    "pr13Migration": True,
    "sequentialHistoryBlocked": True,
    "responsesPreserved": True,
}, ensure_ascii=False, indent=2))
