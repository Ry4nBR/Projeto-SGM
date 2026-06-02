CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso VARCHAR(20) NOT NULL CHECK (nivel_acesso IN ('admin', 'tecnico', 'almoxarifado', 'usuario')),
    cargo VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo alguns usuários de teste baseados nas suas telas
INSERT INTO usuarios (matricula, nome, senha, nivel_acesso, cargo) VALUES
('1001', 'Admin SGM', '123456', 'admin', 'Administrador Geral'),
('2001', 'Carlos Silva', '123456', 'tecnico', 'Téc. Eletricista'),
('3001', 'João Almoxarife', '123456', 'almoxarifado', 'Auxiliar de Estoque'),
('4001', 'Wanderillo de Castro', '123456', 'usuario', 'Operador');

------------------------

-- 1. Criação da tabela de inventário de Máquinas
CREATE TABLE maquinas (
    codigo VARCHAR(20) PRIMARY KEY, -- Armazena 'MQ-01', 'MQ-02', etc.
    nome VARCHAR(150) NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserindo as máquinas padrões direto do seu HTML select options
INSERT INTO maquinas (codigo, nome) VALUES
('MQ-01', 'Máquina de Costura Reta Industrial'),
('MQ-02', 'Prensa Hidráulica de Solado'),
('MQ-03', 'Chanfradora de Couro'),
('MQ-04', 'Rebitadeira Semiautomática'),
('MQ-05', 'Esteira de Secagem e Colagem');

-- 3. Criação da tabela principal de Ordens de Serviço (OS)
CREATE TABLE ordens_servico (
    id SERIAL PRIMARY KEY,
    codigo_os VARCHAR(30) UNIQUE NOT NULL, -- Ex: OS-2026-102
    maquina_codigo VARCHAR(20) NOT NULL REFERENCES maquinas(codigo),
    setor VARCHAR(50) NOT NULL CHECK (setor IN ('Corte', 'Costura', 'Montagem', 'Acabamento')),
    especialidade VARCHAR(50) NOT NULL CHECK (especialidade IN ('Mecânica', 'Elétrica', 'Pneumática')),
    descricao_problema TEXT NOT NULL,
    condicao_maquina VARCHAR(20) NOT NULL CHECK (condicao_maquina IN ('restricao', 'parada')),
    criticidade VARCHAR(30) NOT NULL, -- Salva o valor calculado (Ex: 'Alta', 'Crítica')
    status VARCHAR(30) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Manutenção', 'Aguardando Peças', 'Finalizada')),
    
    -- Relacionamentos (Chaves Estrangeiras)
    usuario_solicitante_id INT NOT NULL REFERENCES usuarios(id), -- Quem abriu
    tecnico_atribuido_id INT REFERENCES usuarios(id), -- Quem vai consertar (começa NULL)
    
    -- Datas de controle do fluxo
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fechamento TIMESTAMP,
    
    -- Campo que o técnico vai preencher lá na frente
    parecer_tecnico TEXT
);

----------------------

-- 1. Tabela de Itens Cadastrados no Almoxarifado (Ferramentas e Peças)
CREATE TABLE itens_almoxarifado (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Ferramenta', 'Componente', 'Insumo')),
    estoque_atual INT DEFAULT 0 CHECK (estoque_atual >= 0)
);

-- Inserindo alguns itens de exemplo com base no cenário da sua fábrica
INSERT INTO itens_almoxarifado (nome, tipo, estoque_atual) VALUES
('Contator K1 de Potência', 'Componente', 15),
('Chave Allen 5mm', 'Ferramenta', 8),
('Multímetro Digital', 'Ferramenta', 5),
('Cabo Elétrico Flexível 2.5mm (Metro)', 'Insumo', 200),
('Graxa Grafitiada (Kg)', 'Insumo', 20);

-- 2. Tabela de Cabeçalho das Requisições da OS
CREATE TABLE requisicoes_materiais (
    id SERIAL PRIMARY KEY,
    ordem_servico_id INT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo_requisicao VARCHAR(30) NOT NULL CHECK (tipo_requisicao IN ('Kit Padrão', 'Avulso')),
    status_requisicao VARCHAR(30) DEFAULT 'Pendente' CHECK (status_requisicao IN ('Pendente', 'Liberado', 'Recusado')),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Itens Inclusos na Requisição (O carrinho de pedidos do Técnico)
-- Como o seu input do HTML é do tipo Texto Livre, permitimos salvar o nome digitado diretamente.
CREATE TABLE itens_requisicao (
    id SERIAL PRIMARY KEY,
    requisicao_id INT NOT NULL REFERENCES requisicoes_materiais(id) ON DELETE CASCADE,
    item_nome VARCHAR(100) NOT NULL, 
    quantidade INT NOT NULL CHECK (quantidade > 0)
);

------------------

-- 1. Refinando a tabela de itens para refletir perfeitamente a aba de Inventário
DROP TABLE IF EXISTS itens_almoxarifado CASCADE;

CREATE TABLE itens_almoxarifado (
    codigo VARCHAR(20) PRIMARY KEY, -- Armazena 'PE-0084', 'FE-0112', etc.
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Peça de Reposição', 'Kit Ferramentas', 'Ferramenta Avulsa')),
    qtd_atual INT DEFAULT 0 CHECK (qtd_atual >= 0),
    qtd_minima INT DEFAULT 0 CHECK (qtd_minima >= 0),
    localizacao VARCHAR(100) NOT NULL,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo os dados exatos demonstrados na sua tabela HTML de inventário
INSERT INTO itens_almoxarifado (codigo, nome, categoria, qtd_atual, qtd_minima, localizacao) VALUES
('PE-0084', 'Contator de Potência Siemens 24V', 'Peça de Reposição', 2, 5, 'Prateleira A1 - Gaveta 3'),
('FE-0112', 'Kit Padrão Mecânica Avançada #02', 'Kit Ferramentas', 0, 1, 'Carrinho Móvel 02'),
('FE-0340', 'Multímetro Digital Fluke 179', 'Ferramenta Avulsa', 4, 2, 'Armário Principal B'),
('PE-0912', 'Rolamento Blindado NSK 6204', 'Peça de Reposição', 14, 10, 'Prateleira C3');


-- 2. Tabela para Controle de Cautelas / Empréstimos de Ferramentas (Retornos pendentes)
CREATE TABLE controle_ferramental (
    id SERIAL PRIMARY KEY,
    codigo_retorno VARCHAR(20) UNIQUE NOT NULL, -- Ex: '#RET-849'
    requisicao_id INT REFERENCES requisicoes_materiais(id) ON DELETE CASCADE,
    tecnico_id INT NOT NULL REFERENCES usuarios(id),
    item_codigo VARCHAR(20) NOT NULL REFERENCES itens_almoxarifado(codigo),
    status_ativo VARCHAR(40) DEFAULT 'Em campo com técnico' CHECK (status_ativo IN ('Em campo com técnico', 'Devolvido', 'Danificado')),
    data_retirada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_devolucao TIMESTAMP,
    almoxarife_id INT REFERENCES usuarios(id) -- Quem validou a devolução
);


-- 3. Histórico de Entradas de Estoque (Aba 3 - Manual e Notas Fiscais XML)
CREATE TABLE entradas_estoque (
    id SERIAL PRIMARY KEY,
    tipo_entrada VARCHAR(20) NOT NULL CHECK (tipo_entrada IN ('Manual', 'XML NF-e')),
    chave_nfe VARCHAR(44), -- Chave de acesso única da Nota Fiscal caso seja via XML
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    almoxarife_id INT NOT NULL REFERENCES usuarios(id)
);

-- Itens vinculados à Nota Fiscal / Entrada Manual
CREATE TABLE itens_entrada_estoque (
    id SERIAL PRIMARY KEY,
    entrada_id INT NOT NULL REFERENCES entradas_estoque(id) ON DELETE CASCADE,
    item_codigo VARCHAR(20) NOT NULL REFERENCES itens_almoxarifado(codigo),
    quantidade INT NOT NULL CHECK (quantidade > 0)
);

-----------------------

-- O CASCADE garante que se outras tabelas dependerem de 'usuarios', elas não vão travar o comando
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(30) NOT NULL CHECK (cargo IN ('Administrador', 'Almoxarife', 'Técnico', 'Operador')),
    status_usuario VARCHAR(10) DEFAULT 'Ativo' CHECK (status_usuario IN ('Ativo', 'Inativo')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo os usuários de teste novamente
INSERT INTO usuarios (nome, email, senha, cargo) VALUES
('Marcos Souza', 'marcos@fabrica.com', 'senha123', 'Almoxarife'),
('Carlos Silva', 'carlos@fabrica.com', 'senha123', 'Técnico'),
('Wanderillo de Castro', 'wanderillo@fabrica.com', 'senha123', 'Operador');

-----------------

CREATE TABLE equipamentos (
    tag VARCHAR(20) PRIMARY KEY, -- Ex: 'MQ-02', 'IN-05'
    nome VARCHAR(100) NOT NULL,
    setor VARCHAR(50) NOT NULL, -- Ex: 'Montagem - Linha Bravo'
    critico BOOLEAN DEFAULT FALSE, -- Se a parada dela trava a fábrica
    status_equipamento VARCHAR(20) DEFAULT 'Operando' CHECK (status_equipamento IN ('Operando', 'Em Manutenção', 'Parado'))
);

INSERT INTO equipamentos (tag, nome, setor, critico) VALUES
('MQ-02', 'Prensa Hidráulica de Solado', 'Montagem - Linha Bravo', TRUE),
('EST-01', 'Esteira Alimentadora Principal', 'Montagem - Linha Bravo', FALSE);

---------------------

-- A) Cabeçalho do Kit (Criado pelo Administrador)
CREATE TABLE kits_padrao (
    id SERIAL PRIMARY KEY,
    nome_kit VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT
);

-- B) Itens que compõem o Kit (Ligando o Kit aos itens do Almoxarifado)
CREATE TABLE itens_composicao_kit (
    id SERIAL PRIMARY KEY,
    kit_id INT REFERENCES kits_padrao(id) ON DELETE CASCADE,
    item_codigo VARCHAR(20) REFERENCES itens_almoxarifado(codigo) ON DELETE CASCADE,
    quantidade_necessaria INT DEFAULT 1 CHECK (quantidade_necessaria > 0)
);

-- Exemplo de cadastro que o Administrador faria:
INSERT INTO kits_padrao (nome_kit, descricao) VALUES 
('Kit Elétrica Básica', 'Kit contendo ferramentas fundamentais para manutenção em painéis elétricos.');

-- Adicionando o Multímetro (FE-0340) ao Kit de Elétrica
INSERT INTO itens_composicao_kit (kit_id, item_codigo, quantidade_necessaria) VALUES 
(1, 'FE-0340', 1);

-------------

-- 1. Tabela Principal de Ordens de Serviço (OS)
DROP TABLE IF EXISTS ordens_servico CASCADE;

CREATE TABLE ordens_servico (
    id SERIAL PRIMARY KEY,
    codigo_os VARCHAR(30) UNIQUE NOT NULL, -- Irá armazenar o padrão 'OS-2026-102'
    equipamento_tag VARCHAR(20) NOT NULL REFERENCES equipamentos(tag) ON DELETE RESTRICT, -- Liga à máquina MQ-02
    tipo_falha VARCHAR(50) NOT NULL, -- Armazena 'Elétrica', 'Mecânica', 'Hidráulica', etc.
    descricao_problema TEXT NOT NULL, -- O texto longo digitado pelo operador
    solicitante_id INT NOT NULL REFERENCES usuarios(id), -- ID do Operador (Wanderillo)
    tecnico_id INT REFERENCES usuarios(id), -- ID do Técnico que assumiu (Carlos Silva)
    
    -- Status exatos permitidos no sistema (refletindo o select da sua tela)
    status_os VARCHAR(30) DEFAULT 'Aberta' CHECK (status_os IN ('Aberta', 'Em Manutenção', 'Impedida', 'Concluída', 'Cancelada')),
    
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 27/05/2026 às 09:15
    data_inicio_manutencao TIMESTAMP, -- Gravado quando o técnico clica para iniciar
    data_fechamento TIMESTAMP, -- Gravado ao clicar em "Encerrar Manutenção"
    diagnostico_tecnico TEXT -- Preenchido no encerramento da OS
);


-- 2. Tabela de Cabeçalho de Requisição de Materiais
-- (Quando o técnico clica em "Requisitar Itens Selecionados" na tela T_MinhasOS.html)
DROP TABLE IF EXISTS requisicoes_materiais CASCADE;

CREATE TABLE requisicoes_materiais (
    id SERIAL PRIMARY KEY,
    os_id INT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE, -- Vincula a requisição à OS específica
    tecnico_id INT NOT NULL REFERENCES usuarios(id), -- Quem está pedindo
    status_requisicao VARCHAR(30) DEFAULT 'Pendente' CHECK (status_requisicao IN ('Pendente', 'Liberado', 'Recusado')),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. Tabela de Itens da Requisição (Relação de itens solicitados para o Almoxarife separar)
DROP TABLE IF EXISTS itens_requisicao CASCADE;

CREATE TABLE itens_requisicao (
    id SERIAL PRIMARY KEY,
    requisicao_id INT NOT NULL REFERENCES requisicoes_materiais(id) ON DELETE CASCADE,
    item_codigo VARCHAR(20) REFERENCES itens_almoxarifado(codigo) ON DELETE SET NULL, -- Código da peça/ferramenta
    quantidade_solicitada INT DEFAULT 1 CHECK (quantidade_solicitada > 0),
    tipo_solicitacao VARCHAR(20) NOT NULL CHECK (tipo_solicitacao IN ('Avulso', 'Kit Padrão')) -- Conforme os botões do seu Front
);

----------------------

-- 1. Inserindo a máquina do seu print (caso não tenha inserido antes)
INSERT INTO equipamentos (tag, nome, setor, critico, status_equipamento) 
VALUES ('MQ-02', 'Prensa Hidráulica de Solado', 'Montagem - Linha Bravo', TRUE, 'Em Manutenção')
ON CONFLICT (tag) DO UPDATE SET status_equipamento = 'Em Manutenção';

-- 2. Simulando a abertura da OS #OS-2026-102 feita pelo operador Wanderillo (ID 3)
-- E assumida pelo técnico Carlos Silva (ID 2)
INSERT INTO ordens_servico (codigo_os, equipamento_tag, tipo_falha, descricao_problema, solicitante_id, tecnico_id, status_os, data_abertura)
VALUES (
    'OS-2026-102', 
    'MQ-02', 
    'Elétrica', 
    'A prensa parou no meio do ciclo de compressão. Painel digital piscando em vermelho apresentando erro de subtensão no circuito de potência. Máquina parada totalmente bloqueando a esteira alimentadora.', 
    3, -- ID do Wanderillo de Castro
    2, -- ID do Carlos Silva
    'Em Manutenção',
    '2026-05-27 09:15:00'
);

--------------

ALTER TABLE ordens_servico 
ALTER COLUMN status_os TYPE VARCHAR(50);

----------------

UPDATE ordens_servico 
SET status_os = 'Aguardando Devolução de Ferramentas' 
WHERE status_os = 'Aguardando Devolução de Kit';

-----------------

-- PASSO 1: Remove a restrição antiga para liberar o banco temporariamente
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_os_check;

-- PASSO 2: Força todas as OS que por acaso estejam com status estranhos ou vazios a voltarem para 'Aberta'
UPDATE ordens_servico 
SET status_os = 'Aberta' 
WHERE status_os NOT IN ('Aberta', 'Em Andamento', 'Aguardando Peças', 'Aguardando Devolução de Ferramentas', 'Concluído') 
   OR status_os IS NULL;

-- PASSO 3: Agora sim, aplica a nova regra com o banco limpo e alinhado com o seu Front-end
ALTER TABLE ordens_servico ADD CONSTRAINT ordens_servico_status_os_check 
CHECK (status_os IN ('Aberta', 'Em Andamento', 'Aguardando Peças', 'Aguardando Devolução de Ferramentas', 'Concluído'));





---------------------





CREATE SCHEMA "public";
CREATE TABLE "controle_ferramental" (
	"id" serial PRIMARY KEY,
	"codigo_retorno" varchar(20) NOT NULL CONSTRAINT "controle_ferramental_codigo_retorno_key" UNIQUE,
	"requisicao_id" integer,
	"tecnico_id" integer NOT NULL,
	"item_codigo" varchar(20) NOT NULL,
	"status_ativo" varchar(40) DEFAULT 'Em campo com técnico',
	"data_retirada" timestamp DEFAULT CURRENT_TIMESTAMP,
	"data_devolucao" timestamp,
	"almoxarife_id" integer,
	CONSTRAINT "controle_ferramental_status_ativo_check" CHECK (((status_ativo)::text = ANY ((ARRAY['Em campo com técnico'::character varying, 'Devolvido'::character varying, 'Danificado'::character varying])::text[])))
);

CREATE TABLE "entradas_estoque" (
	"id" serial PRIMARY KEY,
	"tipo_entrada" varchar(20) NOT NULL,
	"chave_nfe" varchar(44),
	"data_entrada" timestamp DEFAULT CURRENT_TIMESTAMP,
	"almoxarife_id" integer NOT NULL,
	CONSTRAINT "entradas_estoque_tipo_entrada_check" CHECK (((tipo_entrada)::text = ANY ((ARRAY['Manual'::character varying, 'XML NF-e'::character varying])::text[])))
);

CREATE TABLE "equipamentos" (
	"tag" varchar(20) PRIMARY KEY,
	"nome" varchar(100) NOT NULL,
	"setor" varchar(50) NOT NULL,
	"critico" boolean DEFAULT false,
	"status_equipamento" varchar(20) DEFAULT 'Operando',
	CONSTRAINT "equipamentos_status_equipamento_check" CHECK (((status_equipamento)::text = ANY ((ARRAY['Operando'::character varying, 'Em Manutenção'::character varying, 'Parado'::character varying])::text[])))
);

CREATE TABLE "itens_almoxarifado" (
	"codigo" varchar(20) PRIMARY KEY,
	"nome" varchar(150) NOT NULL,
	"categoria" varchar(50) NOT NULL,
	"qtd_atual" integer DEFAULT 0,
	"qtd_minima" integer DEFAULT 0,
	"localizacao" varchar(100) NOT NULL,
	"data_atualizacao" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "itens_almoxarifado_categoria_check" CHECK (((categoria)::text = ANY ((ARRAY['Peça de Reposição'::character varying, 'Kit Ferramentas'::character varying, 'Ferramenta Avulsa'::character varying])::text[]))),
	CONSTRAINT "itens_almoxarifado_qtd_atual_check" CHECK ((qtd_atual >= 0)),
	CONSTRAINT "itens_almoxarifado_qtd_minima_check" CHECK ((qtd_minima >= 0))
);

CREATE TABLE "itens_composicao_kit" (
	"id" serial PRIMARY KEY,
	"kit_id" integer,
	"item_codigo" varchar(20),
	"quantidade_necessaria" integer DEFAULT 1,
	CONSTRAINT "itens_composicao_kit_quantidade_necessaria_check" CHECK ((quantidade_necessaria > 0))
);

CREATE TABLE "itens_entrada_estoque" (
	"id" serial PRIMARY KEY,
	"entrada_id" integer NOT NULL,
	"item_codigo" varchar(20) NOT NULL,
	"quantidade" integer NOT NULL,
	CONSTRAINT "itens_entrada_estoque_quantidade_check" CHECK ((quantidade > 0))
);

CREATE TABLE "itens_requisicao" (
	"id" serial PRIMARY KEY,
	"requisicao_id" integer NOT NULL,
	"item_codigo" varchar(20),
	"quantidade_solicitada" integer DEFAULT 1,
	"tipo_solicitacao" varchar(20) NOT NULL,
	CONSTRAINT "itens_requisicao_quantidade_solicitada_check" CHECK ((quantidade_solicitada > 0)),
	CONSTRAINT "itens_requisicao_tipo_solicitacao_check" CHECK (((tipo_solicitacao)::text = ANY ((ARRAY['Avulso'::character varying, 'Kit Padrão'::character varying])::text[])))
);

CREATE TABLE "kits_padrao" (
	"id" serial PRIMARY KEY,
	"nome_kit" varchar(100) NOT NULL CONSTRAINT "kits_padrao_nome_kit_key" UNIQUE,
	"descricao" text
);

CREATE TABLE "maquinas" (
	"codigo" varchar(20) PRIMARY KEY,
	"nome" varchar(150) NOT NULL,
	"ativa" boolean DEFAULT true,
	"data_cadastro" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ordens_servico" (
	"id" serial PRIMARY KEY,
	"codigo_os" varchar(30) NOT NULL CONSTRAINT "ordens_servico_codigo_os_key" UNIQUE,
	"equipamento_tag" varchar(20) NOT NULL,
	"tipo_falha" varchar(50) NOT NULL,
	"descricao_problema" text NOT NULL,
	"solicitante_id" integer NOT NULL,
	"tecnico_id" integer,
	"status_os" varchar(50) DEFAULT 'Aberta',
	"data_abertura" timestamp DEFAULT CURRENT_TIMESTAMP,
	"data_inicio_manutencao" timestamp,
	"data_fechamento" timestamp,
	"diagnostico_tecnico" text,
	CONSTRAINT "ordens_servico_status_os_check" CHECK (((status_os)::text = ANY ((ARRAY['Aberta'::character varying, 'Em Andamento'::character varying, 'Aguardando Peças'::character varying, 'Aguardando Devolução de Ferramentas'::character varying, 'Concluído'::character varying])::text[])))
);

CREATE TABLE "requisicoes_materiais" (
	"id" serial PRIMARY KEY,
	"os_id" integer NOT NULL,
	"tecnico_id" integer NOT NULL,
	"status_requisicao" varchar(30) DEFAULT 'Pendente',
	"data_solicitacao" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "requisicoes_materiais_status_requisicao_check" CHECK (((status_requisicao)::text = ANY ((ARRAY['Pendente'::character varying, 'Liberado'::character varying, 'Recusado'::character varying])::text[])))
);

CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY,
	"nome" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL CONSTRAINT "usuarios_email_key" UNIQUE,
	"senha" varchar(255) NOT NULL,
	"cargo" varchar(30) NOT NULL,
	"status_usuario" varchar(10) DEFAULT 'Ativo',
	"data_cadastro" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "usuarios_cargo_check" CHECK (((cargo)::text = ANY ((ARRAY['Administrador'::character varying, 'Almoxarife'::character varying, 'Técnico'::character varying, 'Operador'::character varying])::text[]))),
	CONSTRAINT "usuarios_status_usuario_check" CHECK (((status_usuario)::text = ANY ((ARRAY['Ativo'::character varying, 'Inativo'::character varying])::text[])))
);

CREATE UNIQUE INDEX "controle_ferramental_codigo_retorno_key" ON "controle_ferramental" ("codigo_retorno");
CREATE UNIQUE INDEX "controle_ferramental_pkey" ON "controle_ferramental" ("id");
CREATE UNIQUE INDEX "entradas_estoque_pkey" ON "entradas_estoque" ("id");
CREATE UNIQUE INDEX "equipamentos_pkey" ON "equipamentos" ("tag");
CREATE UNIQUE INDEX "itens_almoxarifado_pkey" ON "itens_almoxarifado" ("codigo");
CREATE UNIQUE INDEX "itens_composicao_kit_pkey" ON "itens_composicao_kit" ("id");
CREATE UNIQUE INDEX "itens_entrada_estoque_pkey" ON "itens_entrada_estoque" ("id");
CREATE UNIQUE INDEX "itens_requisicao_pkey" ON "itens_requisicao" ("id");
CREATE UNIQUE INDEX "kits_padrao_nome_kit_key" ON "kits_padrao" ("nome_kit");
CREATE UNIQUE INDEX "kits_padrao_pkey" ON "kits_padrao" ("id");
CREATE UNIQUE INDEX "maquinas_pkey" ON "maquinas" ("codigo");
CREATE UNIQUE INDEX "ordens_servico_codigo_os_key" ON "ordens_servico" ("codigo_os");
CREATE UNIQUE INDEX "ordens_servico_pkey" ON "ordens_servico" ("id");
CREATE UNIQUE INDEX "requisicoes_materiais_pkey" ON "requisicoes_materiais" ("id");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios" ("email");
CREATE UNIQUE INDEX "usuarios_pkey" ON "usuarios" ("id");
ALTER TABLE "controle_ferramental" ADD CONSTRAINT "controle_ferramental_item_codigo_fkey" FOREIGN KEY ("item_codigo") REFERENCES "itens_almoxarifado"("codigo");
ALTER TABLE "itens_composicao_kit" ADD CONSTRAINT "itens_composicao_kit_item_codigo_fkey" FOREIGN KEY ("item_codigo") REFERENCES "itens_almoxarifado"("codigo") ON DELETE CASCADE;
ALTER TABLE "itens_composicao_kit" ADD CONSTRAINT "itens_composicao_kit_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "kits_padrao"("id") ON DELETE CASCADE;
ALTER TABLE "itens_entrada_estoque" ADD CONSTRAINT "itens_entrada_estoque_entrada_id_fkey" FOREIGN KEY ("entrada_id") REFERENCES "entradas_estoque"("id") ON DELETE CASCADE;
ALTER TABLE "itens_entrada_estoque" ADD CONSTRAINT "itens_entrada_estoque_item_codigo_fkey" FOREIGN KEY ("item_codigo") REFERENCES "itens_almoxarifado"("codigo");
ALTER TABLE "itens_requisicao" ADD CONSTRAINT "itens_requisicao_item_codigo_fkey" FOREIGN KEY ("item_codigo") REFERENCES "itens_almoxarifado"("codigo") ON DELETE SET NULL;
ALTER TABLE "itens_requisicao" ADD CONSTRAINT "itens_requisicao_requisicao_id_fkey" FOREIGN KEY ("requisicao_id") REFERENCES "requisicoes_materiais"("id") ON DELETE CASCADE;
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_equipamento_tag_fkey" FOREIGN KEY ("equipamento_tag") REFERENCES "equipamentos"("tag") ON DELETE RESTRICT;
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id");
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id");
ALTER TABLE "requisicoes_materiais" ADD CONSTRAINT "requisicoes_materiais_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE;
ALTER TABLE "requisicoes_materiais" ADD CONSTRAINT "requisicoes_materiais_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id");