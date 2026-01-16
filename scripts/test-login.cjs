
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testLogin(phone) {
  console.log(`Testing login for phone: ${phone}`);
  
  try {
    // 查找用户
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding user:', error);
      throw error;
    }

    if (user) {
        console.log('User found:', user);
    } else {
        console.log('User not found, creating...');
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
      
        if (createError) {
            console.error('Error creating user:', createError);
            throw createError;
        }
        console.log('User created:', newUser);
    }
  } catch (err) {
      console.error('Test failed:', err);
  }
}

testLogin('13800138000');
