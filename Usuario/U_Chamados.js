document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('input-busca');
    const selectStatus = document.getElementById('select-filtro-status');
    const tabelaLinhas = document.querySelectorAll('#tabela-os tbody tr');
    const emptyState = document.getElementById('empty-state');

    // Função unificada de filtragem (Busca por texto + Dropdown de Status)
    function filtrarTabela() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const statusSelecionado = selectStatus.value;
        let linhasVisiveis = 0;

        tabelaLinhas.forEach(linha => {
            const textoLinha = linha.textContent.toLowerCase();
            const statusLinha = linha.getAttribute('data-status');
            
            // Verifica a correspondência do texto digitado
            const bateTexto = textoLinha.includes(termoBusca);
            
            // Verifica a correspondência do status selecionado
            const bateStatus = (statusSelecionado === 'todos' || statusLinha === statusSelecionado);

            // Exibe ou oculta a linha com base nas condições cruzadas
            if (bateTexto && bateStatus) {
                linha.style.display = '';
                linhasVisiveis++;
            } else {
                linha.style.display = 'none';
            }
        });

        // Gerencia a exibição visual do "Estado Vazio" se nada for encontrado
        if (linhasVisiveis === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    // Ouvintes de evento para monitoramento em tempo real (Sem necessidade de cliques em botões)
    inputBusca.addEventListener('input', filtrarTabela);
    selectStatus.addEventListener('change', filtrarTabela);
});