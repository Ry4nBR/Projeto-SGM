# Documentação Técnica e Funcional do SGM
## Sistema de Gerenciamento de Manutenção (SGM) — Dilly Sports

---

## 1. Introdução e Contextualização
A **Dilly Sports** é uma fábrica calçadista localizada em Brejo Santo, Ceará, que produz calçados esportivos sob licença de grandes marcas. Diariamente, a fábrica registra dezenas de solicitações de manutenção industrial oriundas dos setores de Corte, Costura, Montagem e Acabamento. 

Anteriormente, este controle era manual (feito em blocos de papel e planilhas isoladas), gerando:
- Atrasos no tempo médio de resposta.
- Dificuldade na priorização de máquinas paradas (impactando a linha de produção).
- Falta de controle sobre quais ferramentas foram retiradas e se foram efetivamente devolvidas ao Almoxarifado.
- Inexistência de histórico cronológico de quebras e manutenções preventivas/corretivas por ativo.

O **SGM** foi concebido em parceria com o **Centro de Formação Profissional Wanderillo de Castro Câmara** para digitalizar e integrar todo o fluxo operacional da manutenção de forma 100% autônoma e compatível com a infraestrutura de rede da fábrica.

---

## 2. Requisitos do Sistema

### 2.1. Requisitos Funcionais (RF)
O sistema foi estruturado e desenvolvido para atender aos seguintes requisitos:

- **RF-001 (Autenticação por Perfil):** O sistema deve permitir o login com base nos perfis do arquivo `bd.md` (Administrador, Técnico, Almoxarife e Operador). A matrícula, e-mail ou nome de usuário associado com a senha correta devem liberar o acesso.
- **RF-002 (Abertura de Chamados - Operador):** O operador da produção deve conseguir abrir uma OS especificando a máquina (selecionada dinamicamente da base), setor, especialidade técnica (Mecânica, Elétrica, Pneumática), descrição do problema e condição da máquina (Funcionando com Restrição ou Parada Total).
- **RF-003 (Cálculo Automático de Criticidade):** Se a máquina for declarada como "Parada Total", o SGM deve definir a criticidade automaticamente como **Alta (Parada Crítica)**. Se estiver funcionando com restrições, define como **Média (Alerta Operacional)**.
- **RF-004 (Fila Geral de Chamados - Técnico):** O técnico de manutenção deve visualizar uma fila ordenada por criticidade de todos os chamados com status `Aberta`. Ele deve conseguir clicar em "Assumir" para vincular o chamado ao seu perfil.
- **RF-005 (Painel de Execução - Técnico):** O técnico deve ter uma aba particular ("Minhas OS") para gerenciar as ordens sob sua responsabilidade. Ele deve poder solicitar Kits de Ferramentas Padronizados ou Peças Avulsas.
- **RF-006 (Controle de Estoque e Dispensação - Almoxarife):** O almoxarife deve visualizar as solicitações de materiais pendentes e clicar em "Baixar e Entregar", gerando a baixa automática no estoque do Almoxarifado e gerando uma Cautela de Retorno.
- **RF-007 (Retorno de Ferramentas - Almoxarife):** Ao concluir a manutenção, o técnico devolve as ferramentas. O almoxarife confirma o recebimento físico, o que incrementa o estoque de volta, encerra o chamado e gera o log automático no histórico do ativo.
- **RF-008 (Histórico Cronológico - Administrador):** O administrador geral deve conseguir consultar o histórico detalhado de intervenções por máquina, visualizando data, falha, técnico responsável, peças aplicadas e parecer descritivo.
- **RF-009 (Engenharia de Kits e Colaboradores - Administrador):** O administrador deve conseguir cadastrar novos kits padrão vinculados a máquinas e gerenciar (cadastrar, editar e desativar) usuários e técnicos na fábrica.

### 2.2. Requisitos Não-Funcionais (RNF)
- **RNF-001 (Funcionamento Local/Offline):** O sistema deve funcionar completamente local, sem depender de conexão contínua com a internet ou servidores externos, gravando os dados no `localStorage` do navegador.
- **RNF-002 (Tecnologia Pura):** Construído estritamente com HTML5, CSS3 e JavaScript (Vanilla) puro para fácil manutenção e leveza.
- **RNF-003 (Design Responsivo e Acessível):** Cores harmoniosas (estilo dark-theme e glassmorphism nos menus de desenvolvimento) e tipografia limpa (família Inter) para visualização robusta nos monitores industriais.

---

## 3. Modelo Conceitual do Banco de Dados Simulado

O SGM emula perfeitamente uma modelagem de banco de dados relacional (PostgreSQL) estruturada em chaves primárias e chaves estrangeiras lógicas:

```
+------------------+         +------------------+         +------------------+
|    USUARIOS      |         |   EQUIPAMENTOS   |         |   ALMOXARIFADO   |
+------------------+         +------------------+         +------------------+
| id (PK)          |         | tag (PK)         |         | codigo (PK)      |
| nome             |         | nome             |         | nome             |
| email            |         | setor            |         | categoria        |
| cargo            |         | status           |         | qtd_atual        |
| status_usuario   |         +------------------+         | qtd_minima       |
+------------------+                  |                   | localizacao      |
         |                            |                   +------------------+
         | (solicitante_id)           | (equipamento_tag)          |
         v                            v                            | (item_codigo)
+-----------------------------------------------+                  |
|               ORDENS_SERVICO                  |                  |
+-----------------------------------------------+                  |
| id (PK)                                       |                  |
| codigo_os                                     |                  |
| equipamento_tag (FK)                          |                  |
| tipo_falha                                    |                  |
| descricao_problema                            |                  |
| solicitante_id (FK)                           |                  |
| tecnico_id (FK)                               |                  |
| status_os                                     |                  |
| diagnostico_tecnico                           |                  |
+-----------------------------------------------+                  |
         |                                                         |
         | (os_codigo)                                             |
         v                                                         v
+------------------------+                        +--------------------------+
|  REQUISICOES_MATERIAIS |                        |   CONTROLE_FERRAMENTAL   |
+------------------------+                        +--------------------------+
| id (PK)                |                        | id (PK)                  |
| os_codigo (FK)         |                        | codigo_retorno           |
| tecnico_id (FK)        |                        | item_nome                |
| tipo (Kit/Avulso)      |                        | tecnico_id (FK)          |
| item_nome              |----------------------->| status_ativo             |
| status_requisicao      | (gera cautela na     | data_retirada            |
+------------------------+  baixa física)         +--------------------------+
```

---

## 4. O Ciclo de Vida de uma Ordem de Serviço (OS)

Para entender perfeitamente o fluxo integrado reativo construído com o `mockDb.js`, siga o passo a passo da simulação de uma manutenção corretiva:

1. **Abertura:** O operador **Wanderillo de Castro** entra no sistema e abre um chamado para a Prensa Hidráulica `MQ-02` (com status "Parada"). Uma ordem com status `Aberta` e criticidade `Alta` é gravada no banco.
2. **Assumir Chamado:** O técnico **Carlos Silva** entra no painel, vê a Prensa parada no topo e clica em **"Assumir OS"**. A OS agora muda seu status para `Em Andamento` e é vinculada ao ID do técnico.
3. **Requisição de Ferramental:** Na tela "Minhas OS", Carlos clica em **"Solicitar Kit de Ferramentas"**. Isso insere uma requisição com status `Pendente` no estoque.
4. **Liberação de Estoque:** O almoxarife **Marcos Souza** acessa seu painel e visualiza a solicitação do kit do técnico. Ele clica em **"Baixar e Entregar"**. O SGM automaticamente:
   - Diminui a quantidade física do Kit no inventário do Almoxarifado.
   - Cria um registro de Cautela de Retorno (`#RET-XXX`) atrelado ao técnico.
5. **Execução e Encerramento:** Carlos realiza o serviço físico na prensa, volta ao computador e clica em **"Encerrar Manutenção"**. Ele digita o parecer descritivo (ex: "Efetuada a troca preventiva do contator de potência K1...") e envia. O status da OS muda para `Aguardando Devolução de Ferramentas`.
6. **Devolução:** Carlos entrega o kit de volta ao Almoxarifado. O almoxarife Marcos confirma o recebimento clicando em **"Confirmar Recebimento Físico"**. O SGM executa três ações automáticas:
   - Retorna o kit ao estoque, marcando-o novamente como `Disponível`.
   - Altera o status da OS final para `Concluído`.
   - Gera um log estruturado na cronologia do histórico da prensa `MQ-02` com os materiais usados e o relatório do técnico.
7. **Rastreabilidade:** O Administrador Geral acessa a tela de **Histórico de Máquinas**, seleciona a prensa `MQ-02` e visualiza o relatório completo gerado no encerramento da manutenção de forma automatizada.
