import fs from "node:fs";

const src = JSON.parse(fs.readFileSync("db/imports/fepese-itajai-2020-vm1-questoes.json","utf8"));

function norm(s){
  return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[“”"'‘’]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
function esc(s){ return String(s??"").replace(/'/g,"''"); }
function letterIndex(l){ return "ABCDE".indexOf(l); }

let sql="-- FEPESE Itajaí 2020 VM1\n";
for(const q of src.questions){
  if(q.anulada) continue;
  const idx=letterIndex(q.gabarito);
  if(idx<0 || idx>=q.options.length) throw new Error("Gabarito inválido Q"+q.n);
  const id=`fepese-itajai-2020-vm1-q${String(q.n).padStart(2,"0")}`;
  sql += `INSERT OR IGNORE INTO perguntas (id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base,dificuldade,ativa,origem_tipo,origem_banca,origem_orgao,origem_ano,origem_cargo,origem_numero,origem_url) VALUES ('${id}','${esc(q.tema)}','${esc(q.q)}','${esc(norm(q.q))}','${esc(JSON.stringify(q.options))}',${idx},'Gabarito definitivo FEPESE 2020.','Prova oficial FEPESE - Prefeitura de Itajaí/SC - 2020',2,1,'prova-oficial','FEPESE','Prefeitura de Itajaí/SC',2020,'Agente em Atividades Administrativas',${q.n},'${esc(src.source_url)}');\n`;
}
fs.writeFileSync("db/imports/fepese-itajai-2020-vm1.sql",sql);
console.log(`Geradas ${src.questions.filter(q=>!q.anulada).length} inserções; anuladas ignoradas: ${src.questions.filter(q=>q.anulada).map(q=>q.n).join(", ")}; ausentes: ${src.missing_question_numbers.join(", ")}`);
