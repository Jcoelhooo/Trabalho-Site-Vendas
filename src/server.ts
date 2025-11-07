import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { seedProductsIfEmpty } from './models/Product.js';
import { seedAdminUser } from './models/User.js';
import productRoutes from './routes/products.js';
import stockRoutes from './routes/stock.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { setupSwagger } from './config/swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// CORS configurado para aceitar requisições do frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Log para debug
    console.log('🌐 CORS: Recebida requisição de origem:', origin || 'null (sem origin)');
    
    // Em desenvolvimento, aceita qualquer origem localhost ou null
    if (process.env.NODE_ENV !== 'production') {
      // Aceita requisições sem origin (ex: Postman, curl, alguns navegadores)
      if (!origin) {
        console.log('✅ CORS: Permitindo requisição sem origin (desenvolvimento)');
        return callback(null, true);
      }
      
      // Aceita qualquer localhost ou 127.0.0.1 em qualquer porta
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('✅ CORS: Permitindo origem localhost:', origin);
        return callback(null, true);
      }
    }
    
    // Lista de origens permitidas
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ].filter(Boolean);
    
    // Em produção, verifica se a origem está permitida
    if (origin && allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origem permitida:', origin);
      callback(null, true);
    } else {
      // Por segurança, em produção deve ter origin válida
      if (process.env.NODE_ENV === 'production') {
        console.log('❌ CORS: Origem não permitida:', origin);
        callback(new Error('Origem não permitida pelo CORS'));
      } else {
        console.log('✅ CORS: Permitindo origem (modo desenvolvimento):', origin);
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Root route
app.get('/', (_req, res) => {
  res.type('text/plain').send([
    'API de estoque: use os endpoints abaixo:',
    '',
    'GET  /api/health',
    'GET  /api/products',
    'GET  /api/docs (Swagger)',
    'GET  /api/stock?sku=IPHN-15-PNK',
    'POST /api/auth/login',
    'POST /api/auth/register',
    'GET  /api/users (admin)',
    'DELETE /api/users/:id (admin)',
    'PUT  /api/products/:id/stock   { "stock": 10 } (admin)',
    'PATCH /api/products/:id/stock  { "delta": -1 } (admin)'
  ].join('\n'));
});

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Swagger
setupSwagger(app);

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await seedProductsIfEmpty();
    await seedAdminUser();
    
    app.listen(PORT, () => {
      console.log(`🚀 API de estoque rodando em http://localhost:${PORT}`);
      console.log(`📚 Documentação Swagger: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

