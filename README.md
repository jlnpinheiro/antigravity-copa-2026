# Copa FIFA 2026 - Gerenciador do Álbum 🏆

Um sistema *SaaS* (Software as a Service) local-first projetado para gerenciar e organizar a sua coleção de figurinhas da Copa do Mundo FIFA 2026. Feito sob medida com as cores da bandeira do Brasil, o sistema oferece uma interface deslumbrante, fluida e totalmente responsiva.

## 🌟 Principais Funcionalidades

- **Multi-usuário:** Diferentes colecionadores podem ter suas próprias contas (protegidas por senha e tokens JWT) rodando no mesmo servidor.
- **PWA Ready (Progressive Web App):** Instale o gerenciador diretamente na tela inicial do seu celular (Android/iOS) como um aplicativo nativo. Funciona com estratégias de cache offline!
- **Painel de Progresso:** Acompanhe em tempo real a porcentagem do álbum completo, quantas figurinhas faltam e quantas são repetidas.
- **Gestão Ágil:** Marque figurinhas como coladas tocando diretamente no cartão. Controle suas repetidas facilmente com botões dedicados de "+" e "-".
- **Impressão de Checklist:** Clique em "Imprimir" e o sistema gera automaticamente uma lista otimizada contendo apenas as figurinhas que você precisa trocar, economizando tinta e papel.
- **Painel Admin:** Funcionalidades de administração para gerenciar usuários e acesso.
- **Suporte a Proxy Reverso:** O aplicativo inteiro funciona perfeitamente por trás de proxies como Nginx ou Apache, em qualquer subdiretório (ex: `/copa-2026`).

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js com Express e JWT para autenticação.
- **Banco de Dados:** SQLite3 (Leve, local e embutido no projeto).
- **Frontend:** Vanilla JavaScript + HTML5 + Tailwind CSS (via CDN).
- **Offline/Mobile:** Service Workers (`sw.js`) e Web Manifest.

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado na sua máquina (versão 18+ recomendada).

### Passo a passo
1. Abra o terminal e navegue até a pasta do projeto.
2. Instale as dependências executando:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   node server.js
   ```
4. O servidor iniciará e o banco de dados `database.sqlite` será criado automaticamente caso não exista.
5. Acesse no seu navegador: `http://localhost:3000`

## 🐳 Executando via Docker (Para Produção/VPS)

Se você desejar publicar o projeto numa VPS ou servidor local usando Docker, o projeto já vem com um `Dockerfile` pronto!

1. Construa a imagem Docker:
   ```bash
   docker build -t jlnpinheiro/copa-2026-album:latest .
   ```
2. Execute o container mapeando a pasta `data` como um volume (Recomendado):
   ```bash
   docker run -d --name copa-2026-album -p 3000:3000 --security-opt seccomp=unconfined -v album-db-data:/app/data jlnpinheiro/copa-2026-album:latest
   ```

*Nota: Ao utilizar o volume apontando para `/app/data`, o banco de dados (SQLite) persiste fora do ciclo de vida do container. Você não perderá os dados ao atualizar a aplicação.*

## 🔒 Acesso e Credenciais
- O primeiro usuário cadastrado no sistema não ganha privilégios de Admin automaticamente (pode ser ajustado via banco de dados diretamente, alterando a coluna `role` para `admin`).
- Requisitos de segurança: Senhas devem conter pelo menos 8 caracteres.

## 📱 Dica de Uso
Acesse a página no navegador do seu smartphone, clique no menu do navegador (três pontinhos) e selecione **"Adicionar à Tela Inicial"**. O aplicativo funcionará em tela cheia e offline!

---
*Desenvolvido para colecionadores exigentes.*
