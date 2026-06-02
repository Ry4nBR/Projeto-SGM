document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos das visões
    const viewProfiles = document.getElementById('view-profiles');
    const viewForm = document.getElementById('view-form');
    const formTitle = document.getElementById('form-title');
    const formLogin = document.getElementById('form-login-credentials');

    // Inputs para limpeza posterior
    const inputUsuario = document.getElementById('txt-usuario');
    const inputSenha = document.getElementById('txt-senha');

    // Botões de controle
    const profileButtons = document.querySelectorAll('.btn-profile');
    const btnBack = document.getElementById('btn-back');

    // Estado da autenticação do lado do cliente (Mapeamento baseado na árvore do print)
    let currentRole = '';

    const rotasDoSistema = {
        'admin': 'Administrador/Adm_Painel.html',
        'tecnico': 'Tecnico/T_Painel.html',
        'almoxarifado': 'Almoxarifado/Alm_Painel.html',
        'usuario': 'Usuario/U_AberturaOS.html'
    };

    const nomesDosPerfis = {
        'admin': 'Login: Administrador',
        'tecnico': 'Login: Técnico',
        'almoxarifado': 'Login: Almoxarifado',
        'usuario': 'Login: Usuário'
    };

    // Ação: Selecionar Cargo/Perfil
    profileButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentRole = button.getAttribute('data-role');

            // Define o título do formulário dinamicamente
            formTitle.textContent = nomesDosPerfis[currentRole];

            // Transiciona as visões ocultando uma e mostrando a outra
            viewProfiles.classList.add('hidden');
            viewForm.classList.remove('hidden');

            inputUsuario.focus();
        });
    });

    // Ação: Botão Voltar
    btnBack.addEventListener('click', () => {
        currentRole = '';
        formLogin.reset();

        viewForm.classList.add('hidden');
        viewProfiles.classList.remove('hidden');
    });

    // Ação: Enviar Formulário e Redirecionar para as pastas corretas
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        const usuarioInput = inputUsuario.value.trim();
        const senhaInput = inputSenha.value;

        // Busca o usuário correspondente no mockDb
        const usuarios = mockDb.getUsuarios();
        
        // Mapeia currentRole para o cargo salvo no banco
        const mapaCargo = {
            'admin': 'Administrador',
            'tecnico': 'Técnico',
            'almoxarifado': 'Almoxarife',
            'usuario': 'Operador'
        };

        const cargoEsperado = mapaCargo[currentRole];

        // Valida se matrícula/email/nome coincide e a senha está correta
        const usuarioEncontrado = usuarios.find(u => 
            (u.matricula === usuarioInput || u.email === usuarioInput || u.nome.toLowerCase() === usuarioInput.toLowerCase()) && 
            u.senha === senhaInput &&
            u.cargo === cargoEsperado
        );

        if (usuarioEncontrado) {
            // Salva na sessão
            mockDb.setLoggedUser(usuarioEncontrado);

            const destino = rotasDoSistema[currentRole];
            if (destino) {
                window.location.href = destino;
            } else {
                alert('Erro crítico: Rota de destino não encontrada.');
            }
        } else {
            alert('Credenciais incorretas ou usuário não correspondente ao perfil selecionado.\n(Dica: Para ' + cargoEsperado + ', use a senha cadastrada no bd.md - ex: senha123 ou 123456).');
        }
    });
});