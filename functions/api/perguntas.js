function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const tema = url.searchParams.get("tema");
    const limite = Math.min(Math.max(Number(url.searchParams.get("limite") || 40), 1), 100);

    const sql = tema
      ? `SELECT id,tema,pergunta,opcoes,explicacao,base,dificuldade FROM perguntas WHERE ativa=1 AND tema=? ORDER BY RANDOM() LIMIT ?`
      : `SELECT id,tema,pergunta,opcoes,explicacao,base,dificuldade FROM perguntas WHERE ativa=1 ORDER BY RANDOM() LIMIT ?`;
    const args = tema ? [tema, limite] : [limite];
    const { results = [] } = await env.DB.prepare(sql).bind(...args).all();

    const formatados = [];
    for (const p of results) {
      const alt = await env.DB.prepare(`SELECT id,ordem,texto FROM alternativas WHERE pergunta_id=? ORDER BY ordem`).bind(p.id).all();
      let opcoes = (alt.results || []).map(a => ({ id: a.id, texto: a.texto }));
      if (!opcoes.length && p.opcoes) {
        const legacy = typeof p.opcoes === "string" ? JSON.parse(p.opcoes) : p.opcoes;
        opcoes = legacy.map((texto, ordem) => ({ id: null, ordem, texto }));
      }
      formatados.push({ id:p.id, tema:p.tema, pergunta:p.pergunta, opcoes, explicacao:p.explicacao, base:p.base, dificuldade:p.dificuldade });
    }
    return json(formatados);
  } catch (e) {
    console.error("Erro ao carregar perguntas", e);
    return json({ error:"Erro interno ao carregar perguntas." }, 500);
  }
}
