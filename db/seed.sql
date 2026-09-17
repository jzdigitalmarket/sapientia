-- Seed inicial e migração assistida.
-- Observação: o front-end atual ainda contém questões embutidas.
-- Este arquivo prepara o D1 para receber apenas questões únicas.

INSERT OR IGNORE INTO temas (id,nome,ordem) VALUES
('1','Fundamentos da Administração Pública',1),
('2','Rotinas Administrativas e Gestão de Documentos',2),
('3','Atendimento ao Público e Comunicação',3),
('4','Atividades de Apoio Administrativo e Logística',4),
('5','Informática Básica Aplicada ao Serviço Público',5),
('6','Legislação e Transparência',6),
('7','Língua Portuguesa',7),
('8','Raciocínio Lógico e Resolução de Problemas',8);

-- A carga de perguntas deve usar pergunta_normalizada.
-- Exemplo:
-- INSERT OR IGNORE INTO perguntas
-- (id,tema,pergunta,pergunta_normalizada,opcoes,correta,explicacao,base)
-- VALUES (...);
