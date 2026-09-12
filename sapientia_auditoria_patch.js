/* Sapientia — correções auditadas do banco de questões.
   Este arquivo foi criado na branch audit/fix-question-bank.
   Deve ser carregado após o script que declara const DATA.
*/
(() => {
  if (typeof DATA === "undefined" || !Array.isArray(DATA)) {
    console.error("[Sapientia Audit] DATA não encontrado.");
    return;
  }

  // 1) Impessoalidade — 4 variantes com gabarito incorreto.
  DATA.forEach((q) => {
    if (q.theme === "1" && /princípio da impessoalidade busca evitar/i.test(q.q || "")) {
      q.answer = "favorecimento pessoal ou perseguição";
      q.explanation = "A impessoalidade exige atuação objetiva, voltada ao interesse público, sem favorecimentos, privilégios ou perseguições pessoais.";
    }

    // 2) Publicidade — 4 variantes com gabarito incorreto.
    if (q.theme === "1" && /publicidade, como princípio administrativo, relaciona-se principalmente/i.test(q.q || "")) {
      q.answer = "transparência e divulgação dos atos, ressalvadas hipóteses legais de sigilo";
      q.explanation = "A publicidade favorece a transparência e o controle da atuação administrativa, ressalvadas as hipóteses legais de sigilo.";
    }
  });

  // 3) Raciocínio Lógico — questão ambígua 8-new-33.
  // Para p=F e q=V, p∧q e p↔q eram simultaneamente falsas.
  const logic33 = DATA.find((q) => q.id === "8-new-33");
  if (logic33) {
    logic33.options = (logic33.options || []).map((opt) => opt === "p ∧ q" ? "~p ∧ q" : opt);
    logic33.answer = "p ↔ q";
    logic33.explanation = "Com p falsa e q verdadeira: ~p ∧ q é verdadeira; p ∨ q é verdadeira; p → q é verdadeira; p ↔ q é falsa; e a disjunção exclusiva é verdadeira. Assim, a única alternativa falsa é p ↔ q.";
  }

  // 4) Normalização de IDs duplicados sem alterar a primeira ocorrência.
  function hashText(text) {
    let h = 2166136261;
    const s = String(text || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  const seenIds = new Set();
  const renamedIds = [];
  DATA.forEach((q) => {
    const original = String(q.id || "").trim();
    if (!original) {
      q.id = `auto-${q.theme || "x"}-${hashText(q.q)}`;
      renamedIds.push({ from: "(vazio)", to: q.id, q: q.q });
      seenIds.add(q.id);
      return;
    }
    if (seenIds.has(original)) {
      let candidate = `${original}-${hashText(q.q)}`;
      let n = 2;
      while (seenIds.has(candidate)) candidate = `${original}-${hashText(q.q)}-${n++}`;
      q.id = candidate;
      renamedIds.push({ from: original, to: candidate, q: q.q });
    }
    seenIds.add(q.id);
  });

  // 5) Validação estrutural.
  const structuralIssues = [];
  const finalIds = new Set();
  DATA.forEach((q, index) => {
    const ref = q.id || `índice ${index}`;
    ["id", "theme", "q", "options", "answer", "explanation", "basis"].forEach((field) => {
      if (q[field] === undefined || q[field] === null || (typeof q[field] === "string" && !q[field].trim())) {
        structuralIssues.push({ level: "erro", ref, type: "campo ausente/vazio", field });
      }
    });

    if (!Array.isArray(q.options) || q.options.length < 2) {
      structuralIssues.push({ level: "erro", ref, type: "alternativas inválidas" });
      return;
    }

    if (!q.options.includes(q.answer)) {
      structuralIssues.push({ level: "erro", ref, type: "gabarito não existe entre as alternativas", answer: q.answer });
    }

    const normalizedOptions = q.options.map((x) => String(x).trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"));
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      structuralIssues.push({ level: "aviso", ref, type: "alternativas duplicadas" });
    }

    if (finalIds.has(q.id)) structuralIssues.push({ level: "erro", ref, type: "ID ainda duplicado" });
    finalIds.add(q.id);
  });

  // 6) Detector de famílias quase clonadas.
  function normalizeCloneText(text) {
    return String(text || "")
      .replace(/^Em uma situação prática,\s*/i, "")
      .replace(/^No contexto de uma repartição pública,\s*/i, "")
      .replace(/^Considerando a rotina administrativa,\s*/i, "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  const cloneMap = new Map();
  DATA.forEach((q) => {
    const key = `${q.theme}|${normalizeCloneText(q.q)}`;
    if (!cloneMap.has(key)) cloneMap.set(key, []);
    cloneMap.get(key).push(q.id);
  });
  const nearDuplicateGroups = [...cloneMap.values()].filter((ids) => ids.length > 1);

  window.SAPIENTIA_AUDIT = {
    totalQuestions: DATA.length,
    renamedIds,
    structuralIssues,
    nearDuplicateGroups
  };

  console.group("[Sapientia Audit] Resultado");
  console.log(`Questões no banco: ${DATA.length}`);
  console.log(`IDs renomeados: ${renamedIds.length}`, renamedIds);
  console.log(`Problemas estruturais: ${structuralIssues.length}`, structuralIssues);
  console.log(`Famílias quase clonadas: ${nearDuplicateGroups.length}`, nearDuplicateGroups);
  console.groupEnd();
})();
