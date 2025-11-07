import express, { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar todos os produtos
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos
 *       401:
 *         description: Não autenticado
 */
router.get('/', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    const wantsHtml = (_req.headers['accept'] || '').includes('text/html');
    
    if (wantsHtml) {
      const rows = products.map(p => `
        <tr>
          <td>${p.id}</td>
          <td><code>${p.sku}</code></td>
          <td>${p.name}</td>
          <td>${p.stock}</td>
        </tr>
      `).join('');
      
      const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Produtos • API de Estoque</title>
    <style>
      :root { --bg:#0f172a; --card:#111827; --txt:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; }
      html,body{margin:0;padding:0;background:var(--bg);color:var(--txt);font:14px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"}
      .wrap{max-width:960px;margin:40px auto;padding:0 16px}
      h1{font-size:22px;margin:0 0 16px}
      .card{background:linear-gradient(180deg,#111827,#0b1220);border:1px solid #1f2937;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
      table{width:100%;border-collapse:collapse}
      th,td{padding:12px 14px;border-bottom:1px solid #1f2937;text-align:left}
      th{color:var(--muted);font-weight:600;letter-spacing:.02em}
      tr:hover td{background:#0b1220}
      code{color:var(--accent)}
      .links{margin:16px 0 24px}
      .links a{color:var(--accent);text-decoration:none;margin-right:16px}
      .links a:hover{text-decoration:underline}
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Produtos (API de Estoque)</h1>
      <div class="links">
        <a href="/api/health">/api/health</a>
        <a href="/api/docs">/api/docs</a>
        <a href="/api/stock?sku=IPHN-15-PNK">/api/stock?sku=...</a>
      </div>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Nome</th>
              <th>Estoque</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  </body>
 </html>`;
      res.type('html').send(html);
    } else {
      res.json(products);
    }
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar novo produto (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - stock
 *             properties:
 *               sku:
 *                 type: string
 *                 example: "PROD-NEW-001"
 *               name:
 *                 type: string
 *                 example: "Novo Produto"
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku, name, stock } = req.body;

    if (!sku || !name || typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'sku, name e stock (>= 0) são obrigatórios' });
      return;
    }

    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      res.status(400).json({ error: 'SKU já existe' });
      return;
    }

    const product = await Product.create({ sku, name, stock });
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 *       401:
 *         description: Não autenticado
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Definir estoque absoluto (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Estoque atualizado
 *       403:
 *         description: Acesso negado
 */
router.put('/:id/stock', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { stock } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'stock deve ser um número >= 0' });
      return;
    }
    
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    
    product.stock = stock;
    await product.save();
    
    res.json({ id: product.id, sku: product.sku, stock: product.stock });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Erro ao atualizar estoque' });
  }
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Ajustar estoque relativamente (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delta
 *             properties:
 *               delta:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estoque ajustado
 *       400:
 *         description: Estoque insuficiente ou dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.patch('/:id/stock', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { delta } = req.body;
    
    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      res.status(400).json({ error: 'delta deve ser um número' });
      return;
    }
    
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    
    const newStock = product.stock + delta;
    if (newStock < 0) {
      res.status(400).json({ error: 'Estoque insuficiente' });
      return;
    }
    
    product.stock = newStock;
    await product.save();
    
    res.json({ id: product.id, sku: product.sku, stock: product.stock });
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    res.status(500).json({ error: 'Erro ao ajustar estoque' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualizar produto completo (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - stock
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Produto não encontrado
 *       403:
 *         description: Acesso negado
 */
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { sku, name, stock } = req.body;

    if (!sku || !name || typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'sku, name e stock (>= 0) são obrigatórios' });
      return;
    }

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // Verifica se SKU já existe em outro produto
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct && existingProduct.id !== id) {
      res.status(400).json({ error: 'SKU já existe em outro produto' });
      return;
    }

    product.sku = sku;
    product.name = name;
    product.stock = stock;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Deletar produto (admin)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *       404:
 *         description: Produto não encontrado
 *       403:
 *         description: Acesso negado
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    await product.destroy();
    res.json({ message: 'Produto deletado com sucesso', id });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

export default router;

