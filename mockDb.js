// mockDb.js - Banco de Dados Simulado em LocalStorage para o SGM
// Desenvolvido para unificar as telas estáticas e simular dados reativos persistentes

const mockDb = {
  // Chaves de armazenamento no LocalStorage
  KEYS: {
    USUARIOS: "sgm_usuarios",
    EQUIPAMENTOS: "sgm_equipamentos",
    ITENS_ALMOXARIFADO: "sgm_itens_almoxarifado",
    KITS_PADRAO: "sgm_kits_padrao",
    ORDENS_SERVICO: "sgm_ordens_servico",
    REQUISICOES_MATERIAIS: "sgm_requisicoes_materiais",
    CONTROLE_FERRAMENTAL: "sgm_controle_ferramental",
    HISTORICO_MAQUINAS: "sgm_historico_maquinas",
    LOGGED_USER: "sgm_logged_user",
  },

  _readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`[SGM DB] Falha ao ler ${key}:`, error);
      return fallback;
    }
  },

  _writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  normalizarUsuario(usuario) {
    usuario.senha = usuario.senha || "";
    usuario.foto = usuario.foto || null;
    usuario.status_usuario = usuario.status_usuario || "Ativo";
    return usuario;
  },

  normalizarEquipamento(equipamento) {
    equipamento.fabricante = equipamento.fabricante || "";
    equipamento.modelo = equipamento.modelo || "";
    equipamento.numero_serie =
      equipamento.numero_serie || equipamento.num_serie || "";
    equipamento.data_aquisicao = equipamento.data_aquisicao || "";
    equipamento.nf = equipamento.nf || "";
    equipamento.descricao = equipamento.descricao || "";
    equipamento.status_operacional =
      equipamento.status_operacional ||
      equipamento.status_equipamento ||
      "Operando";
    equipamento.status_equipamento =
      equipamento.status_equipamento ||
      equipamento.status_operacional ||
      "Operando";
    equipamento.critico =
      typeof equipamento.critico === "boolean"
        ? equipamento.critico
        : ["Parado", "Em Manutenção"].includes(equipamento.status_equipamento);
    return equipamento;
  },

  normalizarItem(item) {
    item.descricao = item.descricao || "";
    item.nf_origem = item.nf_origem || "NF-Estoque-Inicial";
    item.status_operacional = item.status_operacional || "Disponível";
    if (!("qtd_atual" in item)) item.qtd_atual = 0;
    if (!("qtd_minima" in item)) item.qtd_minima = 1;
    item.localizacao = item.localizacao || "Não definida";
    item.categoria = item.categoria || "Peça de Reposição";
    return item;
  },

  normalizarKit(kit) {
    kit.descricao = kit.descricao || kit.desc || "";
    kit.maquina_vinculo =
      kit.maquina_vinculo || kit.maquina || "Uso Geral na Planta";
    kit.status = kit.status || "Disponível";

    if (!Array.isArray(kit.itens)) {
      const componentes = kit.ferramentas || kit.itens || "";
      if (typeof componentes === "string") {
        kit.itens = componentes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((nome) => ({ nome, qtd: 1, categoria: "Ferramenta/Peça" }));
      } else if (Array.isArray(componentes)) {
        kit.itens = componentes;
      } else {
        kit.itens = [];
      }
    }

    kit.itens = kit.itens.map((item) => {
      if (typeof item === "string") {
        return { nome: item, qtd: 1, categoria: "Ferramenta/Peça" };
      }
      return {
        nome: item.nome || item.codigo || item.item_nome || "Item sem nome",
        codigo: item.codigo || "",
        categoria: item.categoria || "Ferramenta/Peça",
        qtd: item.qtd || item.quantidade || 1,
      };
    });

    kit.ferramentas =
      kit.ferramentas ||
      kit.itens.map((item) => `${item.qtd}x ${item.nome}`).join(", ");
    return kit;
  },

  normalizarCriticidade(os, equipamentos = []) {
    const equipamento = equipamentos.find((e) => e.tag === os.equipamento_tag);
    if (!os.criticidade) {
      if (os.condicao_maquina === "baixa") {
        os.criticidade = "Baixa";
      } else if (os.condicao_maquina === "restricao") {
        os.criticidade = "Média";
      } else if (os.condicao_maquina === "parada") {
        os.criticidade = "Alta";
      } else if (equipamento && equipamento.critico) {
        os.criticidade = "Alta";
      } else {
        os.criticidade = "Média";
      }
    }
    if (!os.setor && equipamento) {
      os.setor = equipamento.setor;
    }
    return os;
  },

  normalizarRequisicao(requisicao) {
    requisicao.status_requisicao = requisicao.status_requisicao || "Pendente";
    if (!Array.isArray(requisicao.itens_solicitados)) {
      requisicao.itens_solicitados = [
        {
          nome: requisicao.item_nome || "Item não informado",
          qtd: 1,
          tipo: requisicao.tipo || "Item Avulso",
        },
      ];
    }
    return requisicao;
  },

  normalizarControleFerramental(controle) {
    controle.os_codigo = controle.os_codigo || "";
    controle.kit_nome =
      controle.kit_nome ||
      (controle.tipo === "Kit Completo" ? controle.item_nome : null);
    controle.status_ativo = controle.status_ativo || "Em campo com técnico";
    if (!Array.isArray(controle.itens_solicitados)) {
      controle.itens_solicitados = [
        {
          nome: controle.item_nome || "Item não informado",
          qtd: 1,
          tipo: controle.tipo || "Item Avulso",
        },
      ];
    }
    return controle;
  },

  migrate() {
    let usuarios = this._readJSON(this.KEYS.USUARIOS, []);
    usuarios = usuarios.map((u) => this.normalizarUsuario({ ...u }));
    this._writeJSON(this.KEYS.USUARIOS, usuarios);

    let equipamentos = this._readJSON(this.KEYS.EQUIPAMENTOS, []);
    equipamentos = equipamentos.map((e) =>
      this.normalizarEquipamento({ ...e }),
    );
    this._writeJSON(this.KEYS.EQUIPAMENTOS, equipamentos);

    let itens = this._readJSON(this.KEYS.ITENS_ALMOXARIFADO, []);
    itens = itens.map((i) => this.normalizarItem({ ...i }));
    this._writeJSON(this.KEYS.ITENS_ALMOXARIFADO, itens);

    let kits = this._readJSON(this.KEYS.KITS_PADRAO, []);
    kits = kits.map((k) => this.normalizarKit({ ...k }));
    this._writeJSON(this.KEYS.KITS_PADRAO, kits);

    let ordens = this._readJSON(this.KEYS.ORDENS_SERVICO, []);
    ordens = ordens.map((os) =>
      this.normalizarCriticidade({ ...os }, equipamentos),
    );
    this._writeJSON(this.KEYS.ORDENS_SERVICO, ordens);

    let requisicoes = this._readJSON(this.KEYS.REQUISICOES_MATERIAIS, []);
    requisicoes = requisicoes.map((r) => this.normalizarRequisicao({ ...r }));
    this._writeJSON(this.KEYS.REQUISICOES_MATERIAIS, requisicoes);

    let controles = this._readJSON(this.KEYS.CONTROLE_FERRAMENTAL, []);
    controles = controles.map((c) =>
      this.normalizarControleFerramental({ ...c }),
    );
    this._writeJSON(this.KEYS.CONTROLE_FERRAMENTAL, controles);

    const loggedUser = this._readJSON(this.KEYS.LOGGED_USER, null);
    if (loggedUser && typeof loggedUser === "object") {
      this._writeJSON(
        this.KEYS.LOGGED_USER,
        this.normalizarUsuario({ ...loggedUser }),
      );
    }
  },

  // Inicialização do Banco com dados padrões do arquivo bd.md e telas
  init() {
    // 1. USUÁRIOS
    if (!localStorage.getItem(this.KEYS.USUARIOS)) {
      const usuariosIniciais = [
        {
          id: 1,
          nome: "Marcos Souza",
          email: "marcos@fabrica.com",
          matricula: "3001",
          senha: "senha123",
          cargo: "Almoxarife",
          status_usuario: "Ativo",
        },
        {
          id: 2,
          nome: "Carlos Silva",
          email: "carlos@fabrica.com",
          matricula: "2001",
          senha: "senha123",
          cargo: "Técnico",
          status_usuario: "Ativo",
          especialidade: "Elétrica",
        },
        {
          id: 3,
          nome: "Wanderillo de Castro",
          email: "wanderillo@fabrica.com",
          matricula: "4001",
          senha: "senha123",
          cargo: "Operador",
          status_usuario: "Ativo",
        },
        {
          id: 4,
          nome: "Admin SGM",
          email: "admin@fabrica.com",
          matricula: "1001",
          senha: "123456",
          cargo: "Administrador",
          status_usuario: "Ativo",
        },
      ];
      localStorage.setItem(
        this.KEYS.USUARIOS,
        JSON.stringify(usuariosIniciais),
      );
    }

    // 2. EQUIPAMENTOS
    if (!localStorage.getItem(this.KEYS.EQUIPAMENTOS)) {
      const equipamentosIniciais = [
        {
          tag: "MQ-01",
          nome: "Máquina de Costura Reta Industrial",
          setor: "Costura",
          critico: false,
          status_equipamento: "Operando",
        },
        {
          tag: "MQ-02",
          nome: "Prensa Hidráulica de Solado",
          setor: "Montagem - Linha Bravo",
          critico: true,
          status_equipamento: "Em Manutenção",
        },
        {
          tag: "MQ-03",
          nome: "Chanfradora de Couro",
          setor: "Corte",
          critico: false,
          status_equipamento: "Operando",
        },
        {
          tag: "MQ-04",
          nome: "Rebitadeira Semiautomática",
          setor: "Montagem",
          critico: false,
          status_equipamento: "Operando",
        },
        {
          tag: "MQ-05",
          nome: "Esteira de Secagem e Colagem",
          setor: "Acabamento",
          critico: false,
          status_equipamento: "Operando",
        },
        {
          tag: "EST-01",
          nome: "Esteira Alimentadora Principal",
          setor: "Montagem - Linha Bravo",
          critico: true,
          status_equipamento: "Operando",
        },
      ];
      localStorage.setItem(
        this.KEYS.EQUIPAMENTOS,
        JSON.stringify(equipamentosIniciais),
      );
    }

    // 3. ITENS ALMOXARIFADO (INVENTÁRIO)
    if (!localStorage.getItem(this.KEYS.ITENS_ALMOXARIFADO)) {
      const itensIniciais = [
        {
          codigo: "PE-0084",
          nome: "Contator de Potência Siemens 24V",
          categoria: "Peça de Reposição",
          qtd_atual: 2,
          qtd_minima: 5,
          localizacao: "Prateleira A1 - Gaveta 3",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0112",
          nome: "Kit Padrão Mecânica Avançada #02",
          categoria: "Kit Ferramentas",
          qtd_atual: 0,
          qtd_minima: 1,
          localizacao: "Carrinho Móvel 02",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0340",
          nome: "Multímetro Digital Fluke 179",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 4,
          qtd_minima: 2,
          localizacao: "Armário Principal B",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0912",
          nome: "Rolamento Blindado NSK 6204",
          categoria: "Peça de Reposição",
          qtd_atual: 14,
          qtd_minima: 10,
          localizacao: "Prateleira C3",
          nf_origem: "NF-Estoque-Inicial",
        },

        // Ferramentas industriais sugeridas
        {
          codigo: "FE-0001",
          nome: "Chave combinada",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 12,
          qtd_minima: 4,
          localizacao: "Armário de Ferramentas A",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0002",
          nome: "Chave inglesa",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 8,
          qtd_minima: 2,
          localizacao: "Armário de Ferramentas A",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0003",
          nome: "Chave Allen",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 15,
          qtd_minima: 5,
          localizacao: "Painel Geral A2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0004",
          nome: "Alicate universal",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 10,
          qtd_minima: 3,
          localizacao: "Painel Geral A2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0005",
          nome: "Alicate de corte",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 10,
          qtd_minima: 3,
          localizacao: "Painel Geral A2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0006",
          nome: "Multímetro",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 5,
          qtd_minima: 2,
          localizacao: "Armário Elétrica B1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0007",
          nome: "Furadeira",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 3,
          qtd_minima: 1,
          localizacao: "Prateleira D1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0008",
          nome: "Parafusadeira",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 4,
          qtd_minima: 1,
          localizacao: "Prateleira D1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0009",
          nome: "Esmerilhadeira",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 3,
          qtd_minima: 1,
          localizacao: "Prateleira D2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0010",
          nome: "Martelo",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 8,
          qtd_minima: 2,
          localizacao: "Armário Geral C",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0011",
          nome: "Trena",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 20,
          qtd_minima: 5,
          localizacao: "Gaveteiro A1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0012",
          nome: "Paquímetro",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 6,
          qtd_minima: 2,
          localizacao: "Gaveteiro A1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "FE-0013",
          nome: "Torquímetro",
          categoria: "Ferramenta Avulsa",
          qtd_atual: 4,
          qtd_minima: 1,
          localizacao: "Gaveteiro A2",
          nf_origem: "NF-Estoque-Inicial",
        },

        // Peças industriais sugeridas
        {
          codigo: "PE-0001",
          nome: "Rolamentos",
          categoria: "Peça de Reposição",
          qtd_atual: 25,
          qtd_minima: 10,
          localizacao: "Gaveta C1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0002",
          nome: "Correias",
          categoria: "Peça de Reposição",
          qtd_atual: 15,
          qtd_minima: 5,
          localizacao: "Prateleira B3",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0003",
          nome: "Polias",
          categoria: "Peça de Reposição",
          qtd_atual: 10,
          qtd_minima: 3,
          localizacao: "Prateleira B4",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0004",
          nome: "Parafusos",
          categoria: "Peça de Reposição",
          qtd_atual: 100,
          qtd_minima: 20,
          localizacao: "Caixa Organizadora 1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0005",
          nome: "Porcas",
          categoria: "Peça de Reposição",
          qtd_atual: 100,
          qtd_minima: 20,
          localizacao: "Caixa Organizadora 2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0006",
          nome: "Arruelas",
          categoria: "Peça de Reposição",
          qtd_atual: 150,
          qtd_minima: 30,
          localizacao: "Caixa Organizadora 3",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0007",
          nome: "Sensores indutivos",
          categoria: "Peça de Reposição",
          qtd_atual: 8,
          qtd_minima: 3,
          localizacao: "Armário Sensores S1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0008",
          nome: "Sensores fotoelétricos",
          categoria: "Peça de Reposição",
          qtd_atual: 6,
          qtd_minima: 2,
          localizacao: "Armário Sensores S2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0009",
          nome: "Contatores",
          categoria: "Peça de Reposição",
          qtd_atual: 12,
          qtd_minima: 4,
          localizacao: "Prateleira Elétrica E1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0010",
          nome: "Relés",
          categoria: "Peça de Reposição",
          qtd_atual: 20,
          qtd_minima: 5,
          localizacao: "Prateleira Elétrica E2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0011",
          nome: "Fusíveis",
          categoria: "Peça de Reposição",
          qtd_atual: 50,
          qtd_minima: 15,
          localizacao: "Gaveta Elétrica G1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0012",
          nome: "Cabos elétricos",
          categoria: "Peça de Reposição",
          qtd_atual: 200,
          qtd_minima: 50,
          localizacao: "Suporte Carretel C1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0013",
          nome: "Mangueiras pneumáticas",
          categoria: "Peça de Reposição",
          qtd_atual: 100,
          qtd_minima: 20,
          localizacao: "Suporte Carretel C2",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0014",
          nome: "Válvulas",
          categoria: "Peça de Reposição",
          qtd_atual: 10,
          qtd_minima: 3,
          localizacao: "Gaveta Hidráulica H1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0015",
          nome: "Motores elétricos",
          categoria: "Peça de Reposição",
          qtd_atual: 2,
          qtd_minima: 1,
          localizacao: "Palete Chão D1",
          nf_origem: "NF-Estoque-Inicial",
        },
        {
          codigo: "PE-0016",
          nome: "Acoplamentos",
          categoria: "Peça de Reposição",
          qtd_atual: 6,
          qtd_minima: 2,
          localizacao: "Prateleira C2",
          nf_origem: "NF-Estoque-Inicial",
        },
      ];
      localStorage.setItem(
        this.KEYS.ITENS_ALMOXARIFADO,
        JSON.stringify(itensIniciais),
      );
    }

    // 4. KITS PADRÃO
    if (!localStorage.getItem(this.KEYS.KITS_PADRAO)) {
      const kitsIniciais = [
        {
          id: 1,
          nome_kit: "Kit Padrão Mecânica Avançada #01",
          maquina_vinculo: "Prensa MQ-02",
          ferramentas:
            'Jogo Chaves Allen, Chave Inglesa 10", Martelo de Retrocesso',
          status: "Disponível",
        },
        {
          id: 2,
          nome_kit: "Kit Padrão Mecânica Avançada #02",
          maquina_vinculo: "Prensa MQ-02",
          ferramentas:
            'Jogo Chaves Allen, Chave Inglesa 10", Alicate de Pressão',
          status: "Em uso na OS #102",
        },
        {
          id: 3,
          nome_kit: "Kit Calibração Elétrica Flash",
          maquina_vinculo: "Injetora MQ-09",
          ferramentas:
            "Multímetro Fluke 179, Alicate Amperímetro, Chaves Isoladas",
          status: "Disponível",
        },
      ];
      localStorage.setItem(this.KEYS.KITS_PADRAO, JSON.stringify(kitsIniciais));
    }

    // 5. ORDENS DE SERVIÇO (OS)
    if (!localStorage.getItem(this.KEYS.ORDENS_SERVICO)) {
      const osIniciais = [
        {
          id: 1,
          codigo_os: "OS-2026-102",
          equipamento_tag: "MQ-02",
          tipo_falha: "Elétrica",
          descricao_problema:
            "A prensa parou no meio do ciclo de compressão. Painel digital piscando em vermelho apresentando erro de subtensão no circuito de potência. Máquina parada totalmente bloqueando a esteira alimentadora.",
          solicitante_id: 3, // Wanderillo (Operador)
          tecnico_id: 2, // Carlos Silva (Técnico)
          status_os: "Em Andamento",
          criticidade: "Alta",
          data_abertura: "2026-05-27T09:15:00",
          data_inicio_manutencao: "2026-05-27T09:30:00",
          data_fechamento: null,
          diagnostico_tecnico: null,
        },
        {
          id: 2,
          codigo_os: "OS-2026-099",
          equipamento_tag: "MQ-05",
          tipo_falha: "Mecânica",
          descricao_problema:
            "Ruído excessivo e vibração anormal na esteira de transporte durante o processo de colagem. Suspeita de desalinhamento ou falha no rolamento motor.",
          solicitante_id: 3,
          tecnico_id: null,
          status_os: "Aberta",
          criticidade: "Alta",
          data_abertura: "2026-06-02T14:00:00",
          data_inicio_manutencao: null,
          data_fechamento: null,
          diagnostico_tecnico: null,
        },
        {
          id: 3,
          codigo_os: "OS-2026-101",
          equipamento_tag: "MQ-01",
          tipo_falha: "Mecânica",
          descricao_problema:
            "Lançadeira travando intermitentemente ao costurar materiais de maior gramatura (couro sintético). Agulha quebrando com frequência.",
          solicitante_id: 3,
          tecnico_id: null,
          status_os: "Aberta",
          criticidade: "Média",
          data_abertura: "2026-06-02T14:20:00",
          data_inicio_manutencao: null,
          data_fechamento: null,
          diagnostico_tecnico: null,
        },
      ];
      localStorage.setItem(
        this.KEYS.ORDENS_SERVICO,
        JSON.stringify(osIniciais),
      );
    }

    // 6. REQUISIÇÕES DE MATERIAIS
    if (!localStorage.getItem(this.KEYS.REQUISICOES_MATERIAIS)) {
      const requisicoesIniciais = [
        {
          id: 1,
          os_codigo: "OS-2026-102",
          tecnico_id: 2,
          tipo: "Kit Completo",
          item_nome: "Kit Padrão Mecânica Avançada #02",
          status_requisicao: "Pendente",
          data_solicitacao: "2026-05-27T09:35:00",
        },
        {
          id: 2,
          os_codigo: "OS-2026-102",
          tecnico_id: 2,
          tipo: "Item Avulso",
          item_nome: "Multímetro Digital Fluke 179",
          status_requisicao: "Pendente",
          data_solicitacao: "2026-05-27T09:40:00",
        },
      ];
      localStorage.setItem(
        this.KEYS.REQUISICOES_MATERIAIS,
        JSON.stringify(requisicoesIniciais),
      );
    }

    // 7. CONTROLE DE FERRAMENTAL (CAUTELA)
    if (!localStorage.getItem(this.KEYS.CONTROLE_FERRAMENTAL)) {
      const cautelasIniciais = [
        {
          id: 1,
          codigo_retorno: "#RET-849",
          tecnico_id: 2,
          item_codigo: "FE-0112", // Kit Mecânica 02
          item_nome: "Kit Padrão Mecânica Avançada #02",
          status_ativo: "Em campo com técnico",
          data_retirada: "2026-05-27T09:45:00",
          data_devolucao: null,
        },
      ];
      localStorage.setItem(
        this.KEYS.CONTROLE_FERRAMENTAL,
        JSON.stringify(cautelasIniciais),
      );
    }

    // 8. HISTÓRICO DAS MÁQUINAS (Para Adm_Historico e logs dinâmicos)
    if (!localStorage.getItem(this.KEYS.HISTORICO_MAQUINAS)) {
      const historicoInicial = {
        "MQ-01": {
          nome: "Injetora de Solados TR - Máquina MQ-01",
          total: "01 registro",
          logs: [
            {
              data: "25/05/2026 - 08:30",
              tipo: "Elétrica",
              tecnico: "Fernando Souza",
              pecas: ["Contator de Potência Siemens 24V"],
              relato:
                "Curto-circuito identificado na bobina do contator principal devido a oscilação de rede elétrica externa. Componente substituído por peça nova original do estoque e realizados testes de ciclo térmico na injeção. Equipamento operando sob carga normal.",
            },
          ],
        },
        "MQ-02": {
          nome: "Prensa de Vulcanização Hidráulica - Máquina MQ-02",
          total: "02 registros",
          logs: [
            {
              data: "18/05/2026 - 14:15",
              tipo: "Mecânica",
              tecnico: "Carlos Silva",
              pecas: ["Rolamento Blindado NSK 6204", "Anel de Vedação O-Ring"],
              relato:
                "Vazamento severo detectado no retentor do pistão hidráulico esquerdo causando queda brusca de pressão operacional. Realizado esgotamento parcial do óleo, troca do anel de vedação e do rolamento do eixo tracionador que apresentava desgaste prematuro.",
            },
            {
              data: "04/04/2026 - 10:00",
              tipo: "Elétrica",
              tecnico: "Fernando Souza",
              pecas: ["Nenhum (Ajuste de Parâmetro)"],
              relato:
                "Falha de comunicação intermitente reportada entre o CLP central e a IHM de comando da prensa. Constatado mau contato crônico no barramento físico de cabos de rede industrial. Limpeza de contatos executada com sucesso.",
            },
          ],
        },
        "MQ-03": {
          nome: "Estufa de Secagem de Colas Flash - Máquina MQ-03",
          total: "0 registros",
          logs: [],
        },
        "MQ-04": {
          nome: "Chanfradeira de Couros Eletrônica - Máquina MQ-04",
          total: "01 registro",
          logs: [
            {
              data: "12/05/2026 - 16:45",
              tipo: "Mecânica",
              tecnico: "Carlos Silva",
              pecas: ["Fita de Desgaste de Teflon", "Lâmina Circular 120mm"],
              relato:
                "Substituição preventiva da navalha de corte circular devido a perda de fio e rebarbas no chanfrado de peças delicadas. Ajustado o batente guia e calibrado o sensor de aproximação óptica.",
            },
          ],
        },
        "MQ-05": {
          nome: "Esteira de Secagem e Colagem - Máquina MQ-05",
          total: "0 registros",
          logs: [],
        },
        "EST-01": {
          nome: "Esteira Alimentadora Principal - EST-01",
          total: "0 registros",
          logs: [],
        },
      };
      localStorage.setItem(
        this.KEYS.HISTORICO_MAQUINAS,
        JSON.stringify(historicoInicial),
      );
    }

    // 9. SESSÃO DO USUÁRIO PADRÃO (se nenhum ativo, define baseado na página que está acessando)
    if (!localStorage.getItem(this.KEYS.LOGGED_USER)) {
      this.definirUsuarioPadraoPorRota();
    }

    this.migrate();
  },

  // Remove todos os dados do LocalStorage correspondentes ao SGM e recarrega
  reset() {
    Object.values(this.KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.init();
    alert("Banco de dados simulado reiniciado para o padrão de fábrica!");
    window.location.reload();
  },

  // Session Manager
  getLoggedUser() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.LOGGED_USER));
  },

  setLoggedUser(user) {
    localStorage.setItem(this.KEYS.LOGGED_USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.KEYS.LOGGED_USER);
    const prefix = this.getPathPrefix();
    window.location.href = prefix + "login.html";
  },

  // Define um usuário padrão se a pessoa acessa uma página interna sem fazer login
  definirUsuarioPadraoPorRota() {
    const path = window.location.pathname;
    const usuarios = JSON.parse(localStorage.getItem(this.KEYS.USUARIOS)) || [];

    let userPadrao = null;
    if (path.includes("/Administrador/")) {
      userPadrao = usuarios.find((u) => u.cargo === "Administrador");
    } else if (path.includes("/Almoxarifado/")) {
      userPadrao = usuarios.find((u) => u.cargo === "Almoxarife");
    } else if (path.includes("/Tecnico/")) {
      userPadrao = usuarios.find((u) => u.cargo === "Técnico");
    } else if (path.includes("/Usuario/")) {
      userPadrao = usuarios.find((u) => u.cargo === "Operador");
    }

    if (userPadrao) {
      this.setLoggedUser(userPadrao);
      console.log(
        `[SGM DB] Usuário simulado definido automaticamente: ${userPadrao.nome} (${userPadrao.cargo})`,
      );
    }
  },

  // Retorna prefixo de caminho dependendo de onde está
  getPathPrefix() {
    const path = window.location.pathname;
    if (
      path.includes("/Usuario/") ||
      path.includes("/Tecnico/") ||
      path.includes("/Almoxarifado/") ||
      path.includes("/Administrador/")
    ) {
      return "../";
    }
    return "./";
  },

  // --- OPERAÇÕES DA TABELA: USUARIOS ---
  getUsuarios() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.USUARIOS));
  },
  saveUsuario(usuario) {
    const usuarios = this.getUsuarios();
    usuario.id =
      usuarios.length > 0 ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    const usuarioSalvo = this.normalizarUsuario(usuario);
    usuarios.push(usuarioSalvo);
    this._writeJSON(this.KEYS.USUARIOS, usuarios);
    return usuarioSalvo;
  },
  updateUsuario(id, dados) {
    const usuarios = this.getUsuarios();
    const index = usuarios.findIndex((u) => u.id === parseInt(id));
    if (index !== -1) {
      usuarios[index] = this.normalizarUsuario({
        ...usuarios[index],
        ...dados,
      });
      this._writeJSON(this.KEYS.USUARIOS, usuarios);
      return usuarios[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: EQUIPAMENTOS ---
  getEquipamentos() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.EQUIPAMENTOS));
  },
  saveEquipamento(equipamento) {
    const equipamentos = this.getEquipamentos();
    const equipamentoSalvo = this.normalizarEquipamento(equipamento);
    equipamentos.push(equipamentoSalvo);
    this._writeJSON(this.KEYS.EQUIPAMENTOS, equipamentos);
    return equipamentoSalvo;
  },
  updateEquipamento(tag, dados) {
    const equipamentos = this.getEquipamentos();
    const index = equipamentos.findIndex((e) => e.tag === tag);
    if (index !== -1) {
      equipamentos[index] = this.normalizarEquipamento({
        ...equipamentos[index],
        ...dados,
      });
      this._writeJSON(this.KEYS.EQUIPAMENTOS, equipamentos);
      return equipamentos[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: ITENS ALMOXARIFADO ---
  getItensAlmoxarifado() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.ITENS_ALMOXARIFADO));
  },
  saveItemAlmoxarifado(item) {
    const itens = this.getItensAlmoxarifado();
    // Gerar código único se não fornecido
    if (!item.codigo) {
      const sufixo = String(itens.length + 1).padStart(4, "0");
      item.codigo =
        item.categoria === "Peça de Reposição"
          ? `PE-${sufixo}`
          : `FE-${sufixo}`;
    }
    const itemSalvo = this.normalizarItem(item);
    itens.push(itemSalvo);
    this._writeJSON(this.KEYS.ITENS_ALMOXARIFADO, itens);
    return itemSalvo;
  },
  updateItemAlmoxarifado(codigo, dados) {
    const itens = this.getItensAlmoxarifado();
    const index = itens.findIndex((i) => i.codigo === codigo);
    if (index !== -1) {
      itens[index] = this.normalizarItem({ ...itens[index], ...dados });
      this._writeJSON(this.KEYS.ITENS_ALMOXARIFADO, itens);
      return itens[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: KITS ---
  getKitsPadrao() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.KITS_PADRAO));
  },
  saveKitPadrao(kit) {
    const kits = this.getKitsPadrao();
    kit.id = kits.length > 0 ? Math.max(...kits.map((k) => k.id)) + 1 : 1;
    const kitSalvo = this.normalizarKit(kit);
    kits.push(kitSalvo);
    this._writeJSON(this.KEYS.KITS_PADRAO, kits);
    return kitSalvo;
  },

  // --- OPERAÇÕES DA TABELA: ORDENS DE SERVIÇO ---
  getOrdensServico() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.ORDENS_SERVICO));
  },
  saveOrdemServico(os) {
    const osList = this.getOrdensServico();
    const equipamentos = this.getEquipamentos();
    os.id = osList.length > 0 ? Math.max(...osList.map((o) => o.id)) + 1 : 1;

    // Gerador de código padrão OS-2026-X
    const proximoNumero =
      osList.length > 0
        ? Math.max(
            ...osList.map((o) => {
              const partes = o.codigo_os.split("-");
              return parseInt(partes[partes.length - 1]) || 100;
            }),
          ) + 1
        : 100;

    os.codigo_os = `OS-2026-${proximoNumero}`;
    os.data_abertura = new Date().toISOString();
    os.status_os = "Aberta";
    os.tecnico_id = null;
    os.diagnostico_tecnico = null;
    os = this.normalizarCriticidade(os, equipamentos);

    osList.push(os);
    this._writeJSON(this.KEYS.ORDENS_SERVICO, osList);
    return os;
  },
  updateOrdemServico(id, dados) {
    const osList = this.getOrdensServico();
    const equipamentos = this.getEquipamentos();
    const index = osList.findIndex(
      (o) => o.id === parseInt(id) || o.codigo_os === id,
    );
    if (index !== -1) {
      osList[index] = this.normalizarCriticidade(
        { ...osList[index], ...dados },
        equipamentos,
      );
      this._writeJSON(this.KEYS.ORDENS_SERVICO, osList);
      return osList[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: REQUISIÇÕES ---
  getRequisicoesMateriais() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.REQUISICOES_MATERIAIS));
  },
  saveRequisicao(req) {
    const requisicoes = this.getRequisicoesMateriais();
    req.id =
      requisicoes.length > 0
        ? Math.max(...requisicoes.map((r) => r.id)) + 1
        : 1;
    req.data_solicitacao = new Date().toISOString();
    req.status_requisicao = "Pendente";
    const reqSalva = this.normalizarRequisicao(req);

    requisicoes.push(reqSalva);
    this._writeJSON(this.KEYS.REQUISICOES_MATERIAIS, requisicoes);
    return reqSalva;
  },
  updateRequisicao(id, dados) {
    const requisicoes = this.getRequisicoesMateriais();
    const index = requisicoes.findIndex((r) => r.id === parseInt(id));
    if (index !== -1) {
      requisicoes[index] = this.normalizarRequisicao({
        ...requisicoes[index],
        ...dados,
      });
      this._writeJSON(this.KEYS.REQUISICOES_MATERIAIS, requisicoes);
      return requisicoes[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: CONTROLE DE FERRAMENTAL ---
  getControleFerramental() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.CONTROLE_FERRAMENTAL));
  },
  saveControleFerramental(cf) {
    const cfList = this.getControleFerramental();
    cf.id = cfList.length > 0 ? Math.max(...cfList.map((c) => c.id)) + 1 : 1;

    const numRandom = Math.floor(100 + Math.random() * 900);
    cf.codigo_retorno = `#RET-${numRandom}`;
    cf.data_retirada = new Date().toISOString();
    cf.status_ativo = "Em campo com técnico";
    const cfSalvo = this.normalizarControleFerramental(cf);

    cfList.push(cfSalvo);
    this._writeJSON(this.KEYS.CONTROLE_FERRAMENTAL, cfList);
    return cfSalvo;
  },
  updateControleFerramental(id, dados) {
    const cfList = this.getControleFerramental();
    const index = cfList.findIndex(
      (c) => c.id === parseInt(id) || c.codigo_retorno === id,
    );
    if (index !== -1) {
      cfList[index] = this.normalizarControleFerramental({
        ...cfList[index],
        ...dados,
      });
      this._writeJSON(this.KEYS.CONTROLE_FERRAMENTAL, cfList);
      return cfList[index];
    }
    return null;
  },

  // --- OPERAÇÕES DA TABELA: HISTÓRICO DE MÁQUINAS ---
  getHistoricoMaquinas() {
    this.init();
    return JSON.parse(localStorage.getItem(this.KEYS.HISTORICO_MAQUINAS));
  },
  addHistoricoLog(tag, log) {
    const historicos = this.getHistoricoMaquinas();
    if (!historicos[tag]) {
      // Se máquina não existir no histórico, cria
      const equipamentos = this.getEquipamentos();
      const eq = equipamentos.find((e) => e.tag === tag);
      historicos[tag] = {
        nome: eq ? `${eq.nome} - ${eq.tag}` : `Máquina ${tag}`,
        total: "0 registros",
        logs: [],
      };
    }

    historicos[tag].logs.unshift(log); // Insere no início
    const count = historicos[tag].logs.length;
    historicos[tag].total =
      count === 1
        ? "01 registro"
        : `${String(count).padStart(2, "0")} registros`;

    localStorage.setItem(
      this.KEYS.HISTORICO_MAQUINAS,
      JSON.stringify(historicos),
    );
    return historicos[tag];
  },

  // Injeta o Floating Developer HUD na tela automaticamente
  injectDeveloperHUD() {
    // Não exibe HUD se estiver na tela de login
    if (
      document.getElementById("view-profiles") ||
      window.location.pathname.endsWith("login.html") ||
      window.location.pathname === "/"
    ) {
      return;
    }

    const prefix = this.getPathPrefix();
    const loggedUser = this.getLoggedUser();

    // 1. Criar container do HUD
    const hud = document.createElement("div");
    hud.id = "sgm-developer-hud";
    hud.className = "sgm-hud-minimized";

    // 2. CSS do HUD (Glassmorphism elegante, com micro-animações e responsivo)
    const css = `
            #sgm-developer-hud {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(30, 41, 59, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                color: #FFFFFF;
                font-family: 'Inter', sans-serif;
                z-index: 999999;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
                width: auto;
                max-width: 320px;
            }
            #sgm-developer-hud.sgm-hud-minimized {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(30, 41, 59, 0.95);
            }
            #sgm-developer-hud.sgm-hud-minimized:hover {
                transform: scale(1.05);
                box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
            }
            .sgm-hud-toggle-btn {
                background: none;
                border: none;
                color: #60A5FA;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
            }
            .sgm-hud-content {
                display: none;
                padding: 16px;
                width: 280px;
            }
            #sgm-developer-hud.sgm-hud-expanded {
                border-radius: 16px;
            }
            #sgm-developer-hud.sgm-hud-expanded .sgm-hud-content {
                display: block;
            }
            #sgm-developer-hud.sgm-hud-expanded .sgm-hud-toggle-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 32px;
                height: 32px;
                color: #EF4444;
            }
            .sgm-hud-title {
                font-size: 14px;
                font-weight: 700;
                color: #60A5FA;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sgm-hud-subtitle {
                font-size: 11px;
                color: #94A3B8;
                margin-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 8px;
            }
            .sgm-hud-status {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                padding: 8px;
                font-size: 11px;
                margin-bottom: 12px;
            }
            .sgm-hud-status p { margin: 2px 0; }
            .sgm-hud-status strong { color: #38BDF8; }
            .sgm-hud-label {
                font-size: 11px;
                font-weight: 600;
                color: #94A3B8;
                margin-bottom: 6px;
                display: block;
            }
            .sgm-hud-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 12px;
            }
            .sgm-hud-btn {
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 6px;
                color: #93C5FD;
                font-size: 11px;
                font-weight: 500;
                padding: 6px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
            }
            .sgm-hud-btn:hover {
                background: rgba(59, 130, 246, 0.3);
                border-color: #60A5FA;
                color: #FFFFFF;
            }
            .sgm-hud-btn-danger {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #FCA5A5;
            }
            .sgm-hud-btn-danger:hover {
                background: rgba(239, 68, 68, 0.3);
                border-color: #F87171;
                color: #FFFFFF;
            }
            .sgm-hud-btn-inspect {
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #A7F3D0;
                grid-column: span 2;
            }
            .sgm-hud-btn-inspect:hover {
                background: rgba(16, 185, 129, 0.3);
                border-color: #34D399;
                color: #FFFFFF;
            }

            /* Modal de Inspeção */
            #sgm-inspect-modal {
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(8px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Inter', sans-serif;
            }
            .sgm-inspect-card {
                background: #1E293B;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                width: 90%;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                color: #E2E8F0;
                overflow: hidden;
            }
            .sgm-inspect-header {
                padding: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .sgm-inspect-header select {
                background: #0F172A;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: #E2E8F0;
                padding: 6px 12px;
                font-size: 13px;
                outline: none;
            }
            .sgm-inspect-body {
                padding: 16px;
                overflow-y: auto;
                flex: 1;
                background: #0F172A;
            }
            .sgm-inspect-body pre {
                margin: 0;
                font-family: monospace;
                font-size: 12px;
                color: #34D399;
                white-space: pre-wrap;
            }
            .sgm-inspect-close {
                background: none;
                border: none;
                color: #94A3B8;
                font-size: 20px;
                cursor: pointer;
            }
            .sgm-inspect-close:hover { color: #EF4444; }
        `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    // 3. Renderizar HUD
    hud.innerHTML = `
            <button class="sgm-hud-toggle-btn" id="sgm-hud-toggle">
                <!-- Ícone de Engrenagem -->
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
            </button>
            <div class="sgm-hud-content">
                <div class="sgm-hud-title">SGM DevHUD</div>
                <div class="sgm-hud-subtitle">Ferramentas de Simulação</div>

                <div class="sgm-hud-status">
                    <p>Perfil: <strong>${loggedUser ? loggedUser.nome : "Nenhum"}</strong></p>
                    <p>Função: <strong>${loggedUser ? loggedUser.cargo : "Nenhum"}</strong></p>
                </div>

                <span class="sgm-hud-label">Alternar Perfil Rápido:</span>
                <div class="sgm-hud-grid">
                    <button class="sgm-hud-btn" data-role="admin">Admin</button>
                    <button class="sgm-hud-btn" data-role="tecnico">Técnico</button>
                    <button class="sgm-hud-btn" data-role="almoxarifado">Almoxarife</button>
                    <button class="sgm-hud-btn" data-role="usuario">Operador</button>
                </div>

                <span class="sgm-hud-label">Ações Globais:</span>
                <div class="sgm-hud-grid">
                    <button class="sgm-hud-btn sgm-hud-btn-inspect" id="sgm-hud-inspect">Inspecionar LocalStorage</button>
                    <button class="sgm-hud-btn sgm-hud-btn-danger" id="sgm-hud-reset" style="grid-column: span 2;">Resetar Banco (localStorage)</button>
                </div>
            </div>
        `;

    document.body.appendChild(hud);

    // --- EVENTOS DO HUD ---
    const toggleBtn = document.getElementById("sgm-hud-toggle");

    // Minimizar e maximizar HUD
    toggleBtn.addEventListener("click", (e) => {
      if (hud.classList.contains("sgm-hud-minimized")) {
        hud.classList.remove("sgm-hud-minimized");
        hud.classList.add("sgm-hud-expanded");
      } else {
        // Se clicou na engrenagem propriamente
        if (e.target.closest("#sgm-hud-toggle")) {
          hud.classList.remove("sgm-hud-expanded");
          hud.classList.add("sgm-hud-minimized");
        }
      }
    });

    // Alternar Perfis
    const profileBtns = hud.querySelectorAll(".sgm-hud-btn[data-role]");
    profileBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const role = btn.getAttribute("data-role");
        const users = this.getUsuarios();

        let targetUser = null;
        let targetUrl = "";

        if (role === "admin") {
          targetUser = users.find((u) => u.cargo === "Administrador");
          targetUrl = "Administrador/Adm_Painel.html";
        } else if (role === "tecnico") {
          targetUser = users.find((u) => u.cargo === "Técnico");
          targetUrl = "Tecnico/T_Painel.html";
        } else if (role === "almoxarifado") {
          targetUser = users.find((u) => u.cargo === "Almoxarife");
          targetUrl = "Almoxarifado/Alm_Painel.html";
        } else if (role === "usuario") {
          targetUser = users.find((u) => u.cargo === "Operador");
          targetUrl = "Usuario/U_AberturaOS.html";
        }

        if (targetUser) {
          this.setLoggedUser(targetUser);
          window.location.href = prefix + targetUrl;
        }
      });
    });

    // Ação de Reset
    document.getElementById("sgm-hud-reset").addEventListener("click", () => {
      if (
        confirm(
          "Deseja realmente limpar todos os dados do LocalStorage e voltar ao padrão do projeto?",
        )
      ) {
        this.reset();
      }
    });

    // Ação de Inspeção de Banco de Dados
    document.getElementById("sgm-hud-inspect").addEventListener("click", () => {
      this.showInspectModal();
    });
  },

  // Abre um modal incrível para inspecionar os dados salvos em tempo real
  showInspectModal() {
    if (document.getElementById("sgm-inspect-modal")) return;

    const modal = document.createElement("div");
    modal.id = "sgm-inspect-modal";

    modal.innerHTML = `
            <div class="sgm-inspect-card">
                <div class="sgm-inspect-header">
                    <h3 style="margin:0; font-size:16px;">Inspetor de Dados SGM</h3>
                    <div>
                        <select id="sgm-inspect-table-select">
                            <option value="${this.KEYS.USUARIOS}">usuarios</option>
                            <option value="${this.KEYS.EQUIPAMENTOS}">equipamentos</option>
                            <option value="${this.KEYS.ITENS_ALMOXARIFADO}">itens_almoxarifado</option>
                            <option value="${this.KEYS.KITS_PADRAO}">kits_padrao</option>
                            <option value="${this.KEYS.ORDENS_SERVICO}">ordens_servico</option>
                            <option value="${this.KEYS.REQUISICOES_MATERIAIS}">requisicoes_materiais</option>
                            <option value="${this.KEYS.CONTROLE_FERRAMENTAL}">controle_ferramental</option>
                            <option value="${this.KEYS.HISTORICO_MAQUINAS}">historico_maquinas</option>
                        </select>
                        <button class="sgm-inspect-close" id="sgm-inspect-close" style="margin-left:12px;">&times;</button>
                    </div>
                </div>
                <div class="sgm-inspect-body">
                    <pre id="sgm-inspect-pre"></pre>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    const select = document.getElementById("sgm-inspect-table-select");
    const pre = document.getElementById("sgm-inspect-pre");
    const close = document.getElementById("sgm-inspect-close");

    const updateView = () => {
      const tableKey = select.value;
      const rawData = localStorage.getItem(tableKey);
      try {
        const parsed = JSON.parse(rawData);
        pre.textContent = JSON.stringify(parsed, null, 2);
      } catch (err) {
        pre.textContent = rawData || "// Tabela vazia ou inexistente";
      }
    };

    select.addEventListener("change", updateView);
    updateView(); // Primeira renderização

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    close.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  },
};

// Autoinicialização e injeção do HUD no carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  mockDb.init();
  mockDb.injectDeveloperHUD();

  // Atualiza o avatar da barra lateral de forma reativa após os scripts da página carregarem
  setTimeout(() => {
    const user = mockDb.getLoggedUser();
    if (user) {
      const avatarUser =
        document.querySelector(".sidebar-footer .user-avatar") ||
        document.querySelector(".user-avatar");
      const spanUser =
        document.querySelector(".sidebar-footer .user-name") ||
        document.querySelector(".user-name");
      const roleUser =
        document.querySelector(".sidebar-footer .user-role") ||
        document.querySelector(".user-role");

      if (spanUser) spanUser.textContent = user.nome;
      if (roleUser) {
        // Preserva especialidades específicas se for técnico
        if (user.cargo === "Técnico") {
          roleUser.textContent = user.especialidade
            ? `Téc. ${user.especialidade}`
            : "Técnico";
        } else {
          roleUser.textContent =
            user.cargo === "Almoxarife"
              ? "Almoxarife Líder"
              : user.cargo === "Administrador"
                ? "Administrador Master"
                : "Usuário da Produção";
        }
      }

      if (avatarUser) {
        if (user.foto) {
          avatarUser.textContent = "";
          avatarUser.style.backgroundImage = `url(${user.foto})`;
          avatarUser.style.backgroundSize = "cover";
          avatarUser.style.backgroundPosition = "center";
        } else {
          avatarUser.style.backgroundImage = "";
          avatarUser.textContent = user.nome
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        }
      }
    }
  }, 50);
});
