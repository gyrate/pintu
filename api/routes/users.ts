import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

const router = Router();

// 重置用户密码
router.post('/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data: users, error, count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    res.json({
        list: users,
        total: count,
        page,
        pageSize
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const { phone, nickname, password, roles } = req.body;
    if (!phone || !nickname) {
        return res.status(400).json({ error: 'Phone and nickname are required' });
    }

    const newUser: any = {
        phone,
        nickname,
        avatar_url: 'https://via.placeholder.com/150',
        roles: roles || ['user']
    };

    if (password && password.length >= 6) {
        const salt = await bcrypt.genSalt(10);
        newUser.password_hash = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .insert([newUser])
        .select()
        .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nickname, phone, roles, api_key } = req.body;
        
        const updates: any = {};
        if (nickname) updates.nickname = nickname;
        if (phone) updates.phone = phone;
        if (roles) updates.roles = roles;
        if (api_key !== undefined) updates.api_key = api_key; // Allow clearing api_key with empty string or null

        console.log(`[UpdateUser] ID: ${id}, Body:`, req.body);
        console.log(`[UpdateUser] Updates object:`, updates);

        const { error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 删除用户
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
