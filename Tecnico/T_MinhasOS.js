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

    // Array interno para gerenciar a lista de materiais sob demanda
    let listaItensAvulsos = [];

    // 1. Alternador Dinâmico das Abas (Kit Padrão vs Itens Avulsos)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(targetTab).classList.remove('hidden');
        });
    });

    // 2. Adicionar Item Avulso à Lista Temporária
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

        // Insere no array
        listaItensAvulsos.push({ nome, qtd });
        
        // Reseta campos do formulário interno
        inputItemNome.value = '';
        inputItemQtd.value = '1';
        
        atualizarListaInterface();
        inputItemNome.focus();
    });

    // Função de renderização para atualizar os itens na tela
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

        // Adiciona ouvinte aos novos botões de remoção gerados
        document.querySelectorAll('.btn-remove-list-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                listaItensAvulsos.splice(idx, 1);
                atualizarListaInterface();
            });
        });
    }

    // 3. Enviar Requisição Customizada de Itens Avulsos para o Almoxarifado
    btnEnviarRequisicaoAvulsa.addEventListener('click', () => {
        if (listaItensAvulsos.length === 0) return;

        let resumo = 'Itens Solicitados:\n';
        listaItensAvulsos.forEach(item => {
            resumo += `- ${item.qtd}x ${item.nome}\n`;
        });

        alert(`Requisição de Peças/Ferramentas enviada com sucesso!\n\n${resumo}\nA liberação dos materiais foi encaminhada para separação no Almoxarifado.`);
        
        // Desativa a interface após o envio com sucesso
        inputItemNome.disabled = true;
        inputItemQtd.disabled = true;
        btnAddItemLista.disabled = true;
        btnEnviarRequisicaoAvulsa.textContent = 'Materiais Solicitados';
        btnEnviarRequisicaoAvulsa.disabled = true;
        
        document.querySelectorAll('.btn-remove-list-item').forEach(b => b.remove());
    });

    // 4. Ouvinte do seletor de status em tempo de execução
    selectStatus.addEventListener('change', (e) => {
        const statusSelecionado = e.target.value;
        badgeStatusGeral.className = 'badge-status';

        if (statusSelecionado === 'Em Manutenção') {
            badgeStatusGeral.textContent = 'Em Manutenção';
            badgeStatusGeral.classList.add('status-em-manutencao');
        } else if (statusSelecionado === 'Aguardando Peças') {
            badgeStatusGeral.textContent = 'Aguardando Peças';
            badgeStatusGeral.classList.add('status-aguardando-pecas');
        }
    });

    // 5. Fluxo de solicitação de Kit de Ferramentas Padronizado
    btnSolicitarKit.addEventListener('click', () => {
        alert('Solicitação enviada com sucesso!\nO Kit de Ferramentas Padrão para o modelo de Prensa Hidráulica (MQ-02) foi reservado e está liberado para retirada no balcão do Almoxarifado.');
        
        btnSolicitarKit.textContent = 'Kit Solicitado no Almoxarifado';
        btnSolicitarKit.disabled = true;
        btnSolicitarKit.style.opacity = '0.6';
        btnSolicitarKit.style.cursor = 'not-allowed';
    });

    // 6. Controle de exibição do Modal de Relato Técnico
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

    // 7. Submissão final do encerramento da Ordem de Serviço
    formEncerramento.addEventListener('submit', (e) => {
        e.preventDefault();
        const parecerTecnico = txtRelato.value.trim();

        if (parecerTecnico.length < 10) {
            alert('Por favor, insira uma descrição técnica mais detalhada antes de encerrar.');
            return;
        }

        badgeStatusGeral.className = 'badge-status status-devolucao';
        badgeStatusGeral.textContent = 'Aguardando Devolução do Kit';

        selectStatus.disabled = true;
        btnAbrirEncerramento.disabled = true;
        btnAbrirEncerramento.style.opacity = '0.5';
        btnAbrirEncerramento.textContent = 'OS Finalizada com Sucesso';

        modalRelato.classList.add('hidden');
        alert('Manutenção finalizada!\nO parecer técnico foi registrado e o status da OS foi alterado para "Aguardando Devolução do Kit" no painel do Almoxarifado.');
    });
});