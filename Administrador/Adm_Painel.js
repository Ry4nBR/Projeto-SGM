// Adm_Painel.js - Controle Dinâmico do Painel do Administrador integrado ao mockDb

document.addEventListener('DOMContentLoaded', () => {
    // Captura dos elementos seletores de filtros do cabeçalho
    const filterTecnico = document.getElementById('filter-tecnico');
    const filterSetor = document.getElementById('filter-setor');
    const filterCriticidade = document.getElementById('filter-criticidade');
    const filterStatus = document.getElementById('filter-status');

    // Elementos da tabela mestre
    const tabelaOS = document.getElementById('table-master-os');
    const tabelaCorpo = tabelaOS.querySelector('tbody');

    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        if (spanUser) spanUser.textContent = user.nome;
        if (avatarUser && user.nome) {
            avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
    }

    // 2. Renderizar Métricas do Topo
    function renderizarMetricas() {
        const ordens = mockDb.getOrdensServico();
        const equipamentos = mockDb.getEquipamentos();

        // Metric 1: OS Abertas (status diferente de 'Concluído')
        const totalAbertas = ordens.filter(o => o.status_os !== 'Concluído').length;
        document.querySelector('.metrics-cards-grid .card-metric:nth-child(1) .metric-value').textContent = String(totalAbertas).padStart(2, '0');

        // Metric 2: MTTR Médio (Hoje) - calculado em minutos das OS concluídas
        const concluidas = ordens.filter(o => o.status_os === 'Concluído' && o.data_fechamento && o.data_abertura);
        let mttrMinutos = 42; // default se não houver concluídas
        if (concluidas.length > 0) {
            const somaMinutos = concluidas.reduce((soma, o) => {
                const dif = new Date(o.data_fechamento) - new Date(o.data_abertura);
                return soma + (dif / 1000 / 60);
            }, 0);
            mttrMinutos = Math.round(somaMinutos / concluidas.length);
        }
        document.querySelector('.metrics-cards-grid .card-metric:nth-child(2) .metric-value').innerHTML = `${mttrMinutos}<span class="metric-unit">min</span>`;

        // Metric 3: Máquinas Paradas Agora
        const maquinasParadas = equipamentos.filter(e => e.status_equipamento === 'Parado').length;
        document.querySelector('.metrics-cards-grid .card-metric:nth-child(3) .metric-value').textContent = String(maquinasParadas).padStart(2, '0');
    }

    // 3. Preencher os Filtros com dados dinâmicos do Banco
    function carregarFiltros() {
        const usuarios = mockDb.getUsuarios();
        const tecnicos = usuarios.filter(u => u.cargo === 'Técnico');
        
        // Limpar e recarregar técnicos no filtro
        filterTecnico.innerHTML = '<option value="todos">Todos os Técnicos</option>';
        tecnicos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.nome;
            opt.textContent = t.nome;
            filterTecnico.appendChild(opt);
        });
        const optSem = document.createElement('option');
        optSem.value = 'Não Atribuído';
        optSem.textContent = 'Sem Técnico';
        filterTecnico.appendChild(optSem);

        // Preencher setores dinâmicos
        const equipamentos = mockDb.getEquipamentos();
        const setoresUnicos = [...new Set(equipamentos.map(e => e.setor))];
        
        filterSetor.innerHTML = '<option value="todos">Todos os Setores</option>';
        setoresUnicos.forEach(s => {
            const opt = document.createElement('option');
            // Remove linhas específicas se necessário, pega apenas a palavra principal
            const setorNome = s.split(' - ')[0];
            opt.value = setorNome;
            opt.textContent = setorNome;
            filterSetor.appendChild(opt);
        });
    }

    // 4. Renderizar a Tabela Mestre
    function renderizarTabelaMestre() {
        const ordens = mockDb.getOrdensServico();
        const equipamentos = mockDb.getEquipamentos();
        const usuarios = mockDb.getUsuarios();
        const tecnicos = usuarios.filter(u => u.cargo === 'Técnico');

        tabelaCorpo.innerHTML = '';

        if (ordens.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 32px;">
                        Nenhuma ordem de serviço registrada no SGM.
                    </td>
                </tr>`;
            return;
        }

        ordens.forEach(os => {
            const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
            const nomeMaquina = eq ? eq.nome : 'Máquina não cadastrada';
            const setorCompleto = eq ? eq.setor : os.setor;
            const setorPrincipal = setorCompleto.split(' - ')[0]; // ex: "Montagem"

            const tech = os.tecnico_id ? usuarios.find(u => u.id === os.tecnico_id) : null;
            const nomeTecnico = tech ? tech.nome : 'Não Atribuído';

            // Criticidade Badge
            let classeCrit = 'criticidade-media';
            if (os.criticidade === 'Alta' || os.criticidade.toUpperCase().includes('ALTA')) classeCrit = 'criticidade-alta';
            if (os.criticidade === 'Baixa') classeCrit = 'criticidade-baixa';
            
            // Status Badge
            let badgeStatusClass = 'status-manutencao';
            let statusExibido = os.status_os;
            if (os.status_os === 'Aberta') {
                badgeStatusClass = 'status-aguardando';
                statusExibido = 'Aguardando Técnico';
            } else if (os.status_os === 'Em Andamento') {
                badgeStatusClass = 'status-manutencao';
                statusExibido = 'Em Manutenção';
            } else if (os.status_os === 'Aguardando Peças') {
                badgeStatusClass = 'status-pecas';
            } else if (os.status_os === 'Aguardando Devolução de Ferramentas') {
                badgeStatusClass = 'status-devolucao';
                statusExibido = 'Devolvendo Kit';
            } else if (os.status_os === 'Concluído') {
                badgeStatusClass = 'status-concluido';
            }

            // Select de reatribuição de técnico
            let optionsReassign = `<option value="Não Atribuído" ${!tech ? 'selected' : ''}>Escolher Técnico...</option>`;
            tecnicos.forEach(t => {
                optionsReassign += `<option value="${t.id}" ${tech && tech.id === t.id ? 'selected' : ''}>${t.nome}</option>`;
            });

            const tr = document.createElement('tr');
            tr.setAttribute('data-tecnico', nomeTecnico);
            tr.setAttribute('data-setor', setorPrincipal);
            tr.setAttribute('data-criticidade', os.criticidade);
            tr.setAttribute('data-status', os.status_os === 'Aberta' ? 'Pendente' : os.status_os);

            tr.innerHTML = `
                <td class="col-id">#${os.codigo_os}</td>
                <td><strong>${eq ? eq.nome : 'Equipamento'} ${os.equipamento_tag}</strong></td>
                <td>${setorPrincipal}</td>
                <td><span class="badge-crit ${classeCrit}">${os.criticidade}</span></td>
                <td><span class="badge-status ${badgeStatusClass}">${statusExibido}</span></td>
                <td class="td-tech-name ${tech ? '' : 'label-unassigned'}">${nomeTecnico}</td>
                <td>
                    <select class="select-table-reassign ${tech ? '' : 'highlighted-select'}" data-os-id="${os.id}">
                        ${optionsReassign}
                    </select>
                </td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        // Adicionar ouvintes para reatribuição nos selects
        tabelaCorpo.querySelectorAll('.select-table-reassign').forEach(select => {
            select.addEventListener('change', (e) => {
                const osId = e.target.getAttribute('data-os-id');
                const selectedVal = e.target.value;
                
                reatribuirTecnicoLogica(osId, selectedVal);
            });
        });

        executarFiltragem();
    }

    // 5. Lógica de Reatribuição do Técnico pelo Administrador
    function reatribuirTecnicoLogica(osId, selectedVal) {
        const ordens = mockDb.getOrdensServico();
        const os = ordens.find(o => o.id === parseInt(osId));
        if (!os) return;

        const usuarios = mockDb.getUsuarios();
        let novoStatus = os.status_os;
        let novoTecId = null;
        let nomeTecnico = 'Não Atribuído';

        if (selectedVal !== 'Não Atribuído') {
            novoTecId = parseInt(selectedVal);
            const tech = usuarios.find(u => u.id === novoTecId);
            nomeTecnico = tech ? tech.nome : 'Não Atribuído';
            
            // Se a OS estava Aberta/Pendente e ganhou um técnico, move para Em Andamento
            if (os.status_os === 'Aberta') {
                novoStatus = 'Em Andamento';
                mockDb.updateOrdemServico(os.id, {
                    tecnico_id: novoTecId,
                    status_os: novoStatus,
                    data_inicio_manutencao: new Date().toISOString()
                });
            } else {
                mockDb.updateOrdemServico(os.id, {
                    tecnico_id: novoTecId
                });
            }
        } else {
            // Se removeu o técnico, devolve para Aberta
            novoStatus = 'Aberta';
            mockDb.updateOrdemServico(os.id, {
                tecnico_id: null,
                status_os: novoStatus,
                data_inicio_manutencao: null
            });
        }

        alert(`Intervenção Concluída!\nA ordem de serviço #${os.codigo_os} foi reatribuída com sucesso para o técnico: "${nomeTecnico}".`);
        
        // Atualiza a tela inteira
        renderizarMetricas();
        renderizarTabelaMestre();
    }

    // 6. Executa a lógica de filtragem combinada
    function executarFiltragem() {
        const valTecnico = filterTecnico.value;
        const valSetor = filterSetor.value;
        const valCriticidade = filterCriticidade.value;
        const valStatus = filterStatus.value;
        
        const linhasTabela = tabelaCorpo.querySelectorAll('tr');

        linhasTabela.forEach(linha => {
            // Se a tabela estiver com a linha de "Nenhuma OS", ignora
            if (linha.cells.length === 1) return;

            const techLinha = linha.getAttribute('data-tecnico');
            const setorLinha = linha.getAttribute('data-setor');
            const critLinha = linha.getAttribute('data-criticidade');
            const statusLinha = linha.getAttribute('data-status');

            // Mapeamentos de status entre filtros e atributos
            // statusLinha pode ser 'Aberta', 'Em Andamento', 'Aguardando Peças', 'Aguardando Devolução de Ferramentas', 'Concluído'
            // valStatus pode ser 'todos', 'Em Manutenção', 'Aguardando Peças', 'Aguardando Devolução do Kit'
            let matchStatus = false;
            if (valStatus === 'todos') {
                matchStatus = true;
            } else if (valStatus === 'Em Manutenção' && statusLinha === 'Em Andamento') {
                matchStatus = true;
            } else if (valStatus === 'Aguardando Peças' && statusLinha === 'Aguardando Peças') {
                matchStatus = true;
            } else if (valStatus === 'Aguardando Devolução do Kit' && statusLinha === 'Aguardando Devolução de Ferramentas') {
                matchStatus = true;
            }

            const matchTecnico = (valTecnico === 'todos' || techLinha === valTecnico);
            const matchSetor = (valSetor === 'todos' || setorLinha === valSetor);
            const matchCriticidade = (valCriticidade === 'todos' || critLinha === valCriticidade);

            if (matchTecnico && matchSetor && matchCriticidade && matchStatus) {
                linha.style.display = '';
            } else {
                linha.style.display = 'none';
            }
        });
    }

    // Ouvintes de evento de mudança (change) para cada seletor de filtro
    filterTecnico.addEventListener('change', executarFiltragem);
    filterSetor.addEventListener('change', executarFiltragem);
    filterCriticidade.addEventListener('change', executarFiltragem);
    filterStatus.addEventListener('change', executarFiltragem);

    // Inicialização da tela
    renderizarMetricas();
    carregarFiltros();
    renderizarTabelaMestre();
});