import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rzgjifnilncydvurllnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUyMzE3MiwiZXhwIjoyMDg0MDk5MTcyfQ.OAmSttSaZ29fQuwPKPXSrRumYrwDma6fbmtlNQm0lWw';

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Supabase Data:', data);
  }
}

test();
