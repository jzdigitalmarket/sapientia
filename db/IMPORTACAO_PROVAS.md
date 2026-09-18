# Importação de provas oficiais

O banco Sapientia aceita questões oriundas de provas oficiais com metadados de origem.

Campos:
- origem_tipo: "prova-oficial"
- origem_banca
- origem_orgao
- origem_ano
- origem_cargo
- origem_numero
- origem_url

Fluxo recomendado:
1. Extrair enunciado e alternativas da prova.
2. Cruzar cada número com o gabarito definitivo.
3. Classificar por tema.
4. Normalizar o enunciado e verificar duplicidade.
5. Inserir apenas questões inéditas.
6. Preservar a origem para permitir filtros por banca, ano e concurso.

Para PDFs sem texto selecionável, usar inspeção visual/OCR apenas quando necessário.
