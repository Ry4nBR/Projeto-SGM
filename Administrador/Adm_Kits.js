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
    const formCadastroMaquina = document.getElementById('form-cadastro-maquina');
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
        // Filtra apenas itens que são ferramentas avulsas (exclui kits)
        const ferramentas = itens.filter(i => i.categoria === 'Ferramenta Avulsa');

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
        const itensAlmoxarifado = mockDb.getItensAlmoxarifado();
        const cautelas = mockDb.getControleFerramental();
        const usuarios = mockDb.getUsuarios();

        kits.forEach(kit => {
            const tr = document.createElement('tr');
            
            // Correlaciona com inventário físico
            const itemEstoque = itensAlmoxarifado.find(i => i.nome.toLowerCase() === kit.nome_kit.toLowerCase());
            const qtdEstoque = itemEstoque ? `${itemEstoque.qtd_atual} un` : '0 un';

            // Correlaciona com cautelas físicas ativas
            const cautelaAtiva = cautelas.find(c => 
                c.item_nome.toLowerCase() === kit.nome_kit.toLowerCase() && 
                c.status_ativo === 'Em campo com técnico'
            );

            let statusRastreabilidade = 'Disponível';
            let badgeClass = 'status-disponivel';

            if (cautelaAtiva) {
                const tecnico = usuarios.find(u => u.id === cautelaAtiva.tecnico_id);
                const nomeTecnico = tecnico ? tecnico.nome : 'Técnico';
                statusRastreabilidade = `Com ${nomeTecnico} na OS #${cautelaAtiva.os_codigo}`;
                badgeClass = 'status-em-uso';
            } else if (itemEstoque && itemEstoque.qtd_atual === 0) {
                statusRastreabilidade = 'Indisponível';
                badgeClass = 'status-em-uso';
            } else if (kit.status && kit.status.includes('uso')) {
                statusRastreabilidade = kit.status;
                badgeClass = 'status-em-uso';
            }

            tr.innerHTML = `
                <td><strong>${kit.nome_kit}</strong></td>
                <td>${kit.maquina_vinculo}</td>
                <td>${kit.ferramentas}</td>
                <td>${qtdEstoque}</td>
                <td><span class="badge-status ${badgeClass}">${statusRastreabilidade}</span></td>
            `;
            tabelaKitsCorpo.appendChild(tr);
        });
    }

    // 5. Escuta do envio do formulário de Cadastro de Máquinas
    formCadastroMaquina.addEventListener('submit', (e) => {
        e.preventDefault();

        const codigo = document.getElementById('txt-maq-codigo').value.trim().toUpperCase();
        const nome = document.getElementById('txt-maq-nome').value.trim();
        const setor = document.getElementById('sel-maq-setor').value;
        const fabricante = document.getElementById('txt-maq-fabricante').value.trim();
        const modelo = document.getElementById('txt-maq-modelo').value.trim();
        const serie = document.getElementById('txt-maq-serie').value.trim();
        const aquisicao = document.getElementById('txt-maq-aquisicao').value;
        const nf = document.getElementById('txt-maq-nf').value.trim();
        const descricao = document.getElementById('txt-maq-desc').value.trim();
        const status = document.getElementById('sel-maq-status').value;

        // Valida se já existe uma máquina com esse código (TAG)
        const maquinas = mockDb.getEquipamentos();
        if (maquinas.some(m => m.tag === codigo)) {
            alert(`Erro: Já existe uma máquina cadastrada com a TAG ${codigo}.`);
            return;
        }

        // Salva no banco de dados local
        mockDb.saveEquipamento({
            tag: codigo,
            nome: nome,
            setor: setor,
            fabricante: fabricante,
            modelo: modelo,
            num_serie: serie,
            data_aquisicao: aquisicao,
            nf: nf,
            descricao: descricao,
            status_equipamento: status,
            critico: status === 'Parado' || status === 'Em Manutenção'
        });

        alert(`Sucesso! A máquina "${nome}" (${codigo}) foi cadastrada e ativada.`);

        formCadastroMaquina.reset();
        
        // Recarregar seletor de máquinas no bloco de kits
        carregarMaquinasParaKits();
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