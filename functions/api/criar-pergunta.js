function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function normalizeQuestion(s){return String(s||"").trim().replace(/^em uma situação prática,\s*/i,"").replace(/^no contexto de uma repartição pública,\s*/i,"").replace(/^considerando a rotina administrativa,\s*/i,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[“”"'‘’]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();}
function hasAdminAccess(request,env){const token=String(env.ADMIN_API_TOKEN||"");return !!token&&request.headers.get("Authorization")===`Bearer ${token}`;}
export async function onRequestPost({env,request}){
 try{
  if(!hasAdminAccess(request,env)) return json({error:"Acesso administrativo necessário."},401);
  const raw=await request.text(); if(raw.length>50000)return json({error:"Requisição muito grande."},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:"JSON inválido."},400);}
  const pergunta=String(body.pergunta||"").trim(),tema=String(body.tema||"").trim();
  const opcoes=Array.isArray(body.opcoes)?body.opcoes.map(v=>String(v).trim()):[];
  const correta=Number(body.correta),explicacao=String(body.explicacao||"").trim(),base=String(body.base||"").trim();
  const dificuldade=Number.isInteger(Number(body.dificuldade))?Number(body.dificuldade):2;
  if(pergunta.length<10||pergunta.length>5000||!tema||opcoes.length<2||opcoes.length>5||opcoes.some(o=>!o||o.length>2000)||new Set(opcoes.map(normalizeQuestion)).size!==opcoes.length||!Number.isInteger(correta)||correta<0||correta>=opcoes.length||dificuldade<1||dificuldade>3)return json({error:"Dados inválidos."},400);
  if(!await env.DB.prepare("SELECT id FROM temas WHERE id=? AND ativo=1").bind(tema).first())return json({error:"Tema inválido ou inativo."},400);
  const normalizada=normalizeQuestion(pergunta);
  const existente=await env.DB.prepare("SELECT id,pergunta FROM perguntas WHERE pergunta_normalizada=? LIMIT 1").bind(normalizada).first();
  if(existente)return json({error:"Questão duplicada.",duplicateOf:existente},409);
  const id=crypto.randomUUID();
  const stmts=[env.DB.prepare(`INSERT INTO perguntas(id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base,dificuldade,ativa) VALUES(?,?,?,?,?,?,?,?,?,1)`).bind(id,tema,pergunta,normalizada,JSON.stringify(opcoes),correta,explicacao,base,dificuldade)];
  opcoes.forEach((texto,ordem)=>stmts.push(env.DB.prepare(`INSERT INTO alternativas(pergunta_id,ordem,texto,correta) VALUES(?,?,?,?)`).bind(id,ordem,texto,ordem===correta?1:0)));
  await env.DB.batch(stmts);
  return json({ok:true,id},201);
 }catch(e){console.error("Erro ao cadastrar questão",e);return json({error:"Erro interno ao cadastrar questão."},500);}
}
