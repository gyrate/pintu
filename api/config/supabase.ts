import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''; // Fallback to Anon Key if Service Role is missing (DANGEROUS but works for Vercel Hobby tier)

if (!supabaseUrl) {
  console.warn('Missing Supabase URL in environment variables.');
}

// 优先使用 Service Role Key，如果没有则回退到 Anon Key（注意：Anon Key 权限受限，可能无法执行某些管理操作）
const adminKey = supabaseServiceRoleKey || supabaseAnonKey || 'mock-key';
const safeUrl = supabaseUrl || 'https://mock.supabase.co';

// 如果没有 URL，createClient 会抛出错误导致应用崩溃，所以我们提供一个 mock URL
if (!supabaseUrl) {
    console.error('CRITICAL: Supabase URL is missing! Using mock URL to prevent crash.');
}

export const supabaseAdmin = createClient(safeUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 普通客户端（如果需要）
export const supabase = createClient(safeUrl, supabaseAnonKey || 'mock-key');
