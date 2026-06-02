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
    const inputItemNome = document.getElementById('input-item-nome');
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

    if (!activeOS) {
        alert('Nenhuma Ordem de Serviço ativa encontrada para execução.');
        return;
    }

    // 2. Preencher os dados dinâmicos da OS na interface
    function carregarDadosOS() {
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

        // Definir estado do seletor e do badge de status
        atualizarVisualStatus(activeOS.status_os);

        // Bloquear controles se já estiver finalizada ou aguardando devolução
        if (activeOS.status_os === 'Aguardando Devolução de Ferramentas' || activeOS.status_os === 'Concluído') {
            selectStatus.disabled = true;
            btnSolicitarKit.disabled = true;
            btnSolicitarKit.textContent = 'Kit Solicitado';
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
        }
    }

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

    // Adicionar Item Avulso à Lista Temporária
    btnAddItemLista.addEventListener('click', () => {
        const nome = inputItemNome.value.trim();
        const qtd = parseInt(inputItemQtd.value);

        if (!nome) {
            alert('Por favor, informe a descrição do item ou ferramenta.');
            return;
        }
        if (isNaN(qtd) || qtd < 1) {
            alert('A quantidade inserida deve ser maior ou igual a 1.');
            return;
        }

        listaItensAvulsos.push({ nome, qtd });
        inputItemNome.value = '';
        inputItemQtd.value = '1';

        atualizarListaInterface();
        inputItemNome.focus();
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
        
        // Registra requisições no mockDb
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

        inputItemNome.disabled = true;
        inputItemQtd.disabled = true;
        btnAddItemLista.disabled = true;
        btnEnviarRequisicaoAvulsa.textContent = 'Materiais Solicitados';
        btnEnviarRequisicaoAvulsa.disabled = true;

        document.querySelectorAll('.btn-remove-list-item').forEach(b => b.remove());
    });

    // Ouvinte do seletor de status em tempo de execução
    selectStatus.addEventListener('change', (e) => {
        const statusSelecionado = e.target.value;
        let novoStatus = 'Em Andamento';
        
        if (statusSelecionado === 'Aguardando Peças') {
            novoStatus = 'Aguardando Peças';
        }

        // Atualizar no banco
        mockDb.updateOrdemServico(activeOS.id, { status_os: novoStatus });
        activeOS.status_os = novoStatus;
        
        // Atualiza UI
        atualizarVisualStatus(novoStatus);
        alert(`Status da OS #${activeOS.codigo_os} alterado para "${novoStatus}".`);
    });

    // Fluxo de solicitação de Kit de Ferramentas Padronizado
    btnSolicitarKit.addEventListener('click', () => {
        // Encontra o kit padrão adequado para a máquina
        const kits = mockDb.getKitsPadrao();
        const kitEncontrado = kits.find(k => k.maquina_vinculo.includes(activeOS.equipamento_tag)) || kits[0];
        const nomeKit = kitEncontrado ? kitEncontrado.nome_kit : 'Kit Padrão Mecânica Avançada #02';

        // Salvar no mockDb
        mockDb.saveRequisicao({
            os_codigo: activeOS.codigo_os,
            tecnico_id: user ? user.id : 2,
            tipo: 'Kit Completo',
            item_nome: nomeKit
        });

        alert(`Solicitação enviada com sucesso!\nO "${nomeKit}" foi reservado e está liberado para retirada no balcão do Almoxarifado.`);

        btnSolicitarKit.textContent = 'Kit Solicitado no Almoxarifado';
        btnSolicitarKit.disabled = true;
        btnSolicitarKit.style.opacity = '0.6';
        btnSolicitarKit.style.cursor = 'not-allowed';
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

        const novoStatus = 'Aguardando Devolução de Ferramentas';

        // 1. Atualizar a OS no banco
        mockDb.updateOrdemServico(activeOS.id, {
            status_os: novoStatus,
            diagnostico_tecnico: parecerTecnico,
            data_fechamento: new Date().toISOString()
        });

        // 2. Criar cautela correspondente de retorno se houve Kit Solicitado
        const requisicoes = mockDb.getRequisicoesMateriais().filter(r => r.os_codigo === activeOS.codigo_os);
        const kitRequisitado = requisicoes.find(r => r.tipo === 'Kit Completo');
        
        if (kitRequisitado) {
            mockDb.saveControleFerramental({
                requisicao_id: kitRequisitado.id,
                tecnico_id: user ? user.id : 2,
                item_codigo: 'FE-0112',
                item_nome: kitRequisitado.item_nome,
                status_ativo: 'Em campo com técnico'
            });
        }

        activeOS.status_os = novoStatus;
        activeOS.diagnostico_tecnico = parecerTecnico;

        // Atualizar UI
        atualizarVisualStatus(novoStatus);

        selectStatus.disabled = true;
        btnAbrirEncerramento.disabled = true;
        btnAbrirEncerramento.style.opacity = '0.5';
        btnAbrirEncerramento.textContent = 'OS Finalizada com Sucesso';

        modalRelato.classList.add('hidden');
        alert('Manutenção finalizada!\nO parecer técnico foi registrado e o status da OS foi alterado para "Aguardando Devolução de Ferramentas" no painel do Almoxarifado.');
    });
});