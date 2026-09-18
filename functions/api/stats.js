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
  const { env } = context;

  try {
    const geral = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM perguntas WHERE ativa = 1"
    ).first();

    const temas = await env.DB.prepare(`
      SELECT
        p.tema AS id,
        COALESCE(t.nome, p.tema) AS categoria,
        COUNT(*) AS quantidade
      FROM perguntas p
      LEFT JOIN temas t ON t.id = p.tema
      WHERE p.ativa = 1
      GROUP BY p.tema, t.nome
      ORDER BY COALESCE(t.ordem, 999), categoria
    `).all();

    return json({
      total: geral?.total || 0,
      temas: temas.results || []
    });
  } catch (e) {
    console.error("Erro ao acessar o D1", e);
    return json({ error: "Erro interno ao acessar estatísticas." }, 500);
  }
}
