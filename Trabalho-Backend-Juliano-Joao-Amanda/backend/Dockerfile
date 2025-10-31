FROM node:20-alpine

WORKDIR /app

# Instala todas as dependências (incluindo dev para build)
COPY package*.json ./
RUN npm ci

# Copia código e arquivos de configuração
COPY tsconfig.json ./
COPY src ./src

# para buildar typescript
RUN npm run build

# Remove dependências de desenvolvimento após build
RUN npm ci --omit=dev

# Exposição da porta da API
EXPOSE 3001

# Comando de inicialização
CMD ["node", "dist/server.js"]


