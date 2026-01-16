import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// 模拟登录/注册
router.post('/login', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // 简单验证码校验 (模拟)
    if (code !== '123456') {
       // 为了方便测试，暂时允许任意验证码，或者指定 123456
       // return res.status(400).json({ error: 'Invalid verification code' });
    }

    // 查找用户
    let user;
    try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone', phone)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        user = data;
    } catch (dbError: any) {
        console.warn('Supabase find user failed, using mock fallback:', dbError.message);
        // Fallback: 如果 Supabase 挂了，直接返回一个基于手机号的 Mock 用户
        // 注意：这种情况下无法真正持久化新用户到数据库，但能让用户登录进去
        user = {
            id: 'mock-user-id-' + phone,
            phone,
            nickname: `User${phone.slice(-4)}`,
            avatar_url: 'https://via.placeholder.com/150',
            created_at: new Date().toISOString()
        };
        // 直接返回，跳过后续的 insert 逻辑（因为 insert 肯定也会挂）
        return res.json({
            token: 'mock-jwt-token-' + user.id,
            user
        });
    }

    // 如果用户不存在，创建新用户
    if (!user) {
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
         console.warn('Supabase create user failed, using mock fallback:', createError.message);
         user = {
            id: 'mock-user-id-' + phone,
            phone,
            nickname: `User${phone.slice(-4)}`,
            avatar_url: 'https://via.placeholder.com/150',
            created_at: new Date().toISOString()
        };
      }
    }

    // 返回用户信息
    // 在真实场景中，这里应该签发 JWT
    res.json({
      token: 'mock-jwt-token-' + user.id, // 暂时返回 mock token
      user
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
