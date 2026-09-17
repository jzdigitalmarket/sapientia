function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const respostaUsuario = Number(body.respostaUsuario);

    if (!id || !Number.isInteger(respostaUsuario)) {
      return json({ error: "Dados inválidos." }, 400);
    }

    const pergunta = await env.DB.prepare(`
      SELECT correta, explicacao
      FROM perguntas
      WHERE id = ? AND ativa = 1
    `).bind(id).first();

    if (!pergunta) {
      return json({ error: "Pergunta não encontrada." }, 404);
    }

    return json({
      correta: Number(pergunta.correta) === respostaUsuario,
      explicacao: pergunta.explicacao
    });
  } catch (e) {
    return json({ error: "Erro ao validar resposta", details: e.message }, 500);
  }
}
