// Adm_Usuarios.js - Gestão de Usuários Reativa integrada ao mockDb

document.addEventListener('DOMContentLoaded', () => {

    const seletorNivelAcesso = document.getElementById('sel-user-level');
    const containerSubcampo = document.getElementById('subfield-especialidade');
    const seletorEspecialidade = document.getElementById('sel-tech-specialty');

    const formCadastro = document.getElementById('form-cadastro-usuario');
    const btnSubmit = formCadastro.querySelector('button[type="submit"]');
    const tabelaUsuariosCorpo = document.getElementById('table-users-list').querySelector('tbody');

    // Novos campos
    const inputSenha = document.getElementById('txt-user-senha');
    const inputConfirmarSenha = document.getElementById('txt-user-confirmar-senha');
    const inputFoto = document.getElementById('file-user-foto');

    // Variáveis de controle para edição e imagem Base64
    let usuarioEmEdicaoId = null;
    let fotoBase64 = null;

    // 1. Carregar nome do usuário logado na barra lateral
    const user = mockDb.getLoggedUser();
    if (user) {
        const spanUser = document.querySelector('.sidebar-footer .user-name');
        const avatarUser = document.querySelector('.sidebar-footer .user-avatar');
        if (spanUser) spanUser.textContent = user.nome;
        if (avatarUser && user.nome) {
            if (user.foto) {
                avatarUser.innerHTML = '';
                avatarUser.style.backgroundImage = `url(${user.foto})`;
                avatarUser.style.backgroundSize = 'cover';
                avatarUser.style.backgroundPosition = 'center';
            } else {
                avatarUser.textContent = user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }
        }
    }

    // 2. Monitora o Dropdown de Nível de Acesso para exibir/ocultar a especialidade
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

    // Tratar upload de imagem e conversão para Base64
    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                fotoBase64 = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Renderizar tabela de colaboradores
    function renderizarTabelaUsuarios() {
        if (!tabelaUsuariosCorpo) return;
        tabelaUsuariosCorpo.innerHTML = '';

        const usuarios = mockDb.getUsuarios();

        usuarios.forEach(u => {
            // Mapeamento de classes css de acordo com o perfil
            let classeBadge = 'role-producao';
            let nivelExibido = u.cargo;
            
            if (u.cargo === 'Administrador') classeBadge = 'role-admin';
            if (u.cargo === 'Técnico') classeBadge = 'role-tecnico';
            if (u.cargo === 'Almoxarife') {
                classeBadge = 'role-almoxarifado';
                nivelExibido = 'Almoxarifado';
            }
            if (u.cargo === 'Operador') {
                classeBadge = 'role-producao';
                nivelExibido = 'Usuário da Produção';
            }

            let funcao = u.especialidade || 'Logística de Fábrica';
            if (u.cargo === 'Administrador') funcao = 'Engenharia Master';
            if (u.cargo === 'Almoxarife') funcao = 'Logística de Ativos';
            if (u.cargo === 'Operador') funcao = 'Operador de Linha';

            const tr = document.createElement('tr');
            tr.id = `user-row-${u.id}`;

            const statusClass = u.status_usuario === 'Ativo' ? 'active-true' : 'active-false';

            // Renderiza foto Base64 ou iniciais
            let photoHTML = '';
            if (u.foto) {
                photoHTML = `<div class="user-avatar-mini" style="background-image: url(${u.foto}); background-size: cover; background-position: center; margin-right: 10px;"></div>`;
            } else {
                photoHTML = `<div class="user-avatar-mini user-avatar-placeholder" style="margin-right: 10px;">${u.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>`;
            }

            tr.innerHTML = `
                <td class="col-id">${u.matricula}</td>
                <td style="display: flex; align-items: center;">
                    ${photoHTML}
                    <strong>${u.nome}</strong>
                </td>
                <td><span class="badge-role ${classeBadge}">${nivelExibido}</span></td>
                <td>${funcao}</td>
                <td><span class="indicator-status ${statusClass}">${u.status_usuario}</span></td>
                <td>
                    <div class="table-actions-flex">
                        <button class="btn-table-action btn-edit" data-id="${u.id}" data-matricula="${u.matricula}">Editar</button>
                        <button class="btn-table-action btn-deactivate" data-id="${u.id}" data-nome="${u.nome}">
                            ${u.status_usuario === 'Ativo' ? 'Desativar' : 'Ativar'}
                        </button>
                    </div>
                </td>
            `;

            tabelaUsuariosCorpo.appendChild(tr);
        });

        // Ouvintes de edição
        tabelaUsuariosCorpo.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                iniciarEdicaoUsuario(id);
            });
        });

        // Ouvintes de desativação
        tabelaUsuariosCorpo.querySelectorAll('.btn-deactivate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const nome = e.target.getAttribute('data-nome');
                alternarStatusUsuario(id, nome);
            });
        });
    }

    // 4. Iniciar edição
    function iniciarEdicaoUsuario(id) {
        const usuarios = mockDb.getUsuarios();
        const u = usuarios.find(usr => usr.id === parseInt(id));
        if (!u) return;

        usuarioEmEdicaoId = u.id;

        document.getElementById('txt-user-name').value = u.nome;
        document.getElementById('txt-user-matricula').value = u.matricula;
        inputSenha.value = u.senha || '';
        inputConfirmarSenha.value = u.senha || '';
        fotoBase64 = u.foto || null;
        inputFoto.value = ''; // Reseta o input do arquivo

        // Mapeia cargo interno para o seletor do HTML
        let nivelHTML = u.cargo;
        if (u.cargo === 'Almoxarife') nivelHTML = 'Almoxarifado';
        if (u.cargo === 'Operador') nivelHTML = 'Usuário da Produção';
        seletorNivelAcesso.value = nivelHTML;

        // Trata especialidade do técnico
        if (u.cargo === 'Técnico') {
            containerSubcampo.classList.remove('field-hidden');
            seletorEspecialidade.value = u.especialidade || 'Geral';
            seletorEspecialidade.setAttribute('required', 'required');
        } else {
            containerSubcampo.classList.add('field-hidden');
            seletorEspecialidade.removeAttribute('required');
            seletorEspecialidade.value = 'Geral';
        }

        btnSubmit.textContent = 'Salvar Alterações';
        document.querySelector('.form-user-section h3').textContent = `Editar Usuário: ${u.nome}`;
        document.getElementById('txt-user-name').focus();
    }

    // 5. Alternar status (Ativar/Desativar)
    function alternarStatusUsuario(id, nome) {
        const usuarios = mockDb.getUsuarios();
        const u = usuarios.find(usr => usr.id === parseInt(id));
        if (!u) return;

        const novoStatus = u.status_usuario === 'Ativo' ? 'Inativo' : 'Ativo';
        const acao = novoStatus === 'Ativo' ? 'reativar' : 'desativar';

        if (confirm(`Aviso de Segurança:\nDeseja realmente ${acao} as credenciais do colaborador "${nome}"?`)) {
            mockDb.updateUsuario(id, { status_usuario: novoStatus });
            alert(`Acesso atualizado! O usuário "${nome}" foi marcado como ${novoStatus.toLowerCase()} no SGM.`);
            renderizarTabelaUsuarios();
        }
    }

    // 6. Submissão do Formulário (Salvar Novo ou Editar)
    formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('txt-user-name').value.trim();
        const matricula = document.getElementById('txt-user-matricula').value.trim();
        const nivelHTML = seletorNivelAcesso.value;
        const senha = inputSenha.value;
        const confirmarSenha = inputConfirmarSenha.value;

        // Validações de senha
        if (senha.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem. Verifique a confirmação de senha.');
            return;
        }

        // Mapeia seletor do HTML para o cargo interno do bd.md
        let cargoInterno = 'Operador';
        if (nivelHTML === 'Administrador') cargoInterno = 'Administrador';
        if (nivelHTML === 'Técnico') cargoInterno = 'Técnico';
        if (nivelHTML === 'Almoxarifado') cargoInterno = 'Almoxarife';

        // Detalhes da especialidade
        let especialidade = '';
        if (cargoInterno === 'Técnico') {
            especialidade = seletorEspecialidade.value;
        }

        const emailMock = `${nome.toLowerCase().replace(/[^a-z0-9]/g, '')}@fabrica.com`;

        if (usuarioEmEdicaoId) {
            // Modo Edição
            mockDb.updateUsuario(usuarioEmEdicaoId, {
                nome: nome,
                matricula: matricula,
                cargo: cargoInterno,
                especialidade: especialidade,
                email: emailMock,
                senha: senha,
                foto: fotoBase64
            });
            alert(`Usuário atualizado com sucesso no banco de dados!`);
            
            // Reseta controles de edição
            usuarioEmEdicaoId = null;
            fotoBase64 = null;
            btnSubmit.textContent = 'Salvar e Ativar Colaborador';
            document.querySelector('.form-user-section h3').textContent = 'Cadastrar Novo Usuário';
        } else {
            // Modo Cadastro
            // Valida matrícula duplicada
            const usuarios = mockDb.getUsuarios();
            if (usuarios.some(usr => usr.matricula === matricula)) {
                alert(`Erro: Já existe um colaborador cadastrado com a matrícula ${matricula}.`);
                return;
            }

            mockDb.saveUsuario({
                nome: nome,
                matricula: matricula,
                cargo: cargoInterno,
                especialidade: especialidade,
                email: emailMock,
                senha: senha,
                foto: fotoBase64,
                status_usuario: 'Ativo'
            });
            alert(`Usuário cadastrado com sucesso sob a matrícula ${matricula}!`);
        }

        // Limpa campos e recarrega
        formCadastro.reset();
        fotoBase64 = null;
        containerSubcampo.classList.add('field-hidden');
        seletorEspecialidade.removeAttribute('required');
        renderizarTabelaUsuarios();
    });

    // Inicialização da tela
    renderizarTabelaUsuarios();
});