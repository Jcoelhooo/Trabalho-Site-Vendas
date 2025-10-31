# Trabalho-Site-Vendas
Trabalho de Juliano, João e Amanda
# API de Estoque - SiteVendas

API RESTful para gerenciamento de estoque de produtos com TypeScript, Sequelize, JWT e Swagger.

## 🚀 Tecnologias

- **TypeScript** - Tipagem estática
- **Sequelize** - ORM para SQLite
- **JWT** - Autenticação baseada em tokens
- **Swagger** - Documentação automática da API
- **Express** - Framework web
- **Docker** - Containerização

## 📋 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (opcional)

## 🔧 Instalação Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env e defina JWT_SECRET

# Build TypeScript
npm run build

# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start
```

## 🐳 Docker

```bash
# Construir e iniciar
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

## 📚 Documentação Swagger

Após iniciar a API, acesse:

- **Swagger UI**: `http://localhost:3001/api/docs`
- **Healthcheck**: `http://localhost:3001/api/health`

## 🔐 Autenticação

### Registrar usuário

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "role": "user"
  }
}
```

### Usar token

Adicione o header em requisições protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📦 Endpoints

### Públicos

- `GET /api/health` - Healthcheck
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto por ID
- `GET /api/stock?sku=SKU` - Consultar estoque por SKU
- `GET /api/stock?id=ID` - Consultar estoque por ID
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login

### Protegidos (Admin)

- `PUT /api/products/:id/stock` - Definir estoque absoluto
- `PATCH /api/products/:id/stock` - Ajustar estoque (delta)

## 👤 Usuário Admin Padrão

Ao iniciar pela primeira vez, um usuário admin é criado automaticamente:

- **Email**: `admin@example.com`
- **Senha**: `admin123`
- **Role**: `admin`

⚠️ **IMPORTANTE**: Altere essas credenciais em produção!

## 🔒 Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
PORT=3001
JWT_SECRET=seu-secret-super-seguro-aqui-mude-em-producao
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## 📝 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts    # Configuração Sequelize
│   │   └── swagger.ts     # Configuração Swagger
│   ├── models/
│   │   ├── Product.ts     # Modelo de Produto
│   │   └── User.ts        # Modelo de Usuário
│   ├── middleware/
│   │   └── auth.ts        # Middleware JWT
│   ├── routes/
│   │   ├── auth.ts        # Rotas de autenticação
│   │   ├── products.ts    # Rotas de produtos
│   │   └── stock.ts       # Rotas de estoque
│   └── server.ts          # Servidor Express
├── dist/                  # Build TypeScript (gerado)
├── data/                  # Banco SQLite (gerado)
├── tsconfig.json
├── package.json
├── Dockerfile
└── docker-compose.yml
```

## 🧪 Testando a API

### 1. Criar usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123","name":"Teste"}'
```

### 2. Fazer login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### 3. Atualizar estoque (admin)
```bash
curl -X PUT http://localhost:3001/api/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"stock": 100}'
```

## 📄 Licença
