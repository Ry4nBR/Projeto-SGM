document.addEventListener('DOMContentLoaded', () => {

    const seletorNivelAcesso = document.getElementById('sel-user-level');
    const containerSubcampo = document.getElementById('subfield-especialidade');
    const seletorEspecialidade = document.getElementById('sel-tech-specialty');
    
    const formCadastro = document.getElementById('form-cadastro-usuario');
    const tabelaUsuariosCorpo = document.getElementById('table-users-list').querySelector('tbody');

    // 1. Monitora o Dropdown de Nível de Acesso para exibir/ocultar a especialidade
    seletorNivelAcesso.addEventListener('change', (e) => {
        if (e.target.value === 'Técnico') {
            containerSubcampo.classList.remove('field-hidden');
            seletorEspecialidade.setAttribute('required', 'required');
        } else {
            containerSubcampo.classList.add('field-hidden');
            seletorEspecialidade.removeAttribute('required');
            seletorEspecialidade.value = 'Geral'; // Reseta para o padrão
        }
    });

    // 2. Processa o envio do formulário de cadastro de usuário
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('txt-user-name').value;
        const matricula = document.getElementById('txt-user-matricula').value;
        const nivel = seletorNivelAcesso.value;
        
        // Se for técnico pega o valor selecionado, caso contrário define função padrão baseada no perfil
        let funcao = 'Logística de Fábrica';
        if (nivel === 'Técnico') {
            funcao = seletorEspecialidade.value;
        } else if (nivel === 'Administrador') {
            funcao = 'Engenharia Master';
        } else if (nivel === 'Almoxarifado') {
            funcao = 'Logística de Ativos';
        } else if (nivel === 'Usuário da Produção') {
            funcao = 'Operador de Linha';
        }

        // Mapeamento de classes css de acordo com o perfil cadastrado
        let classeBadge = 'role-producao';
        if (nivel === 'Administrador') classeBadge = 'role-admin';
        if (nivel === 'Técnico') classeBadge = 'role-tecnico';
        if (nivel === 'Almoxarifado') classeBadge = 'role-almoxarifado';

        // Criação de ID incremental fictício para remoção posterior em tela
        const idLinhaUnico = `user-row-dinamico-${Date.now()}`;

        // Montagem física do novo elemento HTML na tabela mestre
        const novaLinhaTr = document.createElement('tr');
        novaLinhaTr.id = idLinhaUnico;
        novaLinhaTr.innerHTML = `
            <td class="col-id">${matricula}</td>
            <td><strong>${nome}</strong></td>
            <td><span class="badge-role ${classeBadge}">${nivel}</span></td>
            <td>${funcao}</td>
            <td><span class="indicator-status active-true">Ativo</span></td>
            <td>
                <div class="table-actions-flex">
                    <button class="btn-table-action btn-edit" onclick="editarUsuario('${matricula}', '${nome}')">Editar</button>
                    <button class="btn-table-action btn-deactivate" onclick="desativarUsuario('${idLinhaUnico}', '${nome}')">Desativar</button>
                </div>
            </td>
        `;

        // Insere o novo colaborador no topo da tabela para feedback visual instantâneo
        tabelaUsuariosCorpo.insertBefore(novaLinhaTr, tabelaUsuariosCorpo.firstChild);

        alert(`Usuário Ativado!\nO colaborador "${nome}" foi credenciado com sucesso sob a matrícula ${matricula}.`);
        
        // Limpa o formulário e recolhe o campo de especialidade se estivesse aberto
        formCadastro.reset();
        containerSubcampo.classList.add('field-hidden');
        seletorEspecialidade.removeAttribute('required');
    });
});

// 3. Ações Globais da Tabela (Disparadas via atributos onclick do HTML dinâmico)

function editarUsuario(matricula, nome) {
    alert(`Modo de Edição Iniciado!\nCarregando dados cadastrais do colaborador "${nome}" (${matricula}) no painel de modificação.`);
}

function desativarUsuario(idLinha, nome) {
    if (confirm(`Aviso de Segurança:\nDeseja realmente revogar o acesso e desativar as credenciais do colaborador "${nome}"?`)) {
        const linha = document.getElementById(idLinha);
        alert(`Acesso revogado! O usuário "${nome}" foi marcado como inativo e não conseguirá se autenticar no SGM.`);
        linha.remove(); // Remove da listagem em tempo de execução
    }
}