document.addEventListener("DOMContentLoaded", () => {
  const tabelaCorpo = document.querySelector("#tabela-painel-os tbody");

  // 1. Carregar dados do técnico logado
  const user = mockDb.getLoggedUser();
  if (user) {
    // Nome na barra lateral
    const spanUser = document.querySelector(".sidebar-footer .user-name");
    const roleUser = document.querySelector(".sidebar-footer .user-role");
    const avatarUser = document.querySelector(".sidebar-footer .user-avatar");

    if (spanUser) spanUser.textContent = user.nome;
    if (roleUser)
      roleUser.textContent = user.especialidade
        ? `Téc. ${user.especialidade}`
        : user.cargo;
    if (avatarUser && user.nome) {
      avatarUser.textContent = user.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }

    // Também atualiza o topo da barra lateral se houver span
    const headerSpan = document.querySelector(".sidebar-logo span");
    if (headerSpan) headerSpan.textContent = user.nome;
  }

  // 2. Renderizar fila de OS em aberto do banco de dados
  function renderizarFilaGeral() {
    const ordens = mockDb.getOrdensServico();
    const equipamentos = mockDb.getEquipamentos();

    tabelaCorpo.innerHTML = "";

    // Filtra apenas OS com status 'Aberta' (não assumidas)
    const abertas = ordens.filter((os) => os.status_os === "Aberta");

    if (abertas.length === 0) {
      tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 32px;">
                        Nenhuma ordem de serviço pendente na fila geral. Bom trabalho!
                    </td>
                </tr>`;
      return;
    }

    // Ordena por criticidade e condição operacional
    abertas.sort((a, b) => {
      const pesoCrit = { Alta: 3, Média: 2, Baixa: 1 };
      const pesoA = pesoCrit[a.criticidade || "Média"];
      const pesoB = pesoCrit[b.criticidade || "Média"];
      if (pesoB !== pesoA) return pesoB - pesoA;

      const aParada = a.condicao_maquina === "parada" ? 1 : 0;
      const bParada = b.condicao_maquina === "parada" ? 1 : 0;
      return bParada - aParada;
    });

    abertas.forEach((os) => {
      const eq = equipamentos.find((e) => e.tag === os.equipamento_tag);
      const nomeMaquina = eq ? eq.nome : "Máquina não cadastrada";
      const setorMaquina = eq ? eq.setor : os.setor;

      // Determinar classes e textos de prioridade
      const criticidade = os.criticidade || "Média";
      let classeLinha = "row-prioridade-media";
      let badgeHTML = `<span class="badge badge-info">Criticidade: ${criticidade}<br><small>Funcionando com Restrição</small></span>`;

      if (os.condicao_maquina === "parada") {
        classeLinha = "row-prioridade-alta";
        badgeHTML = `<span class="badge badge-danger">Criticidade: ${criticidade}<br><small>Parada Total</small></span>`;
      } else if (os.condicao_maquina === "baixa") {
        classeLinha = "row-prioridade-baixa";
        badgeHTML = `<span class="badge badge-info">Criticidade: ${criticidade}<br><small>Baixa Prioridade</small></span>`;
      }

      // Falha tag
      let classeFalha = "falha-mecanica";
      if (os.tipo_falha === "Elétrica") classeFalha = "falha-eletrica";
      if (os.tipo_falha === "Pneumática") classeFalha = "falha-pneumatica";

      // Calcula o tempo de espera real em segundos
      const segundosEspera = Math.floor(
        (new Date() - new Date(os.data_abertura)) / 1000,
      );

      // Formatador inicial
      let hrs = Math.floor(segundosEspera / 3600);
      let mins = Math.floor((segundosEspera % 3600) / 60);
      let secs = segundosEspera % 60;
      let hrsStr = hrs > 0 ? String(hrs).padStart(2, "0") + ":" : "";
      let tempoStr = `${hrsStr}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      const tr = document.createElement("tr");
      tr.className = classeLinha;
      tr.style.cursor = "pointer";
      tr.setAttribute("data-os-id", os.codigo_os);

      tr.innerHTML = `
                <td>${badgeHTML}</td>
                <td class="col-id">#${os.codigo_os}</td>
                <td>
                    <span class="machine-code">${os.equipamento_tag}</span>
                    <strong>${nomeMaquina}</strong>
                    <span class="sector-tag">Setor: ${setorMaquina}</span>
                </td>
                <td><span class="falha-tag ${classeFalha}">${os.tipo_falha}</span></td>
                <td>
                    <div class="cronometro" data-seconds="${segundosEspera}">${tempoStr}</div>
                </td>
                <td class="text-right">
                    <button class="btn-action btn-assumir" data-id="${os.id}">Assumir OS</button>
                </td>
            `;

      // Clique na linha para visualizar detalhes completos
      tr.addEventListener("click", (e) => {
        if (e.target.closest(".btn-assumir")) return;
        abrirModalDetalhes(os);
      });

      tabelaCorpo.appendChild(tr);
    });

    // Re-associar ouvintes nos botões assumir da tabela
    const botoes = tabelaCorpo.querySelectorAll(".btn-assumir");
    botoes.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idOS = e.target.getAttribute("data-id");
        const tr = e.target.closest("tr");
        const codigoOS = tr.getAttribute("data-os-id");
        assumirOSLogica(idOS, codigoOS);
      });
    });
  }

  // Modal de Detalhes da OS
  const modalDetails = document.getElementById("modal-detalhes-os");
  const btnFecharModal = document.getElementById("btn-fechar-modal-detalhes");
  const btnAssumirModal = document.getElementById("btn-assumir-modal");

  if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () =>
      modalDetails.classList.add("hidden"),
    );
  }
  if (modalDetails) {
    modalDetails.addEventListener("click", (e) => {
      if (e.target === modalDetails) modalDetails.classList.add("hidden");
    });
  }

  function abrirModalDetalhes(os) {
    if (!modalDetails) return;
    const equipamentos = mockDb.getEquipamentos();
    const eq = equipamentos.find((e) => e.tag === os.equipamento_tag);
    const usuarios = mockDb.getUsuarios();
    const solicitante = usuarios.find((u) => u.id === os.solicitante_id);
    const tecnico = usuarios.find((u) => u.id === os.tecnico_id);
    const solicitanteNome = solicitante ? solicitante.nome : "Desconhecido";

    document.getElementById("modal-os-titulo").textContent =
      `Ordem de Serviço #${os.codigo_os}`;
    document.getElementById("modal-os-maquina").textContent = eq
      ? `${eq.tag} - ${eq.nome}`
      : os.equipamento_tag;
    document.getElementById("modal-os-setor").textContent = eq
      ? eq.setor
      : os.setor || "Chão de Fábrica";
    document.getElementById("modal-os-falha").textContent = os.tipo_falha;

    const tecnicoAtual = tecnico ? tecnico.nome : "Não atribuído";
    const tecnicoEl = document.getElementById("modal-os-tecnico");
    if (tecnicoEl) tecnicoEl.textContent = tecnicoAtual;

    let critText = os.criticidade || "Média";
    let critClass = "criticidade-alta";
    if (critText === "Média") critClass = "criticidade-media";
    if (critText === "Baixa") critClass = "criticidade-baixa";
    document.getElementById("modal-os-criticidade").innerHTML =
      `<span class="badge-crit ${critClass}">${critText}</span>`;

    document.getElementById("modal-os-desc").textContent =
      os.descricao_problema;
    document.getElementById("modal-os-solicitante").textContent =
      solicitanteNome;
    document.getElementById("modal-os-data").textContent = new Date(
      os.data_abertura,
    ).toLocaleString("pt-BR");

    // Histórico
    const historicoDiv = document.getElementById("modal-os-historico");
    historicoDiv.innerHTML = "";
    const historicos = mockDb.getHistoricoMaquinas();
    const logsMaquina = historicos[os.equipamento_tag];

    if (!logsMaquina || !logsMaquina.logs || logsMaquina.logs.length === 0) {
      historicoDiv.innerHTML =
        '<p style="color:var(--neutral-medium); font-style:italic; font-size:12px; margin:0;">Nenhuma intervenção anterior para esta máquina.</p>';
    } else {
      logsMaquina.logs.forEach((l) => {
        const logItem = document.createElement("div");
        logItem.style.marginBottom = "8px";
        logItem.style.borderBottom = "1px solid #EEE";
        logItem.style.paddingBottom = "6px";
        logItem.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-weight:600; font-size:11px; color:#555;">
                        <span>${l.data.split(" - ")[0]} (${l.tipo})</span>
                        <span>Téc. ${l.tecnico}</span>
                    </div>
                    <p style="margin:2px 0 0 0; font-size:12px; line-height:1.3;">${l.relato}</p>
                `;
        historicoDiv.appendChild(logItem);
      });
    }

    // Ação do Botão no Modal
    btnAssumirModal.onclick = () => {
      assumirOSLogica(os.id, os.codigo_os);
    };

    modalDetails.classList.remove("hidden");
  }

  function assumirOSLogica(idOS, codigoOS) {
    if (
      confirm(
        `Deseja assumir o diagnóstico e execução da OS #${codigoOS} agora?`,
      )
    ) {
      mockDb.updateOrdemServico(idOS, {
        tecnico_id: user ? user.id : 2, // Carlos Silva fallback
        status_os: "Em Andamento",
        data_inicio_manutencao: new Date().toISOString(),
      });

      alert(
        `OS #${codigoOS} vinculada com sucesso! Você será redirecionado para a tela de execução.`,
      );
      window.location.href = `T_MinhasOS.html?os=${codigoOS}`;
    }
  }

  // Inicialização da fila
  renderizarFilaGeral();

  // 3. Lógica do Cronômetro Ativo (Tempo de Espera Crescente em tempo real)
  setInterval(() => {
    const cronometros = document.querySelectorAll(".cronometro");
    cronometros.forEach((cronometro) => {
      let segundosAtuais = parseInt(
        cronometro.getAttribute("data-seconds"),
        10,
      );
      segundosAtuais++;

      cronometro.setAttribute("data-seconds", segundosAtuais);

      // Conversão matemática para formato legível (HH:MM:SS)
      let hrs = Math.floor(segundosAtuais / 3600);
      let mins = Math.floor((segundosAtuais % 3600) / 60);
      let secs = segundosAtuais % 60;

      let hrsStr = hrs > 0 ? String(hrs).padStart(2, "0") + ":" : "";
      let minsStr = String(mins).padStart(2, "0");
      let secsStr = String(secs).padStart(2, "0");

      cronometro.textContent = `${hrsStr}${minsStr}:${secsStr}`;
    });
  }, 1000);
});
