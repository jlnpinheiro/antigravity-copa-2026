# Use uma imagem oficial e leve do Node.js (versão slim para melhor compatibilidade com o SQLite)
FROM node:20-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração do npm
COPY package*.json ./

# Instala as dependências (apenas as de produção)
RUN npm install --production

# Copia todo o restante do código da aplicação
COPY . .

# Exclui o banco de dados local da imagem para iniciar um banco limpo
RUN rm -rf data/

# Expõe a porta que o servidor Node utiliza
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "start"]
