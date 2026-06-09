document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface de alteração de status
    const selectStatus = document.getElementById('select-alterar-status');
    const badgeStatusGeral = document.getElementById('badge-status-geral');
    const btnSolicitarKit = document.getElementById('btn-solicitar-kit');

    // Elementos de fluxo de encerramento
    const btnAbrirEncerramento = document.getElementById('btn-abrir-encerramento');
    const modalRelato = document.getElementById('modal-relato-tecnico');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal');
    const formEncerramento = document.getElementById('form-encerramento');
    const txtRelato = document.getElementById('txt-relato');

    // Elementos Novos do Sistema de Abas e Requisição de Itens Avulsos
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnAddItemLista = document.getElementById('btn-add-item-lista');
    const inputItemQtd = document.getElementById('input-item-qtd');
    const listaItensRequisicao = document.getElementById('lista-itens-requisicao');
    const btnEnviarRequisicaoAvulsa = document.getElementById('btn-enviar-requisicao-avulsa');

    // Carregar dados do técnico logado
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const roleUser = document.querySelector('.sidebar-footer .user-role');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        
        if (spanUser) spanUser.textContent = user.nome;
        if (roleUser) roleUser.textContent = user.especialidade ? `Téc. ${user.especialidade}` : user.cargo;
        if (avatarUser && user.nome) {
            avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }

        // Também atualiza o topo da barra lateral
        const headerSpan = document.querySelector('.sidebar-logo span');
        if (headerSpan) headerSpan.textContent = user.nome;
    }

    // 1. Identificar qual OS carregar
    const urlParams = new URLSearchParams(window.location.search);
    let osCodigo = urlParams.get('os');
    let activeOS = null;

    const ordens = mockDb.getOrdensServico();
    const equipamentos = mockDb.getEquipamentos();
    const usuarios = mockDb.getUsuarios();

    if (osCodigo) {
        activeOS = ordens.find(o => o.codigo_os === osCodigo);
    }

    // Fallback: se não passou no URL, pega a primeira atribuída a este técnico que não esteja concluída
    if (!activeOS && user) {
        activeOS = ordens.find(o => o.tecnico_id === user.id && o.status_os !== 'Concluído');
    }

    // Se ainda assim não encontrar nada, pega a primeira OS em andamento ou de fallback
    if (!activeOS) {
        activeOS = ordens.find(o => o.status_os === 'Em Andamento') || ordens[0];
    }

    // Renderizar a barra lateral de OSs atribuídas
    function renderizarListaOSAtribuidas() {
        const listaUl = document.getElementById('lista-os-atribuidas');
        if (!listaUl) return;
        listaUl.innerHTML = '';

        const idTecnico = user ? user.id : 2; // fallback Carlos Silva
        const ordensAtribuidas = mockDb.getOrdensServico().filter(o => o.tecnico_id === idTecnico);

        if (ordensAtribuidas.length === 0) {
            listaUl.innerHTML = '<li class="empty-list-notice">Nenhuma OS atribuída a você.</li>';
            return;
        }

        ordensAtribuidas.forEach(o => {
            const eq = equipamentos.find(e => e.tag === o.equipamento_tag);
            const nomeEq = eq ? eq.nome : 'Equipamento';
            const setorEq = eq ? eq.setor : (o.setor || 'Não definido');
            const li = document.createElement('li');
            li.className = `os-sidebar-item ${activeOS && activeOS.id === o.id ? 'active' : ''}`;
            
            let statusBadgeClass = 'status-em-manutencao';
            if (o.status_os === 'Aguardando Peças') statusBadgeClass = 'status-aguardando-pecas';
            if (o.status_os === 'Aguardando Devolução de Ferramentas') statusBadgeClass = 'status-devolucao';
            if (o.status_os === 'Concluído') statusBadgeClass = 'status-concluido';
            if (o.status_os === 'Aberta') statusBadgeClass = 'status-aguardando';

            li.innerHTML = `
                <h4>#${o.codigo_os}</h4>
                <p style="margin: 2px 0;">${o.equipamento_tag} - ${nomeEq}</p>
                <p style="margin: 0; font-size: 11px; color: #888;">Setor: ${setorEq}</p>
                <div class="os-meta-row" style="margin-top: 4px;">
                    <span class="os-status-pill ${statusBadgeClass}">${o.status_os === 'Em Andamento' ? 'Em Manut.' : o.status_os}</span>
                    <span style="font-weight:600; font-size:10px;">${o.criticidade || 'Alta'}</span>
                </div>
            `;

            li.addEventListener('click', () => {
                selecionarOS(o);
            });

            listaUl.appendChild(li);
        });
    }

    // Carregar histórico de intervenções da máquina
    function carregarHistoricoMaquina(tagMaquina) {
        const tableBody = document.querySelector('#table-historico-maquina tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const historicos = mockDb.getHistoricoMaquinas();
        const dadosAtivo = historicos[tagMaquina];

        if (!dadosAtivo || !dadosAtivo.logs || dadosAtivo.logs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 20px;">
                        Nenhuma intervenção anterior registrada para esta máquina.
                    </td>
                </tr>`;
            return;
        }

        dadosAtivo.logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid #EEE;">${log.data.split(' - ')[0]}</td>
                <td style="padding: 8px; border-bottom: 1px solid #EEE;"><span class="failure-type-badge" style="font-size: 11px; padding: 2px 6px;">${log.tipo}</span></td>
                <td style="padding: 8px; border-bottom: 1px solid #EEE; font-weight:600;">${log.tecnico}</td>
                <td style="padding: 8px; border-bottom: 1px solid #EEE; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.relato}">${log.relato}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 2. Preencher os dados dinâmicos da OS na interface
    function carregarDadosOS() {
        if (!activeOS) {
            alert('Nenhuma Ordem de Serviço ativa encontrada.');
            return;
        }

        const h1 = document.querySelector('.main-header h1');
        if (h1) h1.textContent = `Ordem de Serviço #${activeOS.codigo_os}`;

        // Atualizar campos da tabela de info
        const eq = equipamentos.find(e => e.tag === activeOS.equipamento_tag);
        const solicitante = usuarios.find(u => u.id === activeOS.solicitante_id);

        const machineTagSpan = document.querySelector('.machine-tag');
        if (machineTagSpan) {
            machineTagSpan.textContent = activeOS.equipamento_tag;
            machineTagSpan.nextSibling.textContent = eq ? ` ${eq.nome}` : ' Equipamento não cadastrado';
        }

        const sectorP = document.querySelector('.info-item:nth-child(2) p');
        if (sectorP) sectorP.textContent = eq ? eq.setor : activeOS.setor;

        const failSpan = document.querySelector('.failure-type-badge');
        if (failSpan) {
            failSpan.textContent = activeOS.tipo_falha;
            failSpan.className = `failure-type-badge falha-${activeOS.tipo_falha.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
        }

        const descP = document.querySelector('.description-text');
        if (descP) descP.textContent = activeOS.descricao_problema;

        const solicitanteP = document.querySelector('.info-item:nth-child(5) p');
        if (solicitanteP) solicitanteP.textContent = solicitante ? solicitante.nome : 'Desconhecido';

        const dataP = document.querySelector('.info-item:nth-child(6) p');
        if (dataP) {
            dataP.textContent = new Date(activeOS.data_abertura).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }

        // Criticidade
        const osDetailCriticidade = document.getElementById('os-detail-criticidade');
        if (osDetailCriticidade) {
            const critText = activeOS.criticidade || 'Alta';
            let critClass = 'criticidade-alta';
            if (critText === 'Média') critClass = 'criticidade-media';
            if (critText === 'Baixa') critClass = 'status-baixa'; // reutiliza classe azul do usuário
            osDetailCriticidade.innerHTML = `<span class="badge-crit ${critClass}" style="padding:4px 8px; border-radius:4px; font-weight:700;">${critText}</span>`;
        }

        // Observações / Diagnóstico
        const osDetailObservacoes = document.getElementById('os-detail-observacoes');
        if (osDetailObservacoes) {
            osDetailObservacoes.textContent = activeOS.diagnostico_tecnico || 'Aguardando encerramento técnico e emissão de parecer.';
        }

        // Carrega histórico da máquina correspondente
        carregarHistoricoMaquina(activeOS.equipamento_tag);

        // Definir estado do seletor e do badge de status
        atualizarVisualStatus(activeOS.status_os);

        // Bloquear controles se já estiver finalizada ou aguardando devolução
        if (activeOS.status_os === 'Aguardando Devolução de Ferramentas' || activeOS.status_os === 'Concluído') {
            selectStatus.disabled = true;
            document.getElementById('select-solicitar-kit').disabled = true;
            document.getElementById('btn-solicitar-kit').disabled = true;
            document.getElementById('btn-solicitar-kit').textContent = 'Kit Solicitado';
            document.getElementById('select-item-almoxarifado').disabled = true;
            btnEnviarRequisicaoAvulsa.disabled = true;
            btnAbrirEncerramento.disabled = true;
            btnAbrirEncerramento.textContent = 'OS Finalizada';
            btnAbrirEncerramento.style.opacity = '0.5';
        }
    }

    function atualizarVisualStatus(status) {
        badgeStatusGeral.className = 'badge-status';
        selectStatus.value = status === 'Em Andamento' ? 'Em Manutenção' : status;

        if (status === 'Em Andamento') {
            badgeStatusGeral.textContent = 'Em Manutenção';
            badgeStatusGeral.classList.add('status-em-manutencao');
        } else if (status === 'Aguardando Peças') {
            badgeStatusGeral.textContent = 'Aguardando Peças';
            badgeStatusGeral.classList.add('status-aguardando-pecas');
        } else if (status === 'Aguardando Devolução de Ferramentas') {
            badgeStatusGeral.textContent = 'Aguardando Devolução';
            badgeStatusGeral.classList.add('status-devolucao');
        } else if (status === 'Concluído') {
            badgeStatusGeral.textContent = 'Concluído';
            badgeStatusGeral.classList.add('status-concluido');
        } else if (status === 'Aberta') {
            badgeStatusGeral.textContent = 'Aguardando Técnico';
            badgeStatusGeral.classList.add('status-em-manutencao'); // usa cor azul/inicial
        }
    }

    // Função de navegação dinâmica sem reload
    function selecionarOS(o) {
        // Atualiza a OS ativa sem recarregar a página
        activeOS = o;

        // Atualiza a URL no navegador reativamente
        const novaUrl = `${window.location.pathname}?os=${o.codigo_os}`;
        window.history.pushState({ os: o.codigo_os }, '', novaUrl);

        // Re-habilitar controles caso a OS anterior estivesse bloqueada
        selectStatus.disabled = false;
        document.getElementById('select-solicitar-kit').disabled = false;
        document.getElementById('btn-solicitar-kit').disabled = true;
        document.getElementById('btn-solicitar-kit').textContent = 'Solicitar Kit de Ferramentas';
        document.getElementById('select-item-almoxarifado').disabled = false;
        btnEnviarRequisicaoAvulsa.disabled = true;
        btnAbrirEncerramento.disabled = false;
        btnAbrirEncerramento.style.opacity = '1';
        btnAbrirEncerramento.textContent = 'Encerrar Manutenção';

        // Limpa lista de itens avulsos
        listaItensAvulsos = [];

        // Recarrega todos os dados da tela
        carregarDadosOS();
        renderizarListaOSAtribuidas();
        carregarSeletorKits();
        carregarSeletorItensAvulsos();
        atualizarListaInterface();
    }

    // Suporte a navegação com botão voltar do navegador
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.os) {
            const ordens = mockDb.getOrdensServico();
            const os = ordens.find(o => o.codigo_os === event.state.os);
            if (os) selecionarOS(os);
        }
    });

    // Inicializar visualizações
    renderizarListaOSAtribuidas();
    carregarDadosOS();

    // Array interno para gerenciar a lista de materiais sob demanda
    let listaItensAvulsos = [];

    // Alternador Dinâmico das Abas (Kit Padrão vs Itens Avulsos)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(targetTab).classList.remove('hidden');
        });
    });

    // --- LOGICA DE SELEÇÃO E SOLICITAÇÃO DE KITS ---
    function carregarSeletorKits() {
        const selectKit = document.getElementById('select-solicitar-kit');
        if (!selectKit) return;
        selectKit.innerHTML = '<option value="" disabled selected>Selecione um kit...</option>';

        const kits = mockDb.getKitsPadrao();
        kits.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.nome_kit;
            opt.textContent = `${k.nome_kit} (${k.maquina_vinculo})`;
            selectKit.appendChild(opt);
        });

        selectKit.addEventListener('change', (e) => {
            const selectedKitName = e.target.value;
            const kit = kits.find(k => k.nome_kit === selectedKitName);
            const detailBox = document.getElementById('kit-detail-box');
            const btnSolicitar = document.getElementById('btn-solicitar-kit');

            if (kit) {
                document.getElementById('kit-desc-text').textContent = kit.maquina_vinculo;
                document.getElementById('kit-items-text').textContent = kit.ferramentas;
                detailBox.classList.remove('hidden');

                if (activeOS.status_os !== 'Aguardando Devolução de Ferramentas' && activeOS.status_os !== 'Concluído') {
                    btnSolicitar.disabled = false;
                }
            } else {
                detailBox.classList.add('hidden');
                btnSolicitar.disabled = true;
            }
        });
    }
    carregarSeletorKits();

    btnSolicitarKit.addEventListener('click', () => {
        const selectKit = document.getElementById('select-solicitar-kit');
        const nomeKit = selectKit.value;
        if (!nomeKit) return;

        mockDb.saveRequisicao({
            os_codigo: activeOS.codigo_os,
            tecnico_id: user ? user.id : 2,
            tipo: 'Kit Completo',
            item_nome: nomeKit
        });

        alert(`Solicitação de Kit enviada!\nO "${nomeKit}" foi requisitado e está liberado para liberação no Almoxarifado.`);
        
        btnSolicitarKit.textContent = 'Kit Solicitado';
        btnSolicitarKit.disabled = true;
        selectKit.disabled = true;
    });

    // --- LOGICA DE SELEÇÃO E SOLICITAÇÃO DE ITENS AVULSOS ---
    function carregarSeletorItensAvulsos() {
        const selectItem = document.getElementById('select-item-almoxarifado');
        if (!selectItem) return;
        selectItem.innerHTML = '<option value="" disabled selected>Selecione um item...</option>';

        const itens = mockDb.getItensAlmoxarifado();
        // Filtra para exibir ferramentas avulsas e peças de reposição
        const filtrados = itens.filter(i => i.categoria === 'Ferramenta Avulsa' || i.categoria === 'Peça de Reposição');

        filtrados.forEach(i => {
            const opt = document.createElement('option');
            opt.value = i.codigo;
            opt.textContent = `${i.codigo} - ${i.nome} (${i.categoria})`;
            selectItem.appendChild(opt);
        });

        selectItem.addEventListener('change', (e) => {
            const selectedCod = e.target.value;
            const item = itens.find(i => i.codigo === selectedCod);
            const stockBox = document.getElementById('item-stock-box');
            const btnAdd = document.getElementById('btn-add-item-lista');

            if (item) {
                document.getElementById('item-qtd-disponivel').textContent = item.qtd_atual;
                stockBox.classList.remove('hidden');

                if (activeOS.status_os !== 'Aguardando Devolução de Ferramentas' && activeOS.status_os !== 'Concluído') {
                    btnAdd.disabled = false;
                }
            } else {
                stockBox.classList.add('hidden');
                btnAdd.disabled = true;
            }
        });
    }
    carregarSeletorItensAvulsos();

    // Adicionar Item Avulso à Lista Temporária
    btnAddItemLista.addEventListener('click', () => {
        const selectItem = document.getElementById('select-item-almoxarifado');
        const itemCodigo = selectItem.value;
        const inputQtd = document.getElementById('input-item-qtd');
        const qtd = parseInt(inputQtd.value);

        const itens = mockDb.getItensAlmoxarifado();
        const item = itens.find(i => i.codigo === itemCodigo);

        if (!item) {
            alert('Por favor, selecione um item do estoque.');
            return;
        }
        if (isNaN(qtd) || qtd < 1) {
            alert('A quantidade deve ser maior ou igual a 1.');
            return;
        }
        if (qtd > item.qtd_atual) {
            alert(`Quantidade solicitada (${qtd}) é maior que o saldo disponível (${item.qtd_atual}).`);
            return;
        }

        const existente = listaItensAvulsos.find(i => i.codigo === itemCodigo);
        if (existente) {
            if (existente.qtd + qtd > item.qtd_atual) {
                alert(`A soma dos itens adicionados excede o estoque disponível (${item.qtd_atual}).`);
                return;
            }
            existente.qtd += qtd;
        } else {
            listaItensAvulsos.push({ codigo: itemCodigo, nome: item.nome, qtd: qtd });
        }

        inputQtd.value = '1';
        atualizarListaInterface();
    });

    function atualizarListaInterface() {
        listaItensRequisicao.innerHTML = '';

        if (listaItensAvulsos.length === 0) {
            listaItensRequisicao.innerHTML = '<li class="empty-list-notice">Nenhum item adicionado à lista.</li>';
            btnEnviarRequisicaoAvulsa.disabled = true;
            return;
        }

        btnEnviarRequisicaoAvulsa.disabled = false;

        listaItensAvulsos.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span>${item.nome}</span>
                    <span class="item-qtd-badge">${item.qtd}x</span>
                </div>
                <button type="button" class="btn-remove-list-item" data-index="${index}">Remover</button>
            `;
            listaItensRequisicao.appendChild(li);
        });

        document.querySelectorAll('.btn-remove-list-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                listaItensAvulsos.splice(idx, 1);
                atualizarListaInterface();
            });
        });
    }

    // Enviar Requisição Customizada de Itens Avulsos para o Almoxarifado
    btnEnviarRequisicaoAvulsa.addEventListener('click', () => {
        if (listaItensAvulsos.length === 0) return;

        let resumo = 'Itens Solicitados:\n';
        
        listaItensAvulsos.forEach(item => {
            resumo += `- ${item.qtd}x ${item.nome}\n`;
            
            mockDb.saveRequisicao({
                os_codigo: activeOS.codigo_os,
                tecnico_id: user ? user.id : 2,
                tipo: 'Item Avulso',
                item_nome: `${item.qtd}x ${item.nome}`
            });
        });

        alert(`Requisição de Peças/Ferramentas enviada com sucesso!\n\n${resumo}\nA liberação dos materiais foi encaminhada para separação no Almoxarifado.`);

        listaItensAvulsos = [];
        atualizarListaInterface();
        document.getElementById('select-item-almoxarifado').value = '';
        document.getElementById('item-stock-box').classList.add('hidden');
        document.getElementById('btn-add-item-lista').disabled = true;
        carregarSeletorItensAvulsos();
    });

    // Ouvinte do seletor de status em tempo de execução
    selectStatus.addEventListener('change', (e) => {
        const statusSelecionado = e.target.value;

        // Se o técnico selecionar "Concluído", disparar o fluxo de encerramento obrigatório
        if (statusSelecionado === 'Concluído') {
            // Reverter o select visualmente enquanto o modal não confirma
            selectStatus.value = activeOS.status_os === 'Em Andamento' ? 'Em Manutenção' : activeOS.status_os;
            modalRelato.classList.remove('hidden');
            txtRelato.focus();
            return;
        }

        let novoStatus = statusSelecionado;
        // Mapeia o valor visual de volta para o valor do banco
        if (statusSelecionado === 'Em Manutenção') novoStatus = 'Em Andamento';

        mockDb.updateOrdemServico(activeOS.id, { status_os: novoStatus });
        activeOS.status_os = novoStatus;
        
        atualizarVisualStatus(novoStatus);
        alert(`Status da OS #${activeOS.codigo_os} alterado para "${novoStatus}".`);
        renderizarListaOSAtribuidas();
    });

    // Controle de exibição do Modal de Relato Técnico
    btnAbrirEncerramento.addEventListener('click', () => {
        modalRelato.classList.remove('hidden');
        txtRelato.focus();
    });

    btnCancelarModal.addEventListener('click', () => {
        modalRelato.classList.add('hidden');
        formEncerramento.reset();
    });

    modalRelato.addEventListener('click', (e) => {
        if (e.target === modalRelato) {
            modalRelato.classList.add('hidden');
            formEncerramento.reset();
        }
    });

    // Submissão final do encerramento da Ordem de Serviço
    formEncerramento.addEventListener('submit', (e) => {
        e.preventDefault();
        const parecerTecnico = txtRelato.value.trim();

        if (parecerTecnico.length < 10) {
            alert('Por favor, insira uma descrição técnica mais detalhada antes de encerrar.');
            return;
        }

        // Se houver ferramentas solicitadas pendentes de devolução, muda para 'Aguardando Devolução de Ferramentas'
        // Caso contrário, conclui diretamente
        const requisicoes = mockDb.getRequisicoesMateriais().filter(r => r.os_codigo === activeOS.codigo_os);
        const temFerramental = requisicoes.some(r => r.tipo === 'Kit Completo' || r.item_nome.toLowerCase().includes('chave') || r.item_nome.toLowerCase().includes('alicate') || r.item_nome.toLowerCase().includes('multímetro') || r.item_nome.toLowerCase().includes('furadeira'));
        
        const novoStatus = temFerramental ? 'Aguardando Devolução de Ferramentas' : 'Concluído';

        // 1. Atualizar a OS no banco
        mockDb.updateOrdemServico(activeOS.id, {
            status_os: novoStatus,
            diagnostico_tecnico: parecerTecnico,
            data_fechamento: novoStatus === 'Concluído' ? new Date().toISOString() : null
        });

        if (novoStatus === 'Concluído') {
            mockDb.updateEquipamento(activeOS.equipamento_tag, { status_equipamento: 'Operando' });
            
            // Adiciona log histórico
            const techName = user ? user.nome : 'Carlos Silva';
            const materiaisUsados = requisicoes.map(r => r.item_nome);
            
            const dataLog = new Date().toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }).replace(',', ' -');

            mockDb.addHistoricoLog(activeOS.equipamento_tag, {
                data: dataLog,
                tipo: activeOS.tipo_falha,
                tecnico: techName,
                pecas: materiaisUsados.length > 0 ? materiaisUsados : ['Nenhum (Apenas reparo local)'],
                relato: parecerTecnico
            });
        }

        activeOS.status_os = novoStatus;
        activeOS.diagnostico_tecnico = parecerTecnico;

        atualizarVisualStatus(novoStatus);

        selectStatus.disabled = true;
        btnAbrirEncerramento.disabled = true;
        btnAbrirEncerramento.style.opacity = '0.5';
        btnAbrirEncerramento.textContent = novoStatus === 'Concluído' ? 'OS Concluída com Sucesso' : 'OS Finalizada (Aguardando Devolução)';

        modalRelato.classList.add('hidden');
        
        if (novoStatus === 'Concluído') {
            alert('Manutenção finalizada! A máquina foi retornada para o status "Operando" e a OS concluída.');
        } else {
            alert('Manutenção encerrada! O parecer técnico foi registrado e a OS foi alterada para "Aguardando Devolução de Ferramentas".');
        }
        
        renderizarListaOSAtribuidas();
    });
});