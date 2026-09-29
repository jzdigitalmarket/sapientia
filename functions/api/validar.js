function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}

export async function onRequestPost({env,request}){
  try{
    const body=await request.json();
    const id=String(body.id||"");
    const respostaUsuario=Number(body.respostaUsuario);
    const usuarioId=body.usuarioId?String(body.usuarioId).slice(0,128):null;
    const sessaoId=body.sessaoId?String(body.sessaoId).slice(0,128):null;
    const tempoMs=Number.isFinite(Number(body.tempoMs))?Math.max(0,Math.floor(Number(body.tempoMs))):null;
    if(!id||!Number.isInteger(respostaUsuario)) return json({error:"Dados inválidos."},400);

    const pergunta=await env.DB.prepare(`SELECT correta,explicacao,base,opcoes FROM perguntas WHERE id=? AND ativa=1`).bind(id).first();
    if(!pergunta) return json({error:"Pergunta não encontrada."},404);

    const alts=await env.DB.prepare(`SELECT id,ordem,texto,correta FROM alternativas WHERE pergunta_id=? ORDER BY ordem`).bind(id).all();
    let acertou=false, alternativaId=null, indiceCorreto=null;
    if((alts.results||[]).length){
      const escolhida=(alts.results||[]).find(a=>Number(a.ordem)===respostaUsuario);
      if(!escolhida) return json({error:"Resposta inválida."},400);
      acertou=Number(escolhida.correta)===1;
      alternativaId=escolhida.id;
      const correta=(alts.results||[]).find(a=>Number(a.correta)===1);
      indiceCorreto=correta?Number(correta.ordem):null;
    }else{
      const opcoes=typeof pergunta.opcoes==="string"?JSON.parse(pergunta.opcoes):pergunta.opcoes;
      if(!Array.isArray(opcoes)||respostaUsuario<0||respostaUsuario>=opcoes.length) return json({error:"Resposta inválida."},400);
      indiceCorreto=Number(pergunta.correta);
      acertou=indiceCorreto===respostaUsuario;
    }

    await env.DB.prepare(`INSERT INTO respostas(usuario_id,pergunta_id,resposta_usuario,correta) VALUES(?,?,?,?)`).bind(usuarioId,id,respostaUsuario,acertou?1:0).run();
    return json({correta:acertou,indiceCorreto,explicacao:pergunta.explicacao,base:pergunta.base});
  }catch(e){console.error("Erro ao validar resposta",e);return json({error:"Erro interno ao validar resposta."},500);}
}
