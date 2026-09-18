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
      SELECT correta, explicacao, base, opcoes
      FROM perguntas
      WHERE id = ? AND ativa = 1
    `).bind(id).first();

    if (!pergunta) {
      return json({ error: "Pergunta não encontrada." }, 404);
    }

    const opcoes = typeof pergunta.opcoes === "string"
      ? JSON.parse(pergunta.opcoes)
      : pergunta.opcoes;

    if (!Array.isArray(opcoes) || respostaUsuario < 0 || respostaUsuario >= opcoes.length) {
      return json({ error: "Resposta inválida." }, 400);
    }

    return json({
      correta: Number(pergunta.correta) === respostaUsuario,
      explicacao: pergunta.explicacao,
      base: pergunta.base
    });
  } catch (e) {
    console.error("Erro ao validar resposta", e);
    return json({ error: "Erro interno ao validar resposta." }, 500);
  }
}
