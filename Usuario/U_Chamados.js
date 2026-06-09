document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('input-busca');
    const selectStatus = document.getElementById('select-filtro-status');
    const tabelaCorpo = document.querySelector('#tabela-os tbody');
    const emptyState = document.getElementById('empty-state');

    const modalDetalhes = document.getElementById('modal-detalhes-os-user');
    const btnFecharModalUser = document.getElementById('btn-fechar-modal-detalhes-user');

    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-logo span') || document.querySelector('.sidebar span');
        if (spanUser) spanUser.textContent = user.nome;
    }

    // 2. Renderizar linhas dinamicamente a partir do mockDb
    function renderizarTabela() {
        const ordens = mockDb.getOrdensServico();
        const equipamentos = mockDb.getEquipamentos();
        const usuarios = mockDb.getUsuarios();

        // Limpar tabela
        tabelaCorpo.innerHTML = '';

        // Filtrar chamados: se for operador, exibe apenas os dele. Caso contrário (como teste), exibe todos.
        const ordensFiltradas = ordens.filter(os => {
            if (user && user.cargo === 'Operador') {
                return os.solicitante_id === user.id;
            }
            return true;
        });

        if (ordensFiltradas.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        ordensFiltradas.forEach(os => {
            const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
            const nomeMaquina = eq ? eq.nome : 'Equipamento não cadastrado';
            
            const tech = os.tecnico_id ? usuarios.find(u => u.id === os.tecnico_id) : null;
            const nomeTecnico = tech ? tech.nome : 'Não atribuído';

            let badgeHTML = '';
            let statusText = os.status_os;
            if (os.status_os === 'Aberta') {
                badgeHTML = '<span class="badge status-aguardando">Aguardando Técnico</span>';
                statusText = 'Aguardando Técnico';
            } else if (os.status_os === 'Em Andamento') {
                badgeHTML = '<span class="badge status-manutencao">Em Manutenção</span>';
                statusText = 'Em Manutenção';
            } else if (os.status_os === 'Aguardando Peças') {
                badgeHTML = '<span class="badge status-pecas">Aguardando Peças</span>';
                statusText = 'Aguardando Peças';
            } else if (os.status_os === 'Aguardando Devolução de Ferramentas') {
                badgeHTML = '<span class="badge status-devolucao">Aguardando Devolução</span>';
                statusText = 'Aguardando Devolução de Kit';
            } else if (os.status_os === 'Concluído') {
                badgeHTML = '<span class="badge status-concluido">Concluído</span>';
                statusText = 'Concluído';
            }

            const tr = document.createElement('tr');
            tr.setAttribute('data-status', statusText);
            tr.setAttribute('data-maquina', os.equipamento_tag);
            tr.style.cursor = 'pointer';

            const dataFormatada = new Date(os.data_abertura).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td class="col-id">#${os.codigo_os}</td>
                <td>${dataFormatada}</td>
                <td><span class="machine-code">${os.equipamento_tag}</span> ${nomeMaquina}</td>
                <td>${badgeHTML}</td>
                <td class="col-tecnico ${tech ? '' : 'text-muted'}">${nomeTecnico}</td>
            `;

            tr.addEventListener('click', () => abrirModalDetalhesUser(os));

            tabelaCorpo.appendChild(tr);
        });

        filtrarTabela();
    }

    // 3. Função unificada de filtragem (Busca por texto + Dropdown de Status)
    function filtrarTabela() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const statusSelecionado = selectStatus.value;
        const tabelaLinhas = tabelaCorpo.querySelectorAll('tr');
        let linhasVisiveis = 0;

        tabelaLinhas.forEach(linha => {
            const textoLinha = linha.textContent.toLowerCase();
            const statusLinha = linha.getAttribute('data-status');

            // Verifica a correspondência do texto digitado
            const bateTexto = textoLinha.includes(termoBusca);

            // Verifica a correspondência do status selecionado
            const bateStatus = (statusSelecionado === 'todos' || statusLinha === statusSelecionado);

            // Exibe ou oculta a linha com base nas condições cruzadas
            if (bateTexto && bateStatus) {
                linha.style.display = '';
                linhasVisiveis++;
            } else {
                linha.style.display = 'none';
            }
        });

        // Gerencia a exibição visual do "Estado Vazio" se nada for encontrado
        if (linhasVisiveis === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    // Inicialização da tela
    renderizarTabela();

    function abrirModalDetalhesUser(os) {
        if (!modalDetalhes) return;
        const equipamentos = mockDb.getEquipamentos();
        const usuarios = mockDb.getUsuarios();
        const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
        const solicitante = os.solicitante_id ? usuarios.find(u => u.id === os.solicitante_id) : null;
        const solicitanteNome = solicitante ? solicitante.nome : 'Desconhecido';
        const tecnico = os.tecnico_id ? usuarios.find(u => u.id === os.tecnico_id) : null;
        const tecnicoNome = tecnico ? tecnico.nome : 'Não atribuído';

        let statusText = os.status_os;
        if (os.status_os === 'Aberta') statusText = 'Aguardando Técnico';
        else if (os.status_os === 'Em Andamento') statusText = 'Em Manutenção';
        else if (os.status_os === 'Aguardando Peças') statusText = 'Aguardando Peças';
        else if (os.status_os === 'Aguardando Devolução de Ferramentas') statusText = 'Aguardando Devolução de Kit';

        document.getElementById('user-modal-os-titulo').textContent = `Ordem de Serviço #${os.codigo_os}`;
        document.getElementById('user-modal-os-codigo').textContent = os.codigo_os;
        document.getElementById('user-modal-os-maquina').textContent = eq ? `${eq.tag} - ${eq.nome}` : os.equipamento_tag;
        document.getElementById('user-modal-os-setor').textContent = eq ? eq.setor : (os.setor || 'Chão de Fábrica');
        document.getElementById('user-modal-os-falha').textContent = os.tipo_falha;

        const criticidade = os.criticidade || 'Média';
        const critClass = criticidade === 'Alta' ? 'criticidade-alta' : (criticidade === 'Baixa' ? 'status-baixa' : 'criticidade-media');
        document.getElementById('user-modal-os-criticidade').innerHTML = `<span class="badge-crit ${critClass}" style="padding:4px 8px; border-radius:4px; font-weight:700;">${criticidade}</span>`;

        document.getElementById('user-modal-os-status').textContent = statusText;
        document.getElementById('user-modal-os-tecnico').textContent = tecnicoNome;
        document.getElementById('user-modal-os-data').textContent = new Date(os.data_abertura).toLocaleString('pt-BR');
        document.getElementById('user-modal-os-solicitante').textContent = solicitanteNome;

        const historicoDiv = document.getElementById('user-modal-os-historico');
        historicoDiv.innerHTML = '';
        const historicos = mockDb.getHistoricoMaquinas();
        const logsMaquina = historicos[os.equipamento_tag];

        if (!logsMaquina || !logsMaquina.logs || logsMaquina.logs.length === 0) {
            historicoDiv.innerHTML = '<p style="color:var(--neutral-medium); font-style:italic; font-size:12px; margin:0;">Nenhuma intervenção anterior para esta máquina.</p>';
        } else {
            logsMaquina.logs.forEach(l => {
                const logItem = document.createElement('div');
                logItem.style.marginBottom = '8px';
                logItem.style.borderBottom = '1px solid #EEE';
                logItem.style.paddingBottom = '6px';
                logItem.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-weight:600; font-size:11px; color:#555;">
                        <span>${l.data.split(' - ')[0]} (${l.tipo})</span>
                        <span>Téc. ${l.tecnico}</span>
                    </div>
                    <p style="margin:2px 0 0 0; font-size:12px; line-height:1.3;">${l.relato}</p>
                `;
                historicoDiv.appendChild(logItem);
            });
        }

        document.getElementById('user-modal-os-desc').textContent = os.descricao_problema;

        modalDetalhes.classList.remove('hidden');
    }

    if (btnFecharModalUser) {
        btnFecharModalUser.addEventListener('click', () => modalDetalhes.classList.add('hidden'));
    }
    if (modalDetalhes) {
        modalDetalhes.addEventListener('click', (e) => {
            if (e.target === modalDetalhes) modalDetalhes.classList.add('hidden');
        });
    }

    // Ouvintes de evento para monitoramento em tempo real (Sem necessidade de cliques em botões)
    inputBusca.addEventListener('input', filtrarTabela);
    selectStatus.addEventListener('change', filtrarTabela);
});