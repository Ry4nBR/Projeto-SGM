// Alm_Painel.js - Controle Dinâmico do Almoxarifado Integrado ao mockDb

document.addEventListener('DOMContentLoaded', () => {

    // 1. Controle de Sessão e Barra Lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        if (spanUser) spanUser.textContent = user.nome;
        if (avatarUser && user.nome) {
            avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
    }

    // 2. Controle de Alternância das Abas de Tela
    const linksAbas = document.querySelectorAll('.tab-link');
    const conteudosAbas = document.querySelectorAll('.tab-content');

    linksAbas.forEach(link => {
        link.addEventListener('click', () => {
            const alvo = link.getAttribute('data-tab');

            linksAbas.forEach(l => l.classList.remove('active'));
            conteudosAbas.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(alvo).classList.add('active');
        });
    });

    // 3. Renderizar Tabelas Dinâmicas
    function renderizarTudo() {
        renderizarInventario();
        renderizarRetiradas();
        renderizarDevolucoes();
    }

    // 3.1. RENDERIZAR INVENTÁRIO
    function renderizarInventario() {
        const itens = mockDb.getItensAlmoxarifado();
        const tbody = document.querySelector('#tab-inventario tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        itens.forEach(item => {
            const tr = document.createElement('tr');
            
            // Lógica de status de disponibilidade
            let indClass = 'ind-disponivel';
            let indText = 'Disponível';
            
            if (item.qtd_atual <= item.qtd_minima && item.qtd_atual > 0) {
                indClass = 'ind-alerta';
                indText = 'Abaixo do Mínimo';
                tr.className = 'row-alert-stock';
            } else if (item.qtd_atual === 0) {
                indClass = 'ind-uso';
                indText = item.categoria === 'Kit Ferramentas' ? 'Em Uso / Indisponível' : 'Esgotado / Indisponível';
                tr.className = 'row-alert-stock';
            }

            tr.innerHTML = `
                <td class="col-id">${item.codigo}</td>
                <td><strong>${item.nome}</strong></td>
                <td>${item.categoria}</td>
                <td class="${item.qtd_atual <= item.qtd_minima ? 'stock-critical' : ''}">${item.qtd_atual} un</td>
                <td>${item.qtd_minima} un</td>
                <td>${item.localizacao}</td>
                <td><span class="indicator ${indClass}">${indText}</span></td>
            `;

            tbody.appendChild(tr);
        });
    }

    // 3.2. RENDERIZAR RETIRADAS (FILA GERAL DE LIBERAÇÃO)
    function renderizarRetiradas() {
        const requisicoes = mockDb.getRequisicoesMateriais();
        const usuarios = mockDb.getUsuarios();
        const tbody = document.querySelector('#tab-movimentacao table:first-of-type tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Filtra apenas requisições pendentes
        const pendentes = requisicoes.filter(r => r.status_requisicao === 'Pendente');

        if (pendentes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 24px;">
                        Nenhuma requisição de liberação física pendente no balcão.
                    </td>
                </tr>`;
            return;
        }

        pendentes.forEach(req => {
            const tech = usuarios.find(u => u.id === req.tecnico_id);
            const nomeTecnico = tech ? tech.nome : 'Carlos Silva';

            const badgeClass = req.tipo === 'Kit Completo' ? 'type-kit' : 'type-avulso';
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><span class="badge-type ${badgeClass}">${req.tipo}</span></td>
                <td class="col-id">#${req.os_codigo}</td>
                <td><strong>${nomeTecnico}</strong></td>
                <td><span class="item-name">${req.item_nome}</span></td>
                <td>
                    <button class="btn-action btn-dispensar" data-id="${req.id}" data-item="${req.item_nome}" data-os="${req.os_codigo}">
                        Baixar e Entregar
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Ouvintes de evento de dispensa
        tbody.querySelectorAll('.btn-dispensar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reqId = e.target.getAttribute('data-id');
                const itemNome = e.target.getAttribute('data-item');
                const osCodigo = e.target.getAttribute('data-os');
                
                dispensarItemLogica(reqId, itemNome, osCodigo);
            });
        });
    }

    // 3.3. RENDERIZAR DEVOLUÇÕES (CAUTELAS ATIVAS)
    function renderizarDevolucoes() {
        const cautelas = mockDb.getControleFerramental();
        const usuarios = mockDb.getUsuarios();
        const tbody = document.querySelector('#tab-movimentacao table:last-of-type tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const ativas = cautelas.filter(c => c.status_ativo === 'Em campo com técnico');

        if (ativas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 24px;">
                        Nenhuma pendência de devolução física de ferramentas/kits.
                    </td>
                </tr>`;
            return;
        }

        ativas.forEach(cautela => {
            const tech = usuarios.find(u => u.id === cautela.tecnico_id);
            const nomeTecnico = tech ? tech.nome : 'Carlos Silva';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="col-id">${cautela.codigo_retorno}</td>
                <td>${nomeTecnico}</td>
                <td>${cautela.item_nome}</td>
                <td><span class="badge-status status-aguardando">${cautela.status_ativo}</span></td>
                <td>
                    <button class="btn-action btn-confirmar" data-id="${cautela.id}" data-item="${cautela.item_nome}" data-os="${cautela.os_codigo || ''}">
                        Confirmar Recebimento Físico
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Ouvinte de devolução
        tbody.querySelectorAll('.btn-confirmar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cautelaId = e.target.getAttribute('data-id');
                const itemNome = e.target.getAttribute('data-item');
                
                confirmarDevolucaoLogica(cautelaId, itemNome);
            });
        });
    }

    // 4. Lógica de Dispensar Material (Baixar e entregar)
    function dispensarItemLogica(reqId, itemNome, osCodigo) {
        if (confirm(`Confirmar a entrega física e dar baixa no estoque para:\n"${itemNome}"?`)) {
            // 1. Atualiza status da requisição
            mockDb.updateRequisicao(reqId, { status_requisicao: 'Liberado' });

            // 2. Dar baixa física no estoque
            const itens = mockDb.getItensAlmoxarifado();
            
            // Tenta encontrar o item pelo nome completo ou aproximado no inventário
            const itemEstoque = itens.find(i => 
                i.nome.toLowerCase() === itemNome.toLowerCase() || 
                itemNome.toLowerCase().includes(i.nome.toLowerCase()) ||
                i.nome.toLowerCase().includes(itemNome.toLowerCase())
            );

            if (itemEstoque) {
                // Se for avulso, podemos descontar a quantidade que vem no texto (ex: "2x Contator")
                let qtdADescontar = 1;
                const matchQtd = itemNome.match(/^(\d+)x/);
                if (matchQtd) {
                    qtdADescontar = parseInt(matchQtd[1]);
                }
                
                mockDb.updateItemAlmoxarifado(itemEstoque.codigo, {
                    qtd_atual: Math.max(0, itemEstoque.qtd_atual - qtdADescontar)
                });
            }

            // 3. Se for Kit Padrão, atualizar a tabela de kits
            const kits = mockDb.getKitsPadrao();
            const kit = kits.find(k => k.nome_kit.toLowerCase() === itemNome.toLowerCase());
            if (kit) {
                // Atualiza status do kit
                const kitsAtualizados = kits.map(k => {
                    if (k.id === kit.id) {
                        return { ...k, status: `Em uso na OS #${osCodigo}` };
                    }
                    return k;
                });
                localStorage.setItem(mockDb.KEYS.KITS_PADRAO, JSON.stringify(kitsAtualizados));
            }

            alert('Retirada registrada no Almoxarifado! Estoque atualizado física e logicamente.');
            renderizarTudo();
        }
    }

    // 5. Lógica de Receber Devolução (Confirmar recebimento físico)
    function confirmarDevolucaoLogica(cautelaId, itemNome) {
        if (confirm(`Confirmar recebimento físico e retorno ao estoque do item:\n"${itemNome}"?`)) {
            // 1. Atualizar cautela no banco de dados
            const cautelas = mockDb.getControleFerramental();
            const indexCautela = cautelas.findIndex(c => c.id === parseInt(cautelaId));
            let cautela = null;

            if (indexCautela !== -1) {
                cautelas[indexCautela].status_ativo = 'Devolvido';
                cautelas[indexCautela].data_devolucao = new Date().toISOString();
                cautela = cautelas[indexCautela];
                localStorage.setItem(mockDb.KEYS.CONTROLE_FERRAMENTAL, JSON.stringify(cautelas));
            }

            // 2. Incrementar estoque no inventário
            const itens = mockDb.getItensAlmoxarifado();
            const itemEstoque = itens.find(i => 
                i.nome.toLowerCase() === itemNome.toLowerCase() || 
                itemNome.toLowerCase().includes(i.nome.toLowerCase()) ||
                i.nome.toLowerCase().includes(itemNome.toLowerCase())
            );

            if (itemEstoque) {
                mockDb.updateItemAlmoxarifado(itemEstoque.codigo, {
                    qtd_atual: itemEstoque.qtd_atual + 1
                });
            }

            // 3. Se for kit, voltar status do kit para Disponível
            const kits = mockDb.getKitsPadrao();
            const kit = kits.find(k => k.nome_kit.toLowerCase() === itemNome.toLowerCase());
            if (kit) {
                const kitsAtualizados = kits.map(k => {
                    if (k.id === kit.id) {
                        return { ...k, status: 'Disponível' };
                    }
                    return k;
                });
                localStorage.setItem(mockDb.KEYS.KITS_PADRAO, JSON.stringify(kitsAtualizados));
            }

            // 4. Encontrar a OS vinculada e finalizá-la (Concluído)
            // Para encontrar, pegamos as requisições liberadas dessa OS
            const requisicoes = mockDb.getRequisicoesMateriais();
            let reqVinculada = null;
            if (cautela) {
                reqVinculada = requisicoes.find(r => r.id === cautela.requisicao_id);
            }

            if (reqVinculada) {
                const osCodigo = reqVinculada.os_codigo;
                const ordens = mockDb.getOrdensServico();
                const os = ordens.find(o => o.codigo_os === osCodigo);

                if (os) {
                    // Atualiza status da OS para Concluído
                    mockDb.updateOrdemServico(os.id, {
                        status_os: 'Concluído',
                        data_fechamento: new Date().toISOString()
                    });

                    // Atualiza máquina para 'Operando'
                    mockDb.updateEquipamento(os.equipamento_tag, { status_equipamento: 'Operando' });

                    // 5. Gerar Log no Histórico da Máquina
                    const usuarios = mockDb.getUsuarios();
                    const tech = usuarios.find(u => u.id === os.tecnico_id);
                    const techName = tech ? tech.nome : 'Carlos Silva';

                    // Coleta todos os materiais usados nessa OS
                    const materiaisUsados = requisicoes
                        .filter(r => r.os_codigo === osCodigo)
                        .map(r => r.item_nome);

                    const dataLog = new Date().toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }).replace(',', ' -');

                    mockDb.addHistoricoLog(os.equipamento_tag, {
                        data: dataLog,
                        tipo: os.tipo_falha,
                        tecnico: techName,
                        pecas: materiaisUsados.length > 0 ? materiaisUsados : ['Nenhum (Apenas ajuste/limpeza)'],
                        relato: os.diagnostico_tecnico || 'Intervenção concluída com sucesso e retorno de ferramentas validado pelo Almoxarifado.'
                    });

                    alert(`Recebimento físico confirmado!\nA OS #${osCodigo} associada foi alterada para "Concluído" e as informações integradas no histórico do Administrador.`);
                }
            } else {
                alert('Material devolvido e adicionado com sucesso ao estoque!');
            }

            renderizarTudo();
        }
    }

    // 6. Upload de Arquivos de Nota Fiscal Eletrônica (NF-e)
    const areaDropzone = document.getElementById('area-dropzone');
    const inputArquivoXml = document.getElementById('file-xml-input');

    areaDropzone.addEventListener('click', () => {
        inputArquivoXml.click();
    });

    inputArquivoXml.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const nomeArquivo = e.target.files[0].name;
            
            // Simular entrada em lote via XML da NF-e
            // Aumenta o estoque dos itens cadastrados para demonstrar funcionalidade
            const itens = mockDb.getItensAlmoxarifado();
            
            itens.forEach(item => {
                // Incrementa estoque em lote (peças +10, ferramentas +5)
                const incremento = item.categoria === 'Peça de Reposição' ? 10 : 5;
                mockDb.updateItemAlmoxarifado(item.codigo, {
                    qtd_atual: item.qtd_atual + incremento
                });
            });

            alert(`XML de Nota Fiscal Identificado: "${nomeArquivo}"\nProcessando itens cadastrados e atualizando saldos de estoque automaticamente...`);
            alert('Operação finalizada! Saldo de ferramentas e peças renovados com sucesso (Lote adicionado via NF-e XML).');
            
            inputArquivoXml.value = '';
            renderizarTudo();
        }
    });

    // 7. Entrada de Peças Manual
    const formManual = document.getElementById('form-cadastro-manual');
    formManual.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nomeItem = document.getElementById('txt-nome-item').value.trim();
        const qtdInicial = parseInt(document.getElementById('txt-qtd-inicial').value);
        const qtdMinima = parseInt(document.getElementById('txt-qtd-minima').value);

        // Verifica se já existe um item com esse nome no estoque
        const itens = mockDb.getItensAlmoxarifado();
        const itemExistente = itens.find(i => i.nome.toLowerCase() === nomeItem.toLowerCase());

        if (itemExistente) {
            // Apenas atualiza a quantidade somando
            mockDb.updateItemAlmoxarifado(itemExistente.codigo, {
                qtd_atual: itemExistente.qtd_atual + qtdInicial,
                qtd_minima: qtdMinima
            });
            alert(`Sucesso! O saldo do item existente "${itemExistente.nome}" foi incrementado em +${qtdInicial} un.`);
        } else {
            // Cria um novo item no inventário
            mockDb.saveItemAlmoxarifado({
                nome: nomeItem,
                categoria: 'Peça de Reposição',
                qtd_atual: qtdInicial,
                qtd_minima: qtdMinima,
                localizacao: 'Armário Geral C - Prateleira 4'
            });
            alert(`Sucesso! O novo componente "${nomeItem}" foi adicionado com sucesso ao inventário da fábrica.`);
        }

        formManual.reset();
        renderizarTudo();
    });

    // Inicializa a renderização de todas as abas
    renderizarTudo();
});