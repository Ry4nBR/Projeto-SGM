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

        // Preparado estruturalmente para receber validações assíncronas (Fetch API) no futuro.
        // Por ora, realiza o roteamento local direto conforme as restrições de infraestrutura local da fábrica.
        const destino = rotasDoSistema[currentRole];

        if (destino) {
            window.location.href = destino;
        } else {
            alert('Erro crítico: Rota de destino não encontrada.');
        }
    });
});