# Funcionalidades e Correções Pendentes (Faltas.md)

Este documento lista as pendências, divergências e erros encontrados no sistema atual em relação ao **Planinho — Plano de Implementação das Melhorias do SGM**.

---

## 1. Erros e Bugs Críticos (Quebra de Telas)

### 1.1. Erro de Escopo em `Tecnico/T_Painel.js`
* **Descrição:** A função `abrirModalDetalhes(os)` tenta buscar a máquina correspondente acessando a variável local `equipamentos` (linha 160). No entanto, esta variável está definida apenas localmente dentro de `renderizarFilaGeral()`.
* **Impacto:** Ao clicar em qualquer linha da fila geral de OS, ocorre um erro de execução `ReferenceError: equipamentos is not defined` no console do navegador e o modal de detalhes não abre.

### 1.2. Erro de Escopo em `Administrador/Adm_Painel.js`
* **Descrição:** Assim como na tela do técnico, a função `abrirModalDetalhesOSAdm(os)` (linha 221) tenta ler a variável local `equipamentos` que está declarada apenas em escopos de outras funções.
* **Impacto:** Ocorre o erro `ReferenceError: equipamentos is not defined` ao clicar em qualquer OS da tabela de acompanhamento geral do administrador.

---

## 2. Divergências e Funcionalidades Não Implementadas (Gaps)

### 2.1. Tela do Técnico — `T_MinhasOS`
* **Informações na Lista de OS Atribuídas:** A barra lateral de OSs atribuídas (`lista-os-atribuidas`) exibe o código da OS, a máquina, o status e a criticidade, mas **não exibe o Setor** (divergindo do item 4 do plano).
* **Navegação Dinâmica (Sem Recarregar a Tela):** Ao clicar em uma OS na barra lateral de atribuídas, o script executa `window.location.search = ?os=...`, o que recarrega a página inteira. O plano exige: *"Mantém o técnico na mesma tela"* (ou seja, carregar os dados e atualizar as ações dinamicamente sem reload).
* **Opções de Status Incompletas:** O menu dropdown de alteração de status (`select-alterar-status`) só possui as opções "Em Manutenção" e "Aguardando Peças". Faltam as opções **"Aguardando Devolução de Ferramentas"** e **"Concluído"** requeridas no plano para a troca de status do técnico.

### 2.2. Tela do Almoxarifado — `Alm_Painel`
* **Inconsistência Visual na Tabela de Inventário:** Em `Alm_Painel.html`, a tabela de inventário possui 8 cabeçalhos (incluindo "NF de Origem"), mas as linhas estáticas (`tr` no HTML) possuem apenas 7 células (`td`), omitindo o campo NF de Origem antes da carga do JS, gerando desalinhamento visual inicial na tabela.

### 2.3. Tela do Administrador — `Adm_Kits`
* **Status de Cadastro de Máquina Incompleto:** O formulário de cadastro de novas máquinas não oferece a opção de status **"Em observação"** no dropdown (`sel-maq-status`), constando apenas "Operando", "Parado" e "Em Manutenção".
* **Checklist de Ferramentas Incompleto no Cadastro de Kits:** O checklist de componentes exibe apenas itens da categoria "Ferramenta Avulsa". O plano solicita expressamente: *"exibir somente: Ferramentas avulsas e Peças de reposição"*. Logo, as **Peças de reposição** do almoxarifado estão ausentes da listagem.
* **Colunas Faltantes na Rastreabilidade de Kits:** A tabela de Kits Cadastrados e Status Operacional não possui colunas dedicadas para **Descrição**, **OS vinculada**, **Técnico responsável** e **Data de retirada**, limitando-se a concatenar parte dessas informações em um badge de status genérico.

---

## 3. Plano de Ação para Atualização

Para atualizar as telas e cumprir o plano original sem retrabalho, faremos as seguintes correções:
1. Declarar/buscar `equipamentos` corretamente nos escopos das funções de modal em `T_Painel.js` e `Adm_Painel.js`.
2. Adicionar o Setor no template de item de OS atribuída na barra lateral de `T_MinhasOS.js`.
3. Ajustar o clique em OSs na barra lateral de `T_MinhasOS.js` para recarregar a interface da OS selecionada sem recarregar a página inteira (usando histórico de estado interno ou simples update reativo).
4. Adicionar "Aguardando Devolução de Ferramentas" e "Concluído" no dropdown de status em `T_MinhasOS.html`.
5. Corrigir o desalinhamento de colunas em `Alm_Painel.html` inserindo as células correspondentes a `NF de Origem` nas linhas estáticas.
6. Adicionar a opção "Em observação" no dropdown de status de máquinas em `Adm_Kits.html`.
7. Atualizar a listagem de componentes em `Adm_Kits.js` para puxar e listar tanto "Ferramenta Avulsa" quanto "Peça de Reposição".
8. Reformular a tabela de kits em `Adm_Kits.html` e `Adm_Kits.js` para conter colunas específicas para todos os dados solicitados de rastreabilidade (Nome, Descrição, Máquina vinculada, Status, OS vinculada, Técnico responsável, Data de retirada).
