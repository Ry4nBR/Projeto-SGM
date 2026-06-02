document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Controle Alternância das Abas de Tela
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

    // 2. Upload de Arquivos de Nota Fiscal Eletrônica (NF-e)
    const areaDropzone = document.getElementById('area-dropzone');
    const inputArquivoXml = document.getElementById('file-xml-input');

    areaDropzone.addEventListener('click', () => {
        inputArquivoXml.click();
    });

    inputArquivoXml.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const nomeArquivo = e.target.files[0].name;
            alert(`XML de Nota Fiscal Identificado: "${nomeArquivo}"\nProcessando itens cadastrados e atualizando saldos de estoque automaticamente...`);
            alert('Operação finalizada! Saldo de ferramentas e peças renovados.');
            inputArquivoXml.value = ''; 
        }
    });

    // 3. Entrada de Peças Manual
    const formManual = document.getElementById('form-cadastro-manual');
    formManual.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeItem = document.getElementById('txt-nome-item').value;
        alert(`Sucesso! O saldo do item "${nomeItem}" foi incrementado no inventário ativo da fábrica.`);
        formManual.reset();
    });
});

// 4. Operações Físicas Logísticas (Sem mexer na regra interna de encerramento da OS)

function dispensarItem(idLinha, nomeItem) {
    if (confirm(`Confirmar a entrega física e dar baixa no estoque para:\n"${nomeItem}"?`)) {
        const linha = document.getElementById(idLinha);
        alert('Retirada registrada no Almoxarifado! Estoque atualizado.');
        linha.remove(); // Remove da fila pendente de entrega do balcão
    }
}

function confirmarDevolucao(idLinha, nomeItem) {
    if (confirm(`Confirmar recebimento físico e retorno ao estoque do item:\n"${nomeItem}"?`)) {
        const linha = document.getElementById(idLinha);
        alert('Material guardado! O item voltou a constar como "Disponível" no inventário.');
        linha.remove(); // Remove da fila de devoluções pendentes do balcão
    }
}