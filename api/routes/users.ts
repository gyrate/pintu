import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
