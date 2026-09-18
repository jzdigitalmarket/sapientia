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

function unauthorized() {
  return json({ error: "Acesso administrativo necessário." }, 401);
}

function hasAdminAccess(request, env) {
  const configuredToken = String(env.ADMIN_API_TOKEN || "");
  if (!configuredToken) return false;
  return request.headers.get("Authorization") === `Bearer ${configuredToken}`;
}

export async function onRequestPost({ env, request }) {
  try {
    // O cadastro permanece fechado até ADMIN_API_TOKEN ser configurado como
    // secret no Cloudflare Pages/Workers. Nunca exponha esse token no frontend.
    if (!hasAdminAccess(request, env)) return unauthorized();

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 50_000) {
      return json({ error: "Requisição muito grande." }, 413);
    }

    const rawBody = await request.text();
    if (rawBody.length > 50_000) {
      return json({ error: "Requisição muito grande." }, 413);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }

    const pergunta = String(body.pergunta || "").trim();
    const tema = String(body.tema || "").trim();
    const opcoes = Array.isArray(body.opcoes) ? body.opcoes.map(v => String(v).trim()) : [];
    const correta = Number(body.correta);
    const explicacao = String(body.explicacao || "").trim();
    const base = String(body.base || "").trim();

    const opcoesNormalizadas = opcoes.map(normalizeQuestion);
    const opcoesUnicas = new Set(opcoesNormalizadas);

    if (
      pergunta.length < 10 || pergunta.length > 5_000 ||
      !tema || tema.length > 100 ||
      opcoes.length < 2 || opcoes.length > 5 ||
      opcoes.some(opcao => !opcao || opcao.length > 2_000) ||
      opcoesUnicas.size !== opcoes.length ||
      !Number.isInteger(correta) || correta < 0 || correta >= opcoes.length ||
      explicacao.length > 10_000 || base.length > 5_000
    ) {
      return json({ error: "Dados inválidos." }, 400);
    }

    const temaExiste = await env.DB.prepare(
      "SELECT id FROM temas WHERE id = ? AND ativo = 1 LIMIT 1"
    ).bind(tema).first();

    if (!temaExiste) {
      return json({ error: "Tema inválido ou inativo." }, 400);
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
    console.error("Erro ao cadastrar questão", e);
    return json({ error: "Erro interno ao cadastrar questão." }, 500);
  }
}
