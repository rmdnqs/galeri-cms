import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default async function handler(req, res) {
  // Setup CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metode tidak diizinkan' });
  }

  try {
    // Ambil semua daftar lukisan, urutkan dari yang terbaru (id terbesar)
    const { data, error } = await supabaseServer
      .from('lukisan')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, lukisan: data });
  } catch (err) {
    console.error('Error Ambil Data:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}