import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    login: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token de acesso não fornecido' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido ou expirado:', err.message);
      res.status(403).json({ error: 'Token inválido ou expirado' });
      return;
    }
    
    console.log('🔍 Token decodificado:', decoded);
    
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      req.user = {
        id: decoded.id as number,
        login: decoded.login as string,
        role: decoded.role as string,
      };
      console.log('✅ req.user populado:', req.user);
    } else {
      console.log('❌ Token decodificado não contém id:', decoded);
      res.status(403).json({ error: 'Token inválido' });
      return;
    }
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  console.log('🔍 requireAdmin - req.user:', req.user);
  console.log('🔍 requireAdmin - req.user?.role:', req.user?.role);
  console.log('🔍 requireAdmin - Comparação:', req.user?.role === 'admin');
  
  if (!req.user) {
    console.log('❌ req.user não existe');
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    return;
  }
  
  if (req.user.role !== 'admin') {
    console.log(`❌ Role "${req.user.role}" não é "admin"`);
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    return;
  }
  
  console.log('✅ Usuário é admin, permitindo acesso');
  next();
}




