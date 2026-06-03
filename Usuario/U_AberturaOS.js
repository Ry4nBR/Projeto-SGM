document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-os');
    const radioStatus = document.querySelectorAll('input[name="status_maquina"]');
    const panelCriticidade = document.getElementById('panel-criticidade');
    const valueCriticidade = document.getElementById('criticidade-value');
    const selectMaquina = document.getElementById('select-maquina');

    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-logo span') || document.querySelector('.sidebar span');
        if (spanUser) spanUser.textContent = user.nome;
    }

    // 2. Carregar seletor de máquinas dinamicamente a partir do mockDb
    function carregarMaquinas() {
        if (!selectMaquina) return;
        selectMaquina.innerHTML = '<option value="" disabled selected>Selecione a máquina...</option>';
        const equipamentos = mockDb.getEquipamentos();
        equipamentos.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.tag;
            opt.textContent = `${eq.tag} - ${eq.nome}`;
            selectMaquina.appendChild(opt);
        });
    }
    carregarMaquinas();

    // Mapeamento dinâmico de criticidade baseado nas escolhas do chão de fábrica
    function atualizarCriticidade() {
        let statusSelecionado = '';

        radioStatus.forEach(radio => {
            if (radio.checked) {
                statusSelecionado = radio.value;
            }
        });

        // Aplica a lógica automática de criticidade exigida pelo escopo
        if (statusSelecionado === 'parada') {
            panelCriticidade.className = 'criticidade-box status-alta';
            valueCriticidade.textContent = 'ALTA (Parada Crítica)';
        } else if (statusSelecionado === 'restricao') {
            panelCriticidade.className = 'criticidade-box status-media';
            valueCriticidade.textContent = 'MÉDIA (Alerta Operacional)';
        } else if (statusSelecionado === 'baixa') {
            panelCriticidade.className = 'criticidade-box status-baixa';
            valueCriticidade.textContent = 'BAIXA (Não Urgente)';
        } else {
            panelCriticidade.className = 'criticidade-box status-empty';
            valueCriticidade.textContent = 'Aguardando Seleção';
        }
    }

    // Ouvinte de evento para capturar as mudanças nos cards de status
    radioStatus.forEach(radio => {
        radio.addEventListener('change', atualizarCriticidade);
    });

    // Envio real persistente no mockDb
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const maquinaTag = selectMaquina.value;
        const condicao = document.querySelector('input[name="status_maquina"]:checked').value;
        const criticidadeTexto = valueCriticidade.textContent;
        // Pega 'Alta', 'Média' ou 'Baixa'
        const criticidadeCalculada = criticidadeTexto.includes('ALTA') ? 'Alta' : (criticidadeTexto.includes('MÉDIA') ? 'Média' : 'Baixa');

        const dadosFormulario = {
            equipamento_tag: maquinaTag,
            setor: document.getElementById('select-setor').value,
            tipo_falha: document.getElementById('select-especialidade').value,
            descricao_problema: document.getElementById('txt-descricao').value,
            condicao_maquina: condicao,
            criticidade: criticidadeCalculada,
            solicitante_id: user ? user.id : 3 // fallback para o id 3 (Wanderillo) se sem login
        };

        // Salvar OS
        const novaOS = mockDb.saveOrdemServico(dadosFormulario);

        // Se a máquina estiver parada, atualiza seu status no cadastro
        if (condicao === 'parada') {
            mockDb.updateEquipamento(maquinaTag, { status_equipamento: 'Parado' });
        } else {
            mockDb.updateEquipamento(maquinaTag, { status_equipamento: 'Em Manutenção' });
        }

        alert(`Ordem de Serviço enviada com sucesso! Código gerado: ${novaOS.codigo_os}`);

        // Reseta o formulário e o painel de criticidade
        form.reset();
        atualizarCriticidade();
    });
});