// Adm_Historico.js - Histórico de Máquinas Reativo integrado ao mockDb

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

    // Mapeamento de elementos da DOM
    const seletorMaquina = document.getElementById('search-asset');
    const botaoLimpar = document.getElementById('btn-clear-search');
    const containerEmptyState = document.getElementById('empty-state-container');
    const containerResultados = document.getElementById('history-results-container');

    // Elementos de exibição de dados do ativo
    const displayNomeAtivo = document.getElementById('asset-display-name');
    const displayTotalIntervencoes = document.getElementById('asset-display-total');
    const corpoTabelaLogs = document.getElementById('table-logs-body');

    // 2. Carregar seletor de máquinas dinamicamente a partir do mockDb
    function carregarSeletorEquipamentos() {
        if (!seletorMaquina) return;
        
        // Mantém a primeira opção desabilitada
        seletorMaquina.innerHTML = '<option value="" disabled selected>Escolha uma máquina da linha de calçados...</option>';
        
        const equipamentos = mockDb.getEquipamentos();
        equipamentos.forEach(eq => {
            const opt = document.createElement('option');
            opt.value = eq.tag;
            opt.textContent = `${eq.nome} - ${eq.tag}`;
            seletorMaquina.appendChild(opt);
        });
    }

    // 3. Função que renderiza os registros cronológicos na tabela
    function renderizarHistorico(codigoMaquina) {
        const historicos = mockDb.getHistoricoMaquinas();
        const dadosAtivo = historicos[codigoMaquina];

        if (!dadosAtivo) {
            containerResultados.classList.add('history-hidden');
            containerEmptyState.classList.remove('history-hidden');
            return;
        }

        // Esconde o Empty State e mostra a área de histórico
        containerEmptyState.classList.add('history-hidden');
        containerResultados.classList.remove('history-hidden');

        // Atualiza os cabeçalhos informativos do ativo selecionado
        displayNomeAtivo.textContent = dadosAtivo.nome;
        displayTotalIntervencoes.textContent = dadosAtivo.total;

        // Reseta o conteúdo atual da tabela
        corpoTabelaLogs.innerHTML = '';

        if (!dadosAtivo.logs || dadosAtivo.logs.length === 0) {
            corpoTabelaLogs.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 32px;">
                        Nenhuma quebra ou intervenção corretiva registrada para esta máquina até o momento.
                    </td>
                </tr>`;
            return;
        }

        // Constrói as linhas da tabela dinamicamente com base no objeto de dados
        dadosAtivo.logs.forEach(log => {
            const tr = document.createElement('tr');

            // Tratamento da lista de peças utilizadas
            let listaPecasHTML = '<ul class="components-list">';
            if (Array.isArray(log.pecas)) {
                log.pecas.forEach(p => {
                    listaPecasHTML += `<li>${p}</li>`;
                });
            } else {
                listaPecasHTML += `<li>${log.pecas}</li>`;
            }
            listaPecasHTML += '</ul>';

            // Classe correspondente ao estilo do tipo de falha
            const tipoFalhaClean = log.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const classeBadgeFalha = tipoFalhaClean.includes('eletrica') ? 'fail-eletrica' : 'fail-mecanica';

            tr.innerHTML = `
                <td class="col-date">${log.data}</td>
                <td><span class="badge-fail ${classeBadgeFalha}">${log.tipo}</span></td>
                <td class="tech-name">${log.tecnico}</td>
                <td>${listaPecasHTML}</td>
                <td class="report-text">${log.relato}</td>
            `;
            corpoTabelaLogs.appendChild(tr);
        });
    }

    // Evento disparado na troca de opção no Select
    seletorMaquina.addEventListener('change', (e) => {
        const codigoSelecionado = e.target.value;
        if (codigoSelecionado) {
            renderizarHistorico(codigoSelecionado);
        }
    });

    // Evento disparado ao clicar no botão de Limpar
    botaoLimpar.addEventListener('click', () => {
        seletorMaquina.value = '';
        containerResultados.classList.add('history-hidden');
        containerEmptyState.classList.remove('history-hidden');
    });

    // Inicialização da página
    carregarSeletorEquipamentos();
});