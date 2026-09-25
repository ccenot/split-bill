import process from 'node:process';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  process.loadEnvFile();
} catch (e) {
  // .env is optional
}

const app = express();
const PORT = process.env.PORT || 3380;

const ROUTE9_URL = process.env.ROUTE9_URL || 'http://localhost:20128/v1/chat/completions';
const ROUTE9_KEY = process.env.ROUTE9_KEY || '';
const ROUTE9_MODEL = process.env.ROUTE9_MODEL || 'ag/gemini-3.8-flash-high';
const ADMIN_PIN = process.env.ADMIN_PIN || '1819';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tmfvbkqdptkceolxzkvh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Enable CORS for Vercel and public API calls
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'splitbill-ocr-api' }));

// Middleware for Admin authentication
const requireAdmin = (req, res, next) => {
  const pin = req.headers['x-admin-pin'] || req.query.pin || req.body?.pin;
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ error: 'Akses ditolak: PIN Admin salah atau tidak ada.' });
  }
  next();
};

// Admin Login Check
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({ success: true, message: 'Login admin berhasil.' });
  }
  return res.status(401).json({ error: 'PIN Admin salah.' });
});

// Admin Get All Bills (dengan statistik & foto)
app.get('/api/admin/bills', requireAdmin, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client belum dikonfigurasi di server.' });
    }

    const { data: bills, error } = await supabaseAdmin
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalBills = bills.length;
    const totalWithImages = bills.filter(b => !!b.image_url).length;
    const totalAmount = bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    res.json({
      success: true,
      stats: {
        totalBills,
        totalWithImages,
        totalAmount
      },
      bills
    });
  } catch (err) {
    console.error('Admin get bills error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Bill & Purge its Image from Storage
app.delete('/api/admin/bills/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client belum dikonfigurasi di server.' });
    }

    // 1. Ambil info bill untuk cek apakah ada image_url
    const { data: bill, error: fetchErr } = await supabaseAdmin
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.warn('Fetch bill error before delete:', fetchErr);
    }

    // 2. Jika ada foto nota di Supabase Storage, hapus filenya agar hemat kuota storage
    if (bill && bill.image_url) {
      try {
        const parts = bill.image_url.split('/');
        const filename = parts[parts.length - 1];
        if (filename) {
          const { error: storageErr } = await supabaseAdmin.storage
            .from('receipts')
            .remove([filename]);
          if (storageErr) {
            console.warn('Storage purge warning:', storageErr);
          } else {
            console.log(`Purged receipt image: ${filename}`);
          }
        }
      } catch (storageException) {
        console.error('Failed to purge storage image:', storageException);
      }
    }

    // 3. Hapus data bill dari tabel bills
    const { data: deleted, error: deleteErr } = await supabaseAdmin
      .from('bills')
      .delete()
      .eq('id', id)
      .select();

    if (deleteErr) {
      return res.status(500).json({ error: deleteErr.message });
    }

    res.json({
      success: true,
      message: `Bill "${id}" dan foto struknya berhasil dihapus.`,
      deleted
    });
  } catch (err) {
    console.error('Admin delete bill error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// OCR endpoint via 9route (Gemini 3.8 Flash High)
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Gambar tidak ditemukan.' });
    }

    const prompt = `Kamu adalah OCR profesional untuk struk belanja / restoran di Indonesia.
Analisis foto struk ini dan ekstrak seluruh item dan rincian biaya dalam format JSON murni.
Format JSON yang wajib diikuti:
{
  "storeName": "Nama Toko / Resto (contoh: Kopi Kenangan, Mixue, Rumah Makan Padang)",
  "items": [
    {
      "name": "Nama Menu / Item",
      "qty": 1,
      "price": 25000
    }
  ],
  "taxAmount": 2500,
  "serviceAmount": 0,
  "discountAmount": 0,
  "roundingAmount": 0,
  "total": 27500
}

Aturan:
1. "price" adalah harga satuan (angka integer tanpa titik/koma/Rp).
2. "qty" adalah jumlah item (angka integer minimal 1).
3. "taxAmount" adalah nilai rupiah pajak/PB1/PPN jika ada. Jika tidak ada, isi 0.
4. "serviceAmount" adalah nilai rupiah biaya layanan/service jika ada. Jika tidak ada, isi 0.
5. "discountAmount" adalah potongan diskon jika ada. Jika tidak ada, isi 0.
6. "roundingAmount" adalah nilai pembulatan / rounding struk jika ada (angka integer, bisa positif atau negatif seperti -25 atau 50). Jika tidak ada, isi 0.
7. HANYA kembalikan JSON valid, dilarang menambahkan teks pengantar atau markdown block (\`\`\`json).`;

    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

    const payload = {
      model: ROUTE9_MODEL,
      stream: false,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: dataUri }
            }
          ]
        }
      ],
      temperature: 0.1
    };

    const aiResponse = await fetch(ROUTE9_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${ROUTE9_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('9route error:', aiResponse.status, errText);
      return res.status(500).json({ error: `9route API error: ${aiResponse.status}` });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'AI tidak mengembalikan hasil teks.' });
    }

    // Extract JSON from response (handles possible markdown formatting or reasoning output)
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    res.json({
      storeName: parsed.storeName || 'Struk Belanja',
      items: (parsed.items || []).map(item => ({
        id: 'item_' + Math.random().toString(36).substr(2, 9),
        name: item.name || 'Item',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
        assignedTo: []
      })),
      detectedSubtotal: 0,
      detectedTax: Number(parsed.taxAmount) || 0,
      detectedService: Number(parsed.serviceAmount) || 0,
      detectedDiscount: Number(parsed.discountAmount) || 0,
      detectedRounding: Number(parsed.roundingAmount) || 0,
      detectedTotal: Number(parsed.total) || 0,
      rawText: content
    });
  } catch (err) {
    console.error('OCR route error:', err);
    res.status(500).json({ error: err.message || 'Gagal memproses OCR struk.' });
  }
});

// Fallback SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Talangin Dulu listening on http://0.0.0.0:${PORT}`);
});
