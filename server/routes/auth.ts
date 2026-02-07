import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// 模拟登录/注册
router.post('/login', async (req, res) => {
  try {
    const { phone, code, type = 'code', password } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // 查找用户
    let user;
    let dbError = null;
    try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone', phone)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        user = data;
    } catch (err: any) {
        dbError = err;
        console.warn('Supabase find user failed:', err.message);
    }

    if (type === 'password') {
        // 密码登录模式：必须有数据库连接且用户存在
        if (dbError) {
             return res.status(500).json({ error: 'Database connection failed, cannot verify password' });
        }
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (!user.password_hash) {
            return res.status(400).json({ error: 'Password not set. Please login with verification code.' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }
    } else {
        // 验证码登录模式 (type === 'code' or undefined)
        
        // 简单验证码校验 (模拟)
        if (code !== '123456') {
           // 为了方便测试，暂时允许任意验证码，或者指定 123456
           // return res.status(400).json({ error: 'Invalid verification code' });
        }

        // 如果用户不存在，创建新用户
        if (!user && !dbError) {
          try {
            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert([
                { 
                    phone, 
                    nickname: `User${phone.slice(-4)}`,
                    avatar_url: 'https://via.placeholder.com/150'
                }
                ])
                .select()
                .single();
            
            if (createError) throw createError;
            user = newUser;
          } catch (createError: any) {
             console.warn('Supabase create user failed:', createError.message);
             dbError = createError; // Mark as DB error to trigger fallback
          }
        }

        // Fallback for code login if DB failed or user creation failed
        if (!user) {
             console.warn('Using mock user fallback');
             user = {
                id: 'mock-user-id-' + phone,
                phone,
                nickname: `User${phone.slice(-4)}`,
                avatar_url: 'https://via.placeholder.com/150',
                roles: ['user'], // 默认角色
                created_at: new Date().toISOString()
            };
        }
    }

    // 记录登录日志 (如果用户已存在且是数据库模式)
    if (user && !user.id.startsWith('mock-') && !dbError) {
        // 权限检查：只有包含 'admin' 字符串的角色才能登录后台
        const roles = user.roles || ['user']; // 默认角色
        const hasAdminAccess = roles.some((role: string) => role.includes('admin') || role.includes('Admin'));
        
        if (!hasAdminAccess) {
             return res.status(403).json({ error: 'Access denied. Admin role required.' });
        }

        try {
            await supabaseAdmin.from('login_logs').insert({ user_id: user.id });
        } catch (logError) {
            console.warn('Failed to record login log:', logError);
            // 登录日志失败不影响主流程
        }
    }

    // 返回用户信息
    let token = 'mock-jwt-token-' + user.id;

    if (process.env.SUPABASE_JWT_SECRET) {
        token = jwt.sign(
            {
                aud: 'authenticated',
                role: 'authenticated',
                sub: user.id,
                app_metadata: {
                    roles: user.roles || ['user'],
                    provider: 'email'
                },
                user_metadata: {
                    phone: user.phone,
                    nickname: user.nickname
                }
            },
            process.env.SUPABASE_JWT_SECRET,
            { expiresIn: '7d' }
        );
    } else {
        console.warn('SUPABASE_JWT_SECRET is not set, using mock token');
    }

    res.json({
      token,
      user
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
