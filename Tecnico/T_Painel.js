document.addEventListener('DOMContentLoaded', () => {
    const tabelaCorpo = document.querySelector('#tabela-painel-os tbody');

    // 1. Carregar dados do técnico logado
    const user = mockDb.getLoggedUser();
    if (user) {
        // Nome na barra lateral
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const roleUser = document.querySelector('.sidebar-footer .user-role');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        
        if (spanUser) spanUser.textContent = user.nome;
        if (roleUser) roleUser.textContent = user.especialidade ? `Téc. ${user.especialidade}` : user.cargo;
        if (avatarUser && user.nome) {
            avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }

        // Também atualiza o topo da barra lateral se houver span
        const headerSpan = document.querySelector('.sidebar-logo span');
        if (headerSpan) headerSpan.textContent = user.nome;
    }

    // 2. Renderizar fila de OS em aberto do banco de dados
    function renderizarFilaGeral() {
        const ordens = mockDb.getOrdensServico();
        const equipamentos = mockDb.getEquipamentos();

        tabelaCorpo.innerHTML = '';

        // Filtra apenas OS com status 'Aberta' (não assumidas)
        const abertas = ordens.filter(os => os.status_os === 'Aberta');

        if (abertas.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--neutral-medium); font-style: italic; padding: 32px;">
                        Nenhuma ordem de serviço pendente na fila geral. Bom trabalho!
                    </td>
                </tr>`;
            return;
        }

        // Ordena por prioridade (parada total primeiro)
        abertas.sort((a, b) => {
            const aParada = a.condicao_maquina === 'parada' ? 1 : 0;
            const bParada = b.condicao_maquina === 'parada' ? 1 : 0;
            return bParada - aParada;
        });

        abertas.forEach(os => {
            const eq = equipamentos.find(e => e.tag === os.equipamento_tag);
            const nomeMaquina = eq ? eq.nome : 'Máquina não cadastrada';
            const setorMaquina = eq ? eq.setor : os.setor;

            // Determinar classes e textos de prioridade
            let classeLinha = 'row-prioridade-media';
            let badgeHTML = '<span class="badge badge-warning">Com Restrição</span>';
            
            if (os.condicao_maquina === 'parada') {
                classeLinha = 'row-prioridade-alta';
                badgeHTML = '<span class="badge badge-danger">Parada Total</span>';
            }

            // Falha tag
            let classeFalha = 'falha-mecanica';
            if (os.tipo_falha === 'Elétrica') classeFalha = 'falha-eletrica';
            if (os.tipo_falha === 'Pneumática') classeFalha = 'falha-pneumatica';

            // Calcula o tempo de espera real em segundos
            const segundosEspera = Math.floor((new Date() - new Date(os.data_abertura)) / 1000);
            
            // Formatador inicial
            let hrs = Math.floor(segundosEspera / 3600);
            let mins = Math.floor((segundosEspera % 3600) / 60);
            let secs = segundosEspera % 60;
            let hrsStr = hrs > 0 ? String(hrs).padStart(2, '0') + ':' : '';
            let tempoStr = `${hrsStr}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            const tr = document.createElement('tr');
            tr.className = classeLinha;
            tr.setAttribute('data-os-id', os.codigo_os);

            tr.innerHTML = `
                <td>${badgeHTML}</td>
                <td class="col-id">#${os.codigo_os}</td>
                <td>
                    <span class="machine-code">${os.equipamento_tag}</span>
                    <strong>${nomeMaquina}</strong>
                    <span class="sector-tag">Setor: ${setorMaquina}</span>
                </td>
                <td><span class="falha-tag ${classeFalha}">${os.tipo_falha}</span></td>
                <td>
                    <div class="cronometro" data-seconds="${segundosEspera}">${tempoStr}</div>
                </td>
                <td class="text-right">
                    <button class="btn-action btn-assumir" data-id="${os.id}">Assumir OS</button>
                </td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        // Re-associar ouvintes nos botões gerados
        const botoes = tabelaCorpo.querySelectorAll('.btn-assumir');
        botoes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idOS = e.target.getAttribute('data-id');
                const tr = e.target.closest('tr');
                const codigoOS = tr.getAttribute('data-os-id');

                if (confirm(`Deseja assumir o diagnóstico e execução da OS #${codigoOS} agora?`)) {
                    // Atualiza no banco
                    mockDb.updateOrdemServico(idOS, {
                        tecnico_id: user ? user.id : 2, // Carlos Silva fallback
                        status_os: 'Em Andamento',
                        data_inicio_manutencao: new Date().toISOString()
                    });

                    // Feedback visual e redirecionamento para o painel de execução
                    alert(`OS #${codigoOS} vinculada com sucesso! Você será redirecionado para a tela de execução.`);
                    window.location.href = `T_MinhasOS.html?os=${codigoOS}`;
                }
            });
        });
    }

    // Inicialização da fila
    renderizarFilaGeral();

    // 3. Lógica do Cronômetro Ativo (Tempo de Espera Crescente em tempo real)
    setInterval(() => {
        const cronometros = document.querySelectorAll('.cronometro');
        cronometros.forEach(cronometro => {
            let segundosAtuais = parseInt(cronometro.getAttribute('data-seconds'), 10);
            segundosAtuais++;

            cronometro.setAttribute('data-seconds', segundosAtuais);

            // Conversão matemática para formato legível (HH:MM:SS)
            let hrs = Math.floor(segundosAtuais / 3600);
            let mins = Math.floor((segundosAtuais % 3600) / 60);
            let secs = segundosAtuais % 60;

            let hrsStr = hrs > 0 ? String(hrs).padStart(2, '0') + ':' : '';
            let minsStr = String(mins).padStart(2, '0');
            let secsStr = String(secs).padStart(2, '0');

            cronometro.textContent = `${hrsStr}${minsStr}:${secsStr}`;
        });
    }, 1000);
});