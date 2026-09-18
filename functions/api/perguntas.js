function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const tema = url.searchParams.get("tema");
    const limite = Math.min(Math.max(Number(url.searchParams.get("limite") || 100), 1), 500);

    let stmt;
    if (tema) {
      stmt = env.DB.prepare(`
        SELECT id, tema, pergunta, opcoes, explicacao, base, dificuldade
        FROM perguntas
        WHERE ativa = 1 AND tema = ?
        ORDER BY RANDOM()
        LIMIT ?
      `).bind(tema, limite);
    } else {
      stmt = env.DB.prepare(`
        SELECT id, tema, pergunta, opcoes, explicacao, base, dificuldade
        FROM perguntas
        WHERE ativa = 1
        ORDER BY tema, id
        LIMIT ?
      `).bind(limite);
    }

    const { results } = await stmt.all();
    const formatados = results.map(p => ({
      ...p,
      opcoes: typeof p.opcoes === "string" ? JSON.parse(p.opcoes) : p.opcoes
    }));

    return json(formatados);
  } catch (e) {
    console.error("Erro ao carregar perguntas", e);
    return json({ error: "Erro interno ao carregar perguntas." }, 500);
  }
}
