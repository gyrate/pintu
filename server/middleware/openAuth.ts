import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];
  
  let apiKey = '';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.split(' ')[1];
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader as string;
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key required. Use Authorization: Bearer <key> or X-API-Key header.' });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error) {
        console.warn(`API Key lookup failed for key: ${apiKey}, error: ${error.message}`);
        return res.status(403).json({ error: 'Invalid API Key' });
    }

    if (!user) {
        return res.status(403).json({ error: 'Invalid API Key (User not found)' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('API Key validation error:', err);
    return res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
