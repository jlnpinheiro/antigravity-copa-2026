# Contexto de Desenvolvimento: Álbum Copa 2026

Este arquivo serve como um registro do histórico recente de desenvolvimento, arquitetura e decisões técnicas tomadas neste projeto. Ele deve ser utilizado como **contexto principal** em futuras interações com agentes (como o Antigravity) para garantir a continuidade do desenvolvimento sem perder o alinhamento com o que já foi construído.

## 1. Persistência de Dados e Docker
- **Desafio:** Inicialmente, o banco de dados (`database.sqlite`) era apagado ou corrompido durante os builds do Docker ou falhava por bloqueios de I/O em mapeamentos diretos de arquivos.
- **Solução Implementada:** 
  - O banco de dados foi movido definitivamente para uma pasta própria: `/data/database.sqlite` (no `server.js`).
  - O `Dockerfile` passou a limpar apenas a pasta `/data` no momento do build.
  - A execução de produção recomendada (`docker run`) passou a utilizar um **Volume Nomeado** (`-v album-db-data:/app/data`), garantindo a preservação total dos dados em ambientes como VPS.

## 2. Segurança e Usuário Admin
- **Desafio:** A senha do primeiro usuário administrador ficava fixada (hardcoded) no código-fonte, o que era um risco de segurança.
- **Solução Implementada:**
  - O usuário `admin` é criado apenas se não existir.
  - Sua senha de criação passou a ser lida da variável de ambiente `ADMIN_PASSWORD` (`process.env.ADMIN_PASSWORD`).
  - **Fluxo Exclusivo de Admin:** O `admin` não é tratado como um usuário comum. Ao logar, ele ignora o carregamento do Álbum (suas figurinhas) e é redirecionado *diretamente* para o Painel de Administração.
  - O usuário `admin` foi ocultado da listagem da API (`WHERE role != 'admin'`) para evitar exclusões ou resets acidentais do próprio dono do sistema.

## 3. Painel de Administração Avançado
- **Novas Features:**
  - **Contagem de Figurinhas:** A listagem de usuários agora traz a coluna "Figurinhas", executando uma subquery (`SELECT COUNT(*)`) no backend para mostrar o total de figurinhas obtidas por cada colecionador.
  - **Ações de Usuário Refinadas:** 
    - Botão **Excluir**: Exige confirmação de segurança (via `confirm()`) e deleta os dados em cascata.
    - Botão **Redefinir senha**: Utiliza um `prompt` para solicitar a nova senha em tempo real, exigindo validação dupla (frontend e backend) de no **mínimo 8 caracteres**.
  - **Limpeza Visual:** A coluna "Cargo" foi removida, e o título principal agora tem contraste correto (branco).

## 4. UI/UX do Usuário Final
- **Pesquisa Dinâmica (Autocomplete):**
  - Adicionado um campo de busca no cabeçalho do álbum.
  - Ao digitar, sugere países em tempo real.
  - Ao clicar na sugestão, o app filtra automaticamente as figurinhas e navega até a aba do grupo correspondente.
- **Correção de Nomenclatura:** 
  - O país "Tchéquia" foi renomeado para "Rep. Tcheca" tanto no setup inicial (`groupsData`) quanto através de um script de migração no `server.js` (`UPDATE stickers SET...`) que roda na inicialização para corrigir bancos antigos.

## 5. Engenharia da Impressão (Print Layout)
- **Desafio:** O antigo formato de impressão era um grid solto e não lembrava um checklist físico.
- **Solução Implementada (Semelhante ao Álbum Físico):**
  - Remoção de cabeçalhos genéricos e construção de uma tabela densa (`<table class="print-table">`).
  - Uso massivo de CSS focado em `%` para garantir adaptação matemática em folhas A4:
    - `table-layout: fixed` com `height: 20.5px` espalhando o conteúdo de ponta a ponta na folha.
    - Colunas divididas estrategicamente (Grupos = 7%, Nomes = 21% com `nowrap`, Células de Figurinhas = 3.3% garantindo quadros uniformes).
  - Divisores visuais densos (`border-top: 3.5px solid #000`) aplicados via a classe `.group-start` no início de cada grupo (A-L, FWC, Coca-Cola).
  - Figurinhas **Faltantes** ficam com fundo branco e as **Obtidas** com fundo cinza (`#94a3b8`) para facilitar o controle e troca física.

## Diretrizes Futuras
Ao modificar este projeto:
1. **Não altere o fluxo de roteamento do Admin:** Ele foi propositalmente separado da view de Álbum para não poluir o banco de dados.
2. **Manutenção do CSS de Impressão:** Qualquer adição de novos grupos (ex: novas categorias de figurinhas) deve receber a classe `.group-start` e respeitar o limite das 20 colunas.
3. **Persistência Local:** Certifique-se de que caminhos apontem para a pasta `/data` se o arquivo tiver que sobreviver a reboots do container.
