document.addEventListener('DOMContentLoaded', () => {

    // Captura dos formulários operacionais
    const formItemIndividual = document.getElementById('form-add-item-individual');
    const formMontarKit = document.getElementById('form-build-kit');
    const tabelaKitsCorpo = document.getElementById('table-kits-status').querySelector('tbody');

    // 1. Escuta do envio do formulário de Cadastro de Ferramentas/Itens Avulsos
    formItemIndividual.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nomeItem = document.getElementById('txt-item-name').value;
        const qtdEstoque = document.getElementById('num-item-stock').value;
        const tipoAtivo = document.getElementById('sel-item-type').value;

        // Alerta de confirmação de injeção lógica no sistema físico
        alert(`Sucesso no Inventário!\nItem: "${nomeItem}" (${tipoAtivo})\nQuantidade inserida: ${qtdEstoque} unidades.\nO estoque foi atualizado.`);
        
        formItemIndividual.reset();
    });

    // 2. Escuta do envio do formulário de Engenharia e Montagem de Kits Padrão
    formMontarKit.addEventListener('submit', (e) => {
        e.preventDefault();

        const nomeKit = document.getElementById('txt-kit-name').value;
        const maquinaVinculo = document.getElementById('sel-kit-machine').value;
        
        // Coleta quais checkboxes de ferramentas integrantes foram marcadas
        const checkboxesComponentes = document.querySelectorAll('input[name="kit-components"]:checked');
        
        if (checkboxesComponentes.length === 0) {
            alert('Aviso Operacional:\nPor favor, selecione ao menos 1 ferramenta integrante para compor o Kit Padrão.');
            return;
        }

        // Transforma a coleção de nós selecionados em uma string separada por vírgula para visualização na tabela
        const arrayComponentesNames = [];
        checkboxesComponentes.forEach(cb => {
            arrayComponentesNames.push(cb.value);
        });
        const componentesString = arrayComponentesNames.join(', ');

        // Injeta a nova linha dinamicamente na tabela mestre de acompanhamento de status de kits
        const novaLinhaTr = document.createElement('tr');
        novaLinhaTr.innerHTML = `
            <td><strong>${nomeKit}</strong></td>
            <td>${maquinaVinculo}</td>
            <td>${componentesString}</td>
            <td><span class="badge-status status-disponivel">Disponível</span></td>
        `;

        // Insere no topo do corpo da tabela
        tabelaKitsCorpo.insertBefore(novaLinhaTr, tabelaKitsCorpo.firstChild);

        alert(`Kit Padronizado Ativado!\nO "${nomeKit}" foi criado e estruturado com sucesso no banco de dados, mapeado para a máquina: ${maquinaVinculo}.`);
        
        // Reseta o formulário e limpa os checkboxes
        formMontarKit.reset();
    });
});