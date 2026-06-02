document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-os');
    const radioStatus = document.querySelectorAll('input[name="status_maquina"]');
    const panelCriticidade = document.getElementById('panel-criticidade');
    const valueCriticidade = document.getElementById('criticidade-value');

    // Mapeamento dinâmico de criticidade baseado nas escolhas do chão de fábrica
    function atualizarCriticidade() {
        let statusSelecionado = '';
        
        radioStatus.forEach(radio => {
            if (radio.checked) {
                statusSelecionado = radio.value;
            }
        });

        // Aplica a lógica automática de criticidade exigida pelo escopo
        if (statusSelecionado === 'parada') {
            panelCriticidade.className = 'criticidade-box status-alta';
            valueCriticidade.textContent = 'ALTA (Parada Crítica)';
        } else if (statusSelecionado === 'restricao') {
            panelCriticidade.className = 'criticidade-box status-media';
            valueCriticidade.textContent = 'MÉDIA (Alerta Operacional)';
        } else {
            panelCriticidade.className = 'criticidade-box status-empty';
            valueCriticidade.textContent = 'Aguardando Seleção';
        }
    }

    // Ouvinte de evento para capturar as mudanças nos cards de status
    radioStatus.forEach(radio => {
        radio.addEventListener('change', atualizarCriticidade);
    });

    // Simulação do envio e preparação para futura integração com o backend
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const dadosFormulario = {
            idMaquina: document.getElementById('select-maquina').value,
            setor: document.getElementById('select-setor').value,
            especialidade: document.getElementById('select-especialidade').value,
            descricao: document.getElementById('txt-descricao').value,
            condicaoMaquina: document.querySelector('input[name="status_maquina"]:checked').value,
            criticidadeCalculada: valueCriticidade.textContent
        };

        // Exemplo visual de sucesso (pode ser trocado por uma requisição Fetch API no futuro)
        console.log('Enviando Ordem de Serviço estruturada:', dadosFormulario);
        alert(`Ordem de Serviço enviada com sucesso para a máquina ${dadosFormulario.idMaquina}!`);
        
        // Reseta o formulário e o painel de criticidade
        form.reset();
        atualizarCriticidade();
    });
});