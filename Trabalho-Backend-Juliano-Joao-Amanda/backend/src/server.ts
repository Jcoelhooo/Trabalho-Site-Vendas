import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { seedProductsIfEmpty } from './models/Product.js';
import { seedAdminUser } from './models/User.js';
import productRoutes from './routes/products.js';
import stockRoutes from './routes/stock.js';
import authRoutes from './routes/auth.js';
import { setupSwagger } from './config/swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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

