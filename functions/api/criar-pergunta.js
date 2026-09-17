function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function normalizeQuestion(s) {
  return String(s || "")
    .trim()
    .replace(/^em uma situação prática,\s*/i, "")
    .replace(/^no contexto de uma repartição pública,\s*/i, "")
    .replace(/^considerando a rotina administrativa,\s*/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"'‘’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const pergunta = String(body.pergunta || "").trim();
    const tema = String(body.tema || "").trim();
    const opcoes = Array.isArray(body.opcoes) ? body.opcoes.map(v => String(v).trim()) : [];
    const correta = Number(body.correta);
    const explicacao = String(body.explicacao || "").trim();
    const base = String(body.base || "").trim();

    if (!pergunta || !tema || opcoes.length < 2 || !Number.isInteger(correta) || correta < 0 || correta >= opcoes.length) {
      return json({ error: "Dados inválidos." }, 400);
    }

    const normalizada = normalizeQuestion(pergunta);
    const existente = await env.DB.prepare(
      "SELECT id, pergunta FROM perguntas WHERE pergunta_normalizada = ? LIMIT 1"
    ).bind(normalizada).first();

    if (existente) {
      return json({ error: "Questão duplicada.", duplicateOf: existente }, 409);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO perguntas
      (id, tema, pergunta, pergunta_normalizada, opcoes, correta, explicacao, base, dificuldade, ativa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2, 1)
    `).bind(id, tema, pergunta, normalizada, JSON.stringify(opcoes), correta, explicacao, base).run();

    return json({ ok: true, id }, 201);
  } catch (e) {
    return json({ error: "Erro ao cadastrar questão", details: e.message }, 500);
  }
}
