import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Nome de usuário (login)
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *                 example: "123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, password } = req.body;

    console.log('🔍 Iniciando login...', { login: login?.substring(0, 10) + '...' });

    if (!login || !password) {
      res.status(400).json({ error: 'Login e senha são obrigatórios' });
      return;
    }

    // Normaliza o login para busca (sem espaços, mas mantém case)
    const normalizedLogin = login.trim();
    console.log('🔍 Buscando usuário com login:', normalizedLogin);
    
    // Busca o usuário SEM excluir password (garante que o password seja retornado)
    const user = await User.findOne({ 
      where: { login: normalizedLogin },
      attributes: { include: ['password'] } // Garante que password seja incluído
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', normalizedLogin);
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      login: user.login,
      role: user.role,
      passwordHash: user.password ? `${user.password.substring(0, 10)}...` : 'NULL/UNDEFINED',
      passwordLength: user.password ? user.password.length : 0,
      passwordStartsWithDollar: user.password ? user.password.startsWith('$2') : false
    });

    console.log('🔐 Comparando senha...');
    const isValid = await user.comparePassword(password);
    console.log('🔐 Resultado da comparação:', isValid);
    
    if (!isValid) {
      console.log('❌ Senha inválida para usuário:', user.login);
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    console.log('✅ Login válido! Gerando token JWT...');
    console.log('📝 Payload do JWT:', {
      id: user.id,
      login: user.login,
      role: user.role
    });
    
    const tokenPayload = {
      id: user.id,
      login: user.login,
      role: user.role
    };
    
    const token = jwt.sign(
      tokenPayload,
      secret,
      { expiresIn } as jwt.SignOptions
    );

    console.log('✅ Token gerado com sucesso! Login completo para:', user.login);
    console.log('📝 Token payload inclui:', { id: user.id, login: user.login, role: user.role });
    
    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     security: []  # Não requer autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Nome de usuário (login) - único, 3-50 caracteres
 *                 example: "juliano"
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário (opcional)
 *                 example: "Juliano Coelho"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário (opcional)
 *                 example: "juliano@example.com"
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 description: Senha do usuário (mínimo 3 caracteres, sem caracteres especiais obrigatórios)
 *                 example: "12345"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Dados inválidos ou email já existe
 *       500:
 *         description: Erro ao criar usuário
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Requisição de registro recebida');
    console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📝 Body recebido:', JSON.stringify(req.body, null, 2));
    
    const { login, name, email, password } = req.body;

    console.log('📝 Iniciando registro de novo usuário...', { login: login?.substring(0, 10) + '...' });

    // Validação dos campos obrigatórios
    if (!login || !password) {
      res.status(400).json({ error: 'Login e senha são obrigatórios' });
      return;
    }

    if (login.length < 3 || login.length > 50) {
      res.status(400).json({ error: 'O login deve ter entre 3 e 50 caracteres' });
      return;
    }

    if (password.length < 3) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 3 caracteres' });
      return;
    }

    // Normaliza o login (remove espaços)
    const normalizedLogin = login.trim();

    // Se name não foi fornecido, usa o login como nome padrão
    let userName = name?.trim();
    if (!userName || userName === '') {
      userName = normalizedLogin;
      console.log('📝 Nome não fornecido, usando login como nome:', userName);
    }

    // Normaliza email se fornecido
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    // Verifica se o login já existe
    const existingUser = await User.findOne({ 
      where: { login: normalizedLogin }
    });

    if (existingUser) {
      console.log('❌ Login já cadastrado:', normalizedLogin);
      res.status(400).json({ error: 'Este login já está cadastrado' });
      return;
    }

    // Cria o novo usuário (a senha será hasheada automaticamente pelo hook beforeCreate)
    console.log('📝 Criando novo usuário com:', {
      login: normalizedLogin,
      name: userName,
      email: normalizedEmail || 'não fornecido',
      passwordLength: password.length,
      role: 'user'
    });
    
    const newUser = await User.create({
      login: normalizedLogin,
      name: userName,
      email: normalizedEmail,
      password: password, // Será hasheada automaticamente pelo hook beforeCreate
      role: 'user' // Novos usuários são sempre 'user', não 'admin'
    });

    // Busca o usuário recém-criado para verificar se a senha foi hasheada
    const createdUser = await User.findOne({
      where: { login: normalizedLogin },
      attributes: { include: ['password'] }
    });

    console.log('✅ Usuário criado com sucesso:', {
      id: newUser.id,
      login: newUser.login,
      name: newUser.name,
      role: newUser.role,
      passwordHash: createdUser?.password ? `${createdUser.password.substring(0, 30)}...` : 'NULL',
      passwordLength: createdUser?.password?.length || 0,
      passwordStartsWithDollar: createdUser?.password?.startsWith('$2') || false
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        login: newUser.login,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao registrar usuário:', error);
    console.error('Stack trace:', error.stack);
    
    // Trata erros específicos do Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errorMessages = error.errors.map((e: any) => e.message).join(', ');
      console.error('Erro de validação:', errorMessages);
      res.status(400).json({ error: 'Dados inválidos: ' + errorMessages });
      return;
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Login já existe no banco de dados');
      res.status(400).json({ error: 'Este login já está cadastrado' });
      return;
    }
    
    res.status(500).json({ error: 'Erro ao criar usuário: ' + (error.message || 'Erro desconhecido') });
  }
});

export default router;

