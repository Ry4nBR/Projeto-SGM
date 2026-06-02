document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('input-busca');
    const selectStatus = document.getElementById('select-filtro-status');
    const tabelaCorpo = document.querySelector('#tabela-os tbody');
    const emptyState = document.getElementById('empty-state');

    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-logo span') || document.querySelector('.sidebar span');
        if (spanUser) spanUser.textContent = user.nome;
    }

    // 2. Renderizar linhas dinamicamente a partir do mockDb
    function renderizarTabela() {
        const ordens = mockDb.getOrdensServico();
        const equipamentos = mockDb.getEquipamentos();
        const usuarios = mockDb.getUsuarios();

        // Limpar tabela
        tabelaCorpo.innerHTML = '';

        // Filtrar chamados: se for operador, exibe apenas os dele. Caso contrário (como teste), exibe todos.
        const ordensFiltradas = ordens.filter(os => {
            if (user && user.cargo === 'Operador') {
                return os.solicitante_id === user.id;
            }
            return true;
        });

        if (ordensFiltradas.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        ordensFiltradas.forEach(os => {
            const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
            const nomeMaquina = eq ? eq.nome : 'Equipamento não cadastrado';
            
            const tech = os.tecnico_id ? usuarios.find(u => u.id === os.tecnico_id) : null;
            const nomeTecnico = tech ? tech.nome : 'Não atribuído';

            // Mapeamento de status banco -> interface
            let badgeHTML = '';
            let statusText = os.status_os;
            if (os.status_os === 'Aberta') {
                badgeHTML = '<span class="badge status-aguardando">Aguardando Técnico</span>';
                statusText = 'Aguardando Técnico';
            } else if (os.status_os === 'Em Andamento') {
                badgeHTML = '<span class="badge status-manutencao">Em Manutenção</span>';
                statusText = 'Em Manutenção';
            } else if (os.status_os === 'Aguardando Peças') {
                badgeHTML = '<span class="badge status-pecas">Aguardando Peças</span>';
                statusText = 'Aguardando Peças';
            } else if (os.status_os === 'Aguardando Devolução de Ferramentas') {
                badgeHTML = '<span class="badge status-devolucao">Aguardando Devolução</span>';
                statusText = 'Aguardando Devolução de Kit';
            } else if (os.status_os === 'Concluído') {
                badgeHTML = '<span class="badge status-concluido">Concluído</span>';
                statusText = 'Concluído';
            }

            const tr = document.createElement('tr');
            tr.setAttribute('data-status', statusText);
            tr.setAttribute('data-maquina', os.equipamento_tag);

            // Formatação de data
            const dataFormatada = new Date(os.data_abertura).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            tr.innerHTML = `
                <td class="col-id">#${os.codigo_os}</td>
                <td>${dataFormatada}</td>
                <td><span class="machine-code">${os.equipamento_tag}</span> ${nomeMaquina}</td>
                <td>${badgeHTML}</td>
                <td class="col-tecnico ${tech ? '' : 'text-muted'}">${nomeTecnico}</td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        filtrarTabela();
    }

    // 3. Função unificada de filtragem (Busca por texto + Dropdown de Status)
    function filtrarTabela() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const statusSelecionado = selectStatus.value;
        const tabelaLinhas = tabelaCorpo.querySelectorAll('tr');
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

    // Inicialização da tela
    renderizarTabela();

    // Ouvintes de evento para monitoramento em tempo real (Sem necessidade de cliques em botões)
    inputBusca.addEventListener('input', filtrarTabela);
    selectStatus.addEventListener('change', filtrarTabela);
});