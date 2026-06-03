Plano de Implementação - Melhorias no SGM
Este documento detalha o plano de alterações e melhorias para o Sistema de Gestão de Manutenção (SGM), integrando os fluxos operacionais e garantindo a reatividade dos dados em todos os módulos através do banco de dados simulado (`mockDb.js`).
---
User Review Required
> [!IMPORTANT]
> **Consistência de Dados (mockDb.js)**:
> As Ordens de Serviço iniciais não continham a chave `criticidade`. Isto fazia com que a tela de Acompanhamento (Administrador) quebrasse ao ler propriedades indefinidas, resultando em uma tela em branco. Adicionaremos a chave `criticidade` com valores padrão ('Alta' / 'Média') para as OS existentes no banco de dados e garantiremos que o código do Administrador seja tolerante a valores nulos ou indefinidos.
>
> **Foto do Usuário em Base64**:
> Como o sistema é puramente frontend e roda diretamente no navegador via `file:///`, as fotos dos usuários serão convertidas para Base64 usando `FileReader` no momento do upload. Isso possibilita que a imagem persista e seja compartilhada entre as telas por meio do `localStorage`. Caso o usuário não possua foto cadastrada, um avatar com ícone SVG padronizado será gerado automaticamente.
---
Proposed Changes
1. Banco de Dados Simulado (`mockDb.js`)
[MODIFY] mockDb.js
Adicionar novos dados padrão de ferramentas e peças de ambiente industrial (Chave combinada, Rolamentos, Sensores, Contatores, etc.) no inicializador do inventário do almoxarifado.
Adicionar o campo `criticidade` a todas as OSs iniciais para evitar erros de renderização no painel administrativo.
Adicionar suporte para salvar o campo `nf_origem` no cadastro manual de materiais do Almoxarifado.
Adicionar suporte a `senha` e `foto` (armazenamento Base64) na criação e atualização de usuários.
---
2. Módulo Usuário
[MODIFY] U_AberturaOS.html
Adicionar a nova opção de criticidade/condição no formulário: Baixa Prioridade (para solicitações não urgentes como manutenção preventiva, pequenos reparos, melhorias).
[MODIFY] U_AberturaOS.css
Criar a classe CSS `.card-low` e `.status-baixa` com cores azuis (estilo Stitch UI/Material Design) para a nova opção de baixa prioridade.
[MODIFY] U_AberturaOS.js
Implementar a lógica de cálculo de criticidade para a nova opção ("Baixa Prioridade / Não urgente"), atribuindo o status de criticidade no banco como `Baixa`.
---
3. Módulo Técnico
[MODIFY] T_MinhasOS.html
Adicionar uma nova coluna na esquerda (dentro da classe `.execution-grid`) contendo a lista de OSs atribuídas ao técnico.
Substituir o botão direto de requisição de kit padrão por um componente dinâmico de seleção de kits, exibindo descrição, itens inclusos e permitindo seleção do kit desejado.
Alterar o fluxo de requisição avulsa para permitir selecionar ferramentas/peças diretamente do estoque real do Almoxarifado, exibindo a quantidade disponível.
[MODIFY] T_MinhasOS.css
Atualizar a grid de execução para suportar o layout de três colunas (Lista de OSs, Detalhes da OS, Ações de Execução) e adicionar estilos elegantes para a lista lateral de chamados ativos.
[MODIFY] T_MinhasOS.js
Renderizar a lista de OSs atribuídas ao técnico ativo. Ao clicar em uma OS, atualizar o estado e carregar dinamicamente todas as suas informações na tela.
Preencher o seletor de kits padronizados consultando `mockDb.getKitsPadrao()`, detalhando as ferramentas que os compõem.
Preencher o seletor de itens avulsos com as ferramentas e peças reais do Almoxarifado e limitar a quantidade solicitada à disponível em estoque.
Exibir a criticidade do chamado e os logs de histórico anteriores de manutenção daquela máquina em uma seção específica.
[MODIFY] T_Painel.html
Adicionar a estrutura de um modal de detalhes completos da OS, idêntico à visualização da tela `T_MinhasOS`.
[MODIFY] T_Painel.js
Vincular o clique nas linhas da tabela de OSs abertas para abrir o modal de detalhes completos, exibindo dados do ativo, solicitante, criticidade, histórico e observações. Adicionar um botão de "Assumir OS" dentro do modal.
---
4. Módulo Almoxarifado
[MODIFY] Alm_Painel.html
Adicionar o campo "NF de Origem" no formulário de Cadastro Unificado de Material na aba "Entrada de Notas Fiscais".
Adicionar a coluna "NF de Origem" na tabela de Inventário para rastreabilidade.
Adicionar a estrutura do modal de detalhes da requisição na aba "Retiradas e Devoluções".
[MODIFY] Alm_Painel.js
Alterar as colunas da tabela de solicitações para exibir Número da OS, Kit Designado e Técnico Responsável.
Alterar o texto do botão de ação física na coluna para Confirmar Retirada Física.
Ao clicar em "Confirmar Retirada Física", remover a requisição pendente, alterar o status operacional para `Em campo com técnico`, atualizar o estoque físico e cadastrar a cautela na tabela "Retorno de Ferramental para o Estoque", registrando dados como técnico, data e OS.
Implementar o clique nas solicitações para abrir um modal contendo Número da OS, Técnico, Máquina vinculada, Status, Observações da OS, Kits solicitados e Itens solicitados. Exibir múltiplos itens de forma agrupada e organizada.
Guardar o valor de "NF de Origem" ao cadastrar um material na aba de Notas Fiscais e exibir no inventário.
---
5. Módulo Administrador
[MODIFY] Adm_Painel.js
Corrigir a quebra de execução de JavaScript causada pela leitura de propriedades de criticidade nulas.
Conectar a exibição das Ordens de Serviço de forma reativa a partir do `mockDb.getOrdensServico()` unificado.
Exibir os campos exigidos: Número da OS, Máquina, Solicitante, Técnico responsável, Criticidade, Status, Datas e Observações (descrições do chamado e diagnóstico).
[MODIFY] Adm_Painel.html
Adicionar as colunas e elementos na tabela mestre para exibir as novas informações (Solicitante, Datas, Observações).
[MODIFY] Adm_Kits.html
Substituir o bloco "Inserir Item no Almoxarifado" (Painel 1) por um formulário de Cadastro de Máquinas contendo: Código, Nome, Setor, Fabricante, Modelo, Número de série, Data de aquisição, Nota Fiscal, Descrição e Status operacional.
[MODIFY] Adm_Kits.js
Implementar a submissão do formulário de cadastro de máquinas, persistindo no `mockDb` e atualizando automaticamente os seletores de máquinas das outras telas.
No bloco de montagem de kit padrão, exibir para seleção apenas as ferramentas e peças avulsas (filtrando e excluindo kits pré-existentes do checklist).
No painel "Kits Cadastrados", exibir em tempo real a quantidade, disponibilidade, status e rastreabilidade correlacionados diretamente com as tabelas de controle físico do Almoxarifado.
[MODIFY] Adm_Usuarios.html
Adicionar os campos de Senha, Confirmar senha e Upload de foto de perfil (input tipo arquivo) no formulário de cadastro e edição de usuário.
[MODIFY] Adm_Usuarios.js
Tratar a conversão do arquivo de imagem carregado para string Base64.
Adicionar validações de correspondência de senha na submissão do formulário.
Atualizar a lógica de edição para carregar e preencher a foto atual, senha e demais campos.
Exibir as fotos dos colaboradores como miniatura circular na listagem de usuários ativos.
Integrar as imagens de avatar no rodapé das barras laterais dos sistemas dos outros módulos de acordo com o usuário simulado.
---
Verification Plan
Automated & Manual Verification
Módulo Usuário: Abrir a tela `U_AberturaOS.html`, selecionar a criticidade de "Baixa Prioridade", preencher a OS e submeter. Verificar se a OS foi criada com criticidade `Baixa`.
Módulo Técnico:
Abrir `T_Painel.html` e clicar em uma OS aberta para verificar se abre o modal com as informações idênticas à tela de execução e se o botão "Assumir OS" funciona.
Abrir `T_MinhasOS.html` e checar se a lista lateral de OSs atribuídas aparece e é clicável.
Testar a seleção dinâmica e detalhamento de Kits Padronizados.
Testar a seleção de Peças/Ferramentas avulsas baseadas no estoque real, observando a restrição de quantidade disponível.
Módulo Almoxarifado:
Ir em `Alm_Painel.html` (Retiradas e Devoluções), clicar em uma solicitação de retirada pendente e validar se abre o pop-up com todos os dados da OS, kit e técnico.
Clicar no botão "Confirmar Retirada Física", verificar se some da fila de liberação e entra na tabela de retorno com status "Em campo com técnico".
Na aba "Entrada de Notas Fiscais", realizar um cadastro manual contendo o campo "NF de Origem", e checar se o dado aparece no inventário.
Módulo Administrador:
Abrir `Adm_Painel.html` e verificar se a tabela e os indicadores carregam normalmente sem erros de JavaScript.
Abrir `Adm_Kits.html`, cadastrar uma nova máquina e checar se ela aparece no select de máquinas de abertura de OS e de kits.
Testar o cadastro de novos kits selecionando apenas ferramentas avulsas e verificar a sincronia da tabela de rastreabilidade.
Abrir `Adm_Usuarios.html`, cadastrar/editar usuários com senhas personalizadas e foto de perfil, validando se a miniatura renderiza na tabela e o avatar atualiza na barra lateral.