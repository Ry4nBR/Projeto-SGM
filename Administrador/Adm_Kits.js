// Adm_Kits.js - Engenharia de Kits Reativa integrado ao mockDb

document.addEventListener('DOMContentLoaded', () => {

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

    // Captura dos formulários operacionais e tabela
    const formItemIndividual = document.getElementById('form-add-item-individual');
    const formMontarKit = document.getElementById('form-build-kit');
    const selectMaquina = document.getElementById('sel-kit-machine');
    const checklistContainer = document.querySelector('.checkbox-list-container');
    const tabelaKitsCorpo = document.getElementById('table-kits-status').querySelector('tbody');

    // 2. Preencher seletor de máquinas dinamicamente
    function carregarMaquinasParaKits() {
        if (!selectMaquina) return;
        selectMaquina.innerHTML = '<option value="" disabled selected>Vincular a uma máquina...</option>';
        
        const maquinas = mockDb.getEquipamentos();
        maquinas.forEach(m => {
            const opt = document.createElement('option');
            opt.value = `${m.nome} (${m.tag})`;
            opt.textContent = `${m.nome} (${m.tag})`;
            selectMaquina.appendChild(opt);
        });
        
        const optGeral = document.createElement('option');
        optGeral.value = 'Uso Geral na Planta';
        optGeral.textContent = 'Uso Geral na Planta';
        selectMaquina.appendChild(optGeral);
    }

    // 3. Preencher o checklist de ferramentas dinamicamente do inventário do almoxarifado
    function carregarChecklistFerramentas() {
        if (!checklistContainer) return;
        checklistContainer.innerHTML = '';

        const itens = mockDb.getItensAlmoxarifado();
        // Filtra apenas itens que são ferramentas ou avulsos
        const ferramentas = itens.filter(i => i.categoria === 'Ferramenta Avulsa' || i.categoria === 'Kit Ferramentas');

        if (ferramentas.length === 0) {
            checklistContainer.innerHTML = '<p style="font-size:11px; color:var(--neutral-medium); font-style:italic;">Nenhuma ferramenta cadastrada no Almoxarifado.</p>';
            return;
        }

        ferramentas.forEach(f => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `
                <input type="checkbox" name="kit-components" value="${f.nome}">
                ${f.nome}
            `;
            checklistContainer.appendChild(label);
        });
    }

    // 4. Renderizar a tabela de Kits dinamicamente
    function renderizarTabelaKits() {
        if (!tabelaKitsCorpo) return;
        tabelaKitsCorpo.innerHTML = '';

        const kits = mockDb.getKitsPadrao();

        kits.forEach(kit => {
            const tr = document.createElement('tr');
            
            // Lógica de badge de status
            let badgeClass = 'status-disponivel';
            if (kit.status !== 'Disponível') {
                badgeClass = 'status-em-uso';
            }

            tr.innerHTML = `
                <td><strong>${kit.nome_kit}</strong></td>
                <td>${kit.maquina_vinculo}</td>
                <td>${kit.ferramentas}</td>
                <td><span class="badge-status ${badgeClass}">${kit.status}</span></td>
            `;
            tabelaKitsCorpo.appendChild(tr);
        });
    }

    // 5. Escuta do envio do formulário de Cadastro de Ferramentas/Itens Avulsos
    formItemIndividual.addEventListener('submit', (e) => {
        e.preventDefault();

        const nomeItem = document.getElementById('txt-item-name').value.trim();
        const qtdEstoque = parseInt(document.getElementById('num-item-stock').value);
        const tipoAtivo = document.getElementById('sel-item-type').value; // 'Ferramenta' ou 'Peça de Reposição'

        // Converte o tipo de ativo para a categoria do banco de dados
        let categoriaMapeada = 'Ferramenta Avulsa';
        if (tipoAtivo === 'Peça de Reposição') {
            categoriaMapeada = 'Peça de Reposição';
        }

        // Salva no banco de dados local
        mockDb.saveItemAlmoxarifado({
            nome: nomeItem,
            categoria: categoriaMapeada,
            qtd_atual: qtdEstoque,
            qtd_minima: 1,
            localizacao: 'Armário Geral C - Engenharia'
        });

        alert(`Sucesso no Inventário!\nItem: "${nomeItem}" (${categoriaMapeada})\nQuantidade inserida: ${qtdEstoque} unidades.\nO estoque foi atualizado.`);

        formItemIndividual.reset();
        
        // Recarregar checklists e tabela
        carregarChecklistFerramentas();
        renderizarTabelaKits();
    });

    // 6. Escuta do envio do formulário de Engenharia e Montagem de Kits Padrão
    formMontarKit.addEventListener('submit', (e) => {
        e.preventDefault();

        const nomeKit = document.getElementById('txt-kit-name').value.trim();
        const maquinaVinculo = selectMaquina.value;

        // Coleta quais checkboxes de ferramentas integrantes foram marcadas
        const checkboxesComponentes = document.querySelectorAll('input[name="kit-components"]:checked');

        if (checkboxesComponentes.length === 0) {
            alert('Aviso Operacional:\nPor favor, selecione ao menos 1 ferramenta integrante para compor o Kit Padrão.');
            return;
        }

        // Transforma a coleção de nós selecionados em uma string separada por vírgula
        const arrayComponentesNames = [];
        checkboxesComponentes.forEach(cb => {
            arrayComponentesNames.push(cb.value);
        });
        const componentesString = arrayComponentesNames.join(', ');

        // Salvar kit padrão no mockDb
        mockDb.saveKitPadrao({
            nome_kit: nomeKit,
            maquina_vinculo: maquinaVinculo,
            ferramentas: componentesString,
            status: 'Disponível'
        });

        // Opcional: cria o Kit como um item indisponível ou zerado no Almoxarifado para ser "Liberado" pelo almoxarife
        mockDb.saveItemAlmoxarifado({
            nome: nomeKit,
            categoria: 'Kit Ferramentas',
            qtd_atual: 1, // começa com 1 disponível
            qtd_minima: 1,
            localizacao: 'Carrinho Móvel Geral'
        });

        alert(`Kit Padronizado Ativado!\nO "${nomeKit}" foi criado e estruturado com sucesso no banco de dados, mapeado para a máquina: ${maquinaVinculo}.`);

        // Reseta o formulário
        formMontarKit.reset();
        
        // Recarrega checklists e tabela
        carregarChecklistFerramentas();
        renderizarTabelaKits();
    });

    // Inicialização da tela
    carregarMaquinasParaKits();
    carregarChecklistFerramentas();
    renderizarTabelaKits();
});