import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inisialisasi Supabase khusus sisi server dengan Service Role Key
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default async function handler(req, res) {
  // Atur Header CORS agar aman
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. VERIFIKASI TOKEN ADMIN DARI FRONTEND
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Akses ditolak. Token otentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  
  // Validasi apakah user yang memanggil API ini benar-benar sedang login aktif
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Sesi login kedaluwarsa atau tidak valid.' });
  }

  // 2. PROSES OPERASI DATABASE (POST & DELETE)
  try {
    // A. JIKA OPERASI HAPUS DATA (DELETE)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'ID Lukisan diperlukan.' });

      const { error } = await supabaseServer
        .from('lukisan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Karya seni berhasil dihapus' });
    }

    // B. JIKA OPERASI SIMPAN / UBAH DATA (POST)
    if (req.method === 'POST') {
      const dataLukisan = req.body;

      if (dataLukisan.id) {
        // Jika ada ID, berarti mode UPDATE data lama
        const { error } = await supabaseServer
          .from('lukisan')
          .update({
            judul: dataLukisan.judul,
            kategori: dataLukisan.kategori,
            status: dataLukisan.status,
            ukuran: dataLukisan.ukuran,
            harga: dataLukisan.harga,
            media: dataLukisan.media,
            deskripsi: dataLukisan.deskripsi,
            is_featured: dataLukisan.is_featured
          })
          .eq('id', dataLukisan.id);

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Karya seni berhasil diperbarui' });
      } else {
        // Jika tidak ada ID, berarti INSERT data baru
        const { error } = await supabaseServer
          .from('lukisan')
          .insert([
            {
              judul: dataLukisan.judul,
              kategori: dataLukisan.kategori,
              status: dataLukisan.status,
              ukuran: dataLukisan.ukuran,
              harga: dataLukisan.harga,
              media: dataLukisan.media,
              deskripsi: dataLukisan.deskripsi,
              is_featured: dataLukisan.is_featured
            }
          ]);

        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Karya seni baru berhasil dikurasi' });
      }
    }

    return res.status(405).json({ success: false, error: 'Metode HTTP tidak diizinkan' });

  } catch (dbError) {
    console.error('Database Error:', dbError);
    return res.status(500).json({ success: false, error: dbError.message });
  }
}