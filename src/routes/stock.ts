import { Router, Request, Response } from "express";
import { Product } from "../models/Product.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// ✅ Obter estoque por SKU ou ID
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku, id } = req.query;

    if (!sku && !id) {
      res.status(400).json({ error: "Informe sku ou id" });
      return;
    }

    let product = null;

    if (sku) {
      product = await Product.findOne({
        where: { sku: String(sku) },
        attributes: ["id", "sku", "stock"]
      });
    } else {
      product = await Product.findByPk(Number(id), {
        attributes: ["id", "sku", "stock"]
      });
    }

    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    res.json({ id: product.id, sku: product.sku, stock: product.stock });
  } catch (error) {
    console.error("Erro ao consultar estoque:", error);
    res.status(500).json({ error: "Erro ao consultar estoque" });
  }
});

export default router;

