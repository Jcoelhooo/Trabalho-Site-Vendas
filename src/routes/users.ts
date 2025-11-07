import express, { Request, Response } from 'express';
import { User } from '../models/User.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos os usuários (admin)
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (apenas admin)
 */
router.get('/', authenticateToken, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'login', 'email', 'name', 'role', 'createdAt'],
      order: [['id', 'ASC']],
    });
    
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deletar usuário (admin)
 *     tags: [Usuários]
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
 *         description: Usuário deletado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       403:
 *         description: Acesso negado (apenas admin)
 *       401:
 *         description: Não autenticado
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const currentUser = (req as AuthRequest).user;
    
    // Não permite deletar a si mesmo
    if (currentUser && currentUser.id === id) {
      res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
      return;
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    
    await user.destroy();
    res.json({ message: 'Usuário deletado com sucesso', id });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;

