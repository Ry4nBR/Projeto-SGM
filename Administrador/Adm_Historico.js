document.addEventListener('DOMContentLoaded', () => {

    // Banco de dados simulado contendo o histórico das máquinas da fábrica de calçados
    const dbHistoricoMaquinas = {
        "MQ-01": {
            nome: "Injetora de Solados TR - Máquina MQ-01",
            total: "01 registro",
            logs: [
                {
                    data: "25/05/2026 - 08:30",
                    tipo: "Elétrica",
                    tecnico: "Fernando Souza",
                    pecas: ["Contator de Potência Siemens 24V"],
                    relato: "Curto-circuito identificado na bobina do contator principal devido a oscilação de rede elétrica externa. Componente substituído por peça nova original do estoque e realizados testes de ciclo térmico na injeção. Equipamento operando sob carga normal."
                }
            ]
        },
        "MQ-02": {
            nome: "Prensa de Vulcanização Hidráulica - Máquina MQ-02",
            total: "02 registros",
            logs: [
                {
                    data: "18/05/2026 - 14:15",
                    tipo: "Mecânica",
                    tecnico: "Carlos Silva",
                    pecas: ["Rolamento Blindado NSK 6204", "Anel de Vedação O-Ring"],
                    relato: "Vazamento severo detectado no retentor do pistão hidráulico esquerdo causando queda brusca de pressão operacional. Realizado esgotamento parcial do óleo, troca do anel de vedação e do rolamento do eixo tracionador que apresentava desgaste prematuro."
                },
                {
                    data: "04/04/2026 - 10:00",
                    tipo: "Elétrica",
                    tecnico: "Fernando Souza",
                    pecas: ["Nenhum (Ajuste de Parâmetro)"],
                    relato: "Falha de comunicação intermitente reportada entre o CLP central e a IHM de comando da prensa. Constatado mau contato crônico no barramento físico de cabos de rede industrial. Limpeza de contatos executada com sucesso."
                }
            ]
        },
        "MQ-03": {
            nome: "Estufa de Secagem de Colas Flash - Máquina MQ-03",
            total: "0 registros",
            logs: []
        },
        "MQ-04": {
            nome: "Chanfradeira de Couros Eletrônica - Máquina MQ-04",
            total: "01 registro",
            logs: [
                {
                    data: "12/05/2026 - 16:45",
                    tipo: "Mecânica",
                    tecnico: "Carlos Silva",
                    pecas: ["Fita de Desgaste de Teflon", "Lâmina Circular 120mm"],
                    relato: "Substituição preventiva da navalha de corte circular devido a perda de fio e rebarbas no chanfrado de peças delicadas. Ajustado o batente guia e calibrado o sensor de aproximação óptica."
                }
            ]
        }
    };

    // Mapeamento de elementos da DOM
    const seletorMaquina = document.getElementById('search-asset');
    const botaoLimpar = document.getElementById('btn-clear-search');
    const containerEmptyState = document.getElementById('empty-state-container');
    const containerResultados = document.getElementById('history-results-container');
    
    // Elementos de exibição de dados do ativo
    const displayNomeAtivo = document.getElementById('asset-display-name');
    const displayTotalIntervencoes = document.getElementById('asset-display-total');
    const corpoTabelaLogs = document.getElementById('table-logs-body');

    // Função que renderiza os registros cronológicos na tabela
    function renderizarHistorico(codigoMaquina) {
        const dadosAtivo = dbHistoricoMaquinas[codigoMaquina];

        if (!dadosAtivo) return;

        // Atualiza os cabeçalhos informativos do ativo selecionado
        displayNomeAtivo.textContent = dadosAtivo.nome;
        displayTotalIntervencoes.textContent = dadosAtivo.total;

        // Reseta o conteúdo atual da tabela
        corpoTabelaLogs.innerHTML = '';

        if (dadosAtivo.logs.length === 0) {
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
            log.pecas.forEach(p => {
                listaPecasHTML += `<li>${p}</li>`;
            });
            listaPecasHTML += '</ul>';

            // Classe correspondente ao estilo do tipo de falha
            const classeBadgeFalha = log.tipo === 'Elétrica' ? 'fail-eletrica' : 'fail-mecanica';

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
    seletorMaquina.addEventListener('change