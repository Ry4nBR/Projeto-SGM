// Adm_Painel.js - Controle Dinâmico do Painel do Administrador integrado ao mockDb

document.addEventListener('DOMContentLoaded', () => {
    const filterTecnico = document.getElementById('filter-tecnico');
    const filterSetor = document.getElementById('filter-setor');
    const filterCriticidade = document.getElementById('filter-criticidade');
    const filterStatus = document.getElementById('filter-status');

    const tabelaOS = document.getElementById('table-master-os');
    const tabelaCorpo = tabelaOS.querySelector('tbody');



    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        if (spanUser) spanUser.textContent = user.nome;
        if (avatarUser && user.nome) {
            // Se o usuário tiver foto Base64, exibir como imagem
            if (user.foto) {
                avatarUser.innerHTML = '';
                avatarUser.style.backgroundImage = `url(${user.foto})`;
                avatarUser.style.backgroundSize = 'cover';
                avatarUser.style.backgroundPosition = 'center';
            } else {
                avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }
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

        // Metric 3: Máquinas Paradas Agora (Em Manutenção ou Parado)
        const maquinasParadas = equipamentos.filter(e => e.status_equipamento === 'Parado' || e.status_equipamento === 'Em Manutenção').length;
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
        const setoresUnicos = [...new Set(equipamentos.map(e => e.setor.split(' - ')[0]))];
        
        filterSetor.innerHTML = '<option value="todos">Todos os Setores</option>';
        setoresUnicos.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            filterSetor.appendChild(opt);
        });
    }

    // Formata data ISO para pt-BR legível
    function formatarData(dataISO) {
        if (!dataISO) return '—';
        try {
            return new Date(dataISO).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return '—';
        }
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
                    <td colspan="10" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 32px;">
                        Nenhuma ordem de serviço registrada no SGM.
                    </td>
                </tr>`;
            return;
        }

        ordens.forEach(os => {
            const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
            const nomeMaquina = eq ? eq.nome : 'Máquina não cadastrada';
            const setorCompleto = eq ? eq.setor : (os.setor || 'Não definido');
            const setorPrincipal = setorCompleto.split(' - ')[0]; // ex: "Montagem"

            const tech = os.tecnico_id ? usuarios.find(u => u.id === os.tecnico_id) : null;
            const nomeTecnico = tech ? tech.nome : 'Não Atribuído';

            // Solicitante
            const solicitante = os.solicitante_id ? usuarios.find(u => u.id === os.solicitante_id) : null;
            const nomeSolicitante = solicitante ? solicitante.nome : 'Não identificado';

            // Criticidade Badge (com proteção contra undefined)
            const criticidade = os.criticidade || 'Média';
            let classeCrit = 'criticidade-media';
            if (criticidade === 'Alta' || criticidade.toUpperCase().includes('ALTA')) classeCrit = 'criticidade-alta';
            if (criticidade === 'Baixa') classeCrit = 'criticidade-baixa';
            
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

            // Observações truncadas
            const obsCompleta = os.descricao_problema || '';
            const obsTruncada = obsCompleta.length > 60 ? obsCompleta.substring(0, 60) + '...' : obsCompleta;

            const tr = document.createElement('tr');
            tr.setAttribute('data-tecnico', nomeTecnico);
            tr.setAttribute('data-setor', setorPrincipal);
            tr.setAttribute('data-criticidade', criticidade);
            tr.setAttribute('data-status', os.status_os);

            tr.innerHTML = `
                <td class="col-id">#${os.codigo_os}</td>
                <td><strong>${eq ? eq.nome : 'Equipamento'} ${os.equipamento_tag}</strong></td>
                <td>${nomeSolicitante}</td>
                <td>${setorPrincipal}</td>
                <td><span class="badge-crit ${classeCrit}">${criticidade}</span></td>
                <td><span class="badge-status ${badgeStatusClass}">${statusExibido}</span></td>
                <td class="td-tech-name ${tech ? '' : 'label-unassigned'}">${nomeTecnico}</td>
                <td class="col-data">${formatarData(os.data_abertura)}</td>
                <td class="col-obs" title="${obsCompleta}">${obsTruncada || '<em style="color:var(--neutral-medium)">—</em>'}</td>
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

            const matchStatus = (valStatus === 'todos' || statusLinha === valStatus);
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