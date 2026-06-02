document.addEventListener('DOMContentLoaded', () => {
    
    // Captura dos elementos seletores de filtros do cabeçalho
    const filterTecnico = document.getElementById('filter-tecnico');
    const filterSetor = document.getElementById('filter-setor');
    const filterCriticidade = document.getElementById('filter-criticidade');
    const filterStatus = document.getElementById('filter-status');
    
    // Elementos da tabela mestre
    const tabelaOS = document.getElementById('table-master-os');
    const linhasTabela = tabelaOS.querySelectorAll('tbody tr');

    // Executa a lógica de filtragem combinada sempre que algum dropdown mudar
    function executarFiltragem() {
        const valTecnico = filterTecnico.value;
        const valSetor = filterSetor.value;
        const valCriticidade = filterCriticidade.value;
        const valStatus = filterStatus.value;

        linhasTabela.forEach(linha => {
            // Coleta os atributos data-attributes configurados no HTML de cada linha
            const matchTecnico = (valTecnico === 'todos' || linha.getAttribute('data-tecnico') === valTecnico);
            const matchSetor = (valSetor === 'todos' || linha.getAttribute('data-setor') === valSetor);
            const matchCriticidade = (valCriticidade === 'todos' || linha.getAttribute('data-criticidade') === valCriticidade);
            const matchStatus = (valStatus === 'todos' || linha.getAttribute('data-status') === valStatus);

            // Se a linha corresponder a TODOS os filtros ativos simultaneamente, ela fica visível
            if (matchTecnico && matchSetor && matchCriticidade && matchStatus) {
                linha.style.display = '';
            } else {
                linha.style.display = 'none';
            }
        });
    }

    // Ouvintes de evento de mudança (change) para cada seletor de filtro
    filterTecnico.addEventListener('change', executarFiltragem);
    filterSetor.addEventListener('change', executarFiltragem);
    filterCriticidade.addEventListener('change', executarFiltragem);
    filterStatus.addEventListener('change', executarFiltragem);
});

/**
 * Função global disparada ao alterar o seletor de Técnico na própria linha da tabela
 * @param {HTMLElement} selectElement - O elemento HTML select que sofreu a ação
 * @param {String} codigoOS - Código identificador da Ordem de Serviço atingida
 */
function reatribuirTecnico(selectElement, codigoOS) {
    const novoTecnico = selectElement.value;
    const trPai = selectElement.closest('tr');
    const tdNomeTecnico = trPai.querySelector('.td-tech-name');

    // Atualiza o atributo de dado da linha para manter os filtros do topo funcionando perfeitamente
    trPai.setAttribute('data-tecnico', novoTecnico);

    if (novoTecnico === 'Não Atribuído') {
        tdNomeTecnico.textContent = 'Não Atribuído';
        tdNomeTecnico.classList.add('label-unassigned');
        selectElement.classList.add('highlighted-select');
    } else {
        tdNomeTecnico.textContent = novoTecnico;
        tdNomeTecnico.classList.remove('label-unassigned');
        selectElement.classList.remove('highlighted-select');
    }

    // Alerta em tela simulando persistência instantânea no banco de dados
    alert(`Intervenção Concluída!\nA ordem de serviço ${codigoOS} foi reatribuída com sucesso para o técnico: "${novoTecnico}".`);
}