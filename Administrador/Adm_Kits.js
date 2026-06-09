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

    // 3. Preencher o checklist de ferramentas e peças dinamicamente do inventário do almoxarifado
    function carregarChecklistFerramentas() {
        if (!checklistContainer) return;
        checklistContainer.innerHTML = '';

        const itens = mockDb.getItensAlmoxarifado();
        // Filtra ferramentas avulsas E peças de reposição (conforme plano)
        const componentes = itens.filter(i => i.categoria === 'Ferramenta Avulsa' || i.categoria === 'Peça de Reposição');

        if (componentes.length === 0) {
            checklistContainer.innerHTML = '<p style="font-size:11px; color:var(--neutral-medium); font-style:italic;">Nenhum componente cadastrado no Almoxarifado.</p>';
            return;
        }

        componentes.forEach(f => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `
                <input type="checkbox" name="kit-components" value="${f.nome}">
                ${f.nome} <small style="color:#999;">(${f.categoria})</small>
            `;
            checklistContainer.appendChild(label);
        });
    }

    // 4. Renderizar a tabela de Kits dinamicamente com rastreabilidade completa
    function renderizarTabelaKits() {
        if (!tabelaKitsCorpo) return;
        tabelaKitsCorpo.innerHTML = '';

        const kits = mockDb.getKitsPadrao();
        const cautelas = mockDb.getControleFerramental();
        const usuarios = mockDb.getUsuarios();

        if (kits.length === 0) {
            tabelaKitsCorpo.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 24px;">
                        Nenhum kit padronizado cadastrado no sistema.
                    </td>
                </tr>`;
            return;
        }

        kits.forEach(kit => {
            const tr = document.createElement('tr');

            // Buscar cautela ativa para este kit
            const cautelaAtiva = cautelas.find(c => 
                c.item_nome.toLowerCase() === kit.nome_kit.toLowerCase() && 
                c.status_ativo === 'Em campo com técnico'
            );

            let statusText = 'Disponível';
            let badgeClass = 'status-disponivel';
            let osVinculada = '—';
            let tecnicoResp = '—';
            let dataRetirada = '—';

            if (cautelaAtiva) {
                statusText = 'Em uso';
                badgeClass = 'status-em-uso';
                osVinculada = cautelaAtiva.os_codigo ? `#${cautelaAtiva.os_codigo}` : '—';
                const tecnico = usuarios.find(u => u.id === cautelaAtiva.tecnico_id);
                tecnicoResp = tecnico ? tecnico.nome : 'Técnico';
                if (cautelaAtiva.data_retirada) {
                    try {
                        dataRetirada = new Date(cautelaAtiva.data_retirada).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                    } catch (e) { dataRetirada = '—'; }
                }
            } else if (kit.status && kit.status.includes('uso')) {
                statusText = 'Em uso';
                badgeClass = 'status-em-uso';
                // Tenta extrair OS do status textual legado
                const matchOS = kit.status.match(/#(\S+)/);
                if (matchOS) osVinculada = `#${matchOS[1]}`;
            }

            const descricao = kit.descricao || kit.desc || '—';

            tr.innerHTML = `
                <td><strong>${kit.nome_kit}</strong></td>
                <td>${descricao}</td>
                <td>${kit.maquina_vinculo}</td>
                <td>${kit.ferramentas}</td>
                <td><span class="badge-status ${badgeClass}">${statusText}</span></td>
                <td>${osVinculada}</td>
                <td>${tecnicoResp}</td>
                <td>${dataRetirada}</td>
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
        const descricaoKit = document.getElementById('txt-kit-desc') ? document.getElementById('txt-kit-desc').value.trim() : '';

        // Coleta quais checkboxes de componentes foram marcadas
        const checkboxesComponentes = document.querySelectorAll('input[name="kit-components"]:checked');

        if (checkboxesComponentes.length === 0) {
            alert('Aviso Operacional:\nPor favor, selecione ao menos 1 componente para compor o Kit Padrão.');
            return;
        }

        // Transforma a coleção de nós selecionados em uma string separada por vírgula
        const arrayComponentesNames = [];
        checkboxesComponentes.forEach(cb => {
            arrayComponentesNames.push(cb.value);
        });
        const componentesString = arrayComponentesNames.join(', ');

        // Salvar kit padrão no mockDb com descrição
        mockDb.saveKitPadrao({
            nome_kit: nomeKit,
            maquina_vinculo: maquinaVinculo,
            ferramentas: componentesString,
            descricao: descricaoKit,
            status: 'Disponível'
        });

        // Cria o Kit como um item no Almoxarifado
        mockDb.saveItemAlmoxarifado({
            nome: nomeKit,
            categoria: 'Kit Ferramentas',
            qtd_atual: 1,
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