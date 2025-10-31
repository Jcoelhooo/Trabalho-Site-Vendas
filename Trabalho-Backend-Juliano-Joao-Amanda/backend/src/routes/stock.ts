import express, { Request, Response } from 'express';
import { Product } from '../models/Product.js';

const router = express.Router();

/**
 * @swagger
 * /api/stock:
 *   get:
 *     summary: Consultar estoque por SKU ou ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estoque consultado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku, id } = req.query;
    let product: Product | null = null;
    
    if (sku) {
      product = await Product.findOne({ where: { sku: String(sku) } });
    } else if (id) {
      product = await Product.findByPk(Number(id));
    } else {
      res.status(400).json({ error: 'Informe sku ou id' });
      return;
    }
    
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    
    res.json({ id: product.id, sku: product.sku, stock: product.stock });
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    res.status(500).json({ error: 'Erro ao consultar estoque' });
  }
});

export default router;

