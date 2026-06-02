document.addEventListener('DOMContentLoaded', () => {
    const botoesAssumir = document.querySelectorAll('.btn-assumir');
    const cronometros = document.querySelectorAll('.cronometro');

    // 1. Lógica do Cronômetro Ativo (Tempo de Espera Crescente em tempo real)
    setInterval(() => {
        cronometros.forEach(cronometro => {
            let segundosAtuais = parseInt(cronometro.getAttribute('data-seconds'), 10);
            segundosAtuais++;
            
            cronometro.setAttribute('data-seconds', segundosAtuais);

            // Conversão matemática para formato legível de relógio industrial (HH:MM:SS)
            let hrs = Math.floor(segundosAtuais / 3600);
            let mins = Math.floor((segundosAtuais % 3600) / 60);
            let secs = segundosAtuais % 60;

            let hrsStr = hrs > 0 ? String(hrs).padStart(2, '0') + ':' : '';
            let minsStr = String(mins).padStart(2, '0');
            let secsStr = String(secs).padStart(2, '0');

            cronometro.textContent = `${hrsStr}${minsStr}:${secsStr}`;
        });
    }, 1000);

    // 2. Interação para Assumir Ordem de Serviço
    botoesAssumir.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const linhaOS = e.target.closest('tr');
            const idOS = linhaOS.getAttribute('data-os-id');

            // Feedback visual imediato antes da confirmação final
            if (confirm(`Deseja assumir o diagnóstico e execução da OS #${idOS} agora?`)) {
                
                // Simulação da alteração de estado interna do sistema (Vinculando ao técnico logado)
                e.target.textContent = 'Em Manutenção';
                e.target.style.backgroundColor = '#9E9E9E';
                e.target.style.cursor = 'not-allowed';
                e.target.disabled = true;

                linhaOS.style.opacity = '0.6';
                linhaOS.style.transition = 'opacity 0.4s ease';
                
                alert(`OS #${idOS} vinculada com sucesso! Ela foi transferida para a sua aba 'Minhas OS'.`);
                
                // No cenário real integrando ao backend, dispararíamos o comando fetch() aqui
                // e removeríamos a linha da fila geral após a atualização do banco de dados local.
                linhaOS.remove();
            }
        });
    });
});