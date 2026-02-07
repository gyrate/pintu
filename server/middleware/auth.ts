import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Express Request 类型以包含 user 信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // 如果是 mock token，暂时放行（用于兼容旧数据或测试）
  if (token.startsWith('mock-jwt-token-')) {
    // 尝试解析 mock token 中的 user id
    const userId = token.replace('mock-jwt-token-', '');
    req.user = { id: userId, roles: ['user'] }; // 默认 mock 只有 user 权限
    return next();
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.warn('SUPABASE_JWT_SECRET not set, skipping JWT verification');
    return next();
  }

  try {
    const user = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = user;
    next();
  } catch (err: any) {
    console.error('JWT verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
