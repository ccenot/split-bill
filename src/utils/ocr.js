// src/utils/ocr.js
import { createWorker } from 'tesseract.js';

/**
 * Parsing teks hasil Tesseract / OCR mentah menjadi item terstruktur
 */
export function parseReceiptRawText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let detectedSubtotal = 0;
  let detectedTax = 0;
  let detectedService = 0;
  let detectedDiscount = 0;
  let detectedRounding = 0;
  let detectedTotal = 0;
  let storeName = '';

  if (lines.length > 0) {
    // Baris pertama seringkali adalah nama toko/resto
    const firstLine = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    if (firstLine.length > 2 && firstLine.length < 35) {
      storeName = firstLine;
    }
  }

  const cleanPrice = (str) => {
    if (!str) return 0;
    // Hapus 'Rp', titik ribuan, atau koma desimal
    const sanitized = str.replace(/[rR][pP]\.?/g, '').trim();
    // Jika format 25.000 atau 25,000
    const numOnly = sanitized.replace(/[^0-9]/g, '');
    return parseInt(numOnly, 10) || 0;
  };

  const isMetaLine = (lineLower) => {
    return lineLower.includes('total') ||
      lineLower.includes('subtotal') ||
      lineLower.includes('sub total') ||
      lineLower.includes('pajak') ||
      lineLower.includes('tax') ||
      lineLower.includes('pb1') ||
      lineLower.includes('ppn') ||
      lineLower.includes('service') ||
      lineLower.includes('diskon') ||
      lineLower.includes('discount') ||
      lineLower.includes('rounding') ||
      lineLower.includes('pembulatan') ||
      lineLower.includes('round off') ||
      lineLower.includes('kembali') ||
      lineLower.includes('change') ||
      lineLower.includes('cash') ||
      lineLower.includes('tunai') ||
      lineLower.includes('debit') ||
      lineLower.includes('qris') ||
      lineLower.includes('terima kasih') ||
      lineLower.includes('thank you');
  };

  lines.forEach((line) => {
    const lineLower = line.toLowerCase();

    // Deteksi Pajak
    if (lineLower.includes('pajak') || lineLower.includes('tax') || lineLower.includes('pb1') || lineLower.includes('ppn')) {
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/);
      if (match) detectedTax = cleanPrice(match[0]);
      return;
    }

    // Deteksi Service
    if (lineLower.includes('service') || lineLower.includes('sc ')) {
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/);
      if (match) detectedService = cleanPrice(match[0]);
      return;
    }

    // Deteksi Diskon
    if (lineLower.includes('diskon') || lineLower.includes('discount') || lineLower.includes('potongan')) {
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/);
      if (match) detectedDiscount = cleanPrice(match[0]);
      return;
    }

    // Deteksi Rounding / Pembulatan (bisa negatif atau positif, misal: "Rounding -25" atau "Pembulatan 50")
    if (lineLower.includes('rounding') || lineLower.includes('pembulatan') || lineLower.includes('round off') || lineLower.includes('round-off')) {
      const isNegative = line.includes('-') || lineLower.includes('minus');
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{1,7})/);
      if (match) {
        const val = cleanPrice(match[0]);
        detectedRounding = isNegative ? -val : val;
      }
      return;
    }

    // Deteksi Subtotal
    if (lineLower.includes('subtotal') || lineLower.includes('sub total')) {
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/);
      if (match) detectedSubtotal = cleanPrice(match[0]);
      return;
    }

    // Deteksi Grand Total
    if (lineLower.includes('grand total') || (lineLower.includes('total') && !lineLower.includes('sub'))) {
      const match = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})/);
      if (match) detectedTotal = cleanPrice(match[0]);
      return;
    }

    // Lewati baris metadata lainnya
    if (isMetaLine(lineLower)) return;

    // Deteksi Pola Item: "2 Nasi Goreng 35.000" atau "Nasi Goreng 1x 25000" atau "Kopi Susu 18.000"
    const priceMatch = line.match(/(?:[rR][pP]\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,7})(?:\s*)$/);
    if (priceMatch) {
      const priceStr = priceMatch[1];
      const price = cleanPrice(priceStr);

      let itemDesc = line.substring(0, priceMatch.index).trim();
      let qty = 1;

      // Cek qty di awal (misal: "2x " atau "2 ")
      const qtyStartMatch = itemDesc.match(/^(\d{1,2})\s*[xX]?\s+/);
      if (qtyStartMatch) {
        qty = parseInt(qtyStartMatch[1], 10);
        itemDesc = itemDesc.substring(qtyStartMatch[0].length).trim();
      } else {
        // Cek qty di akhir sebelum harga (misal: "x2" atau "@15000")
        const qtyEndMatch = itemDesc.match(/\s+[xX@]\s*(\d{1,2})$/);
        if (qtyEndMatch) {
          qty = parseInt(qtyEndMatch[1], 10);
          itemDesc = itemDesc.substring(0, qtyEndMatch.index).trim();
        }
      }

      // Bersihkan nama item
      itemDesc = itemDesc.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9\s()&/-]+$/, '').trim();

      if (itemDesc.length > 1 && price > 0 && price < 10000000) {
        items.push({
          id: 'item_' + Math.random().toString(36).substr(2, 9),
          name: itemDesc,
          qty: qty || 1,
          price: Math.round(price / (qty || 1)), // harga satuan
          assignedTo: []
        });
      }
    }
  });

  return {
    storeName: storeName || 'Transaksi Struk',
    items,
    detectedSubtotal,
    detectedTax,
    detectedService,
    detectedDiscount,
    detectedRounding,
    detectedTotal,
    rawText
  };
}

/**
 * Eksekusi Tesseract.js OCR di client browser
 */
export async function runTesseractOCR(file, onProgress) {
  const worker = await createWorker('ind+eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        const percent = Math.round((m.progress || 0) * 100);
        onProgress(`Membaca karakter struk... ${percent}%`);
      } else if (onProgress && m.status) {
        onProgress(`Inisialisasi OCR (${m.status})...`);
      }
    }
  });

  try {
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return parseReceiptRawText(text);
  } catch (err) {
    await worker.terminate();
    throw err;
  }
}

/**
 * Konversi File objek ke Base64 Data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        mimeType: file.type || 'image/jpeg',
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Eksekusi Gemini AI Vision OCR (Menggunakan 9route ag/gemini-3.8-flash-high)
 */
export async function runGeminiOCR(file, apiKey, model, onProgress) {
  if (onProgress) onProgress('Menyiapkan gambar struk...');
  const { mimeType, data: base64Data } = await fileToBase64(file);

  if (onProgress) onProgress('Membaca struk via Gemini 3.8 Flash High (9route)...');

  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64Data,
      mimeType: mimeType
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server OCR error: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result;
}
