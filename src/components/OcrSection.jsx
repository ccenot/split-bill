import React, { useRef, useState } from 'react';
import { FolderOpen, Camera, Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { runTesseractOCR, runGeminiOCR } from '../utils/ocr';

export default function OcrSection({
  ocrEngine,
  setOcrEngine,
  onOcrSuccess,
  settings,
  receiptFile,
  onReceiptImageChange
}) {
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onReceiptImageChange) {
      onReceiptImageChange(file);
    }

    // Reset input agar bisa pilih file yang sama jika diinginkan
    e.target.value = '';

    setErrorMsg('');
    setLoading(true);
    setProgressMsg('Memulai pemindaian...');

    try {
      let result;
      if (ocrEngine === 'tesseract') {
        result = await runTesseractOCR(file, (msg) => setProgressMsg(msg));
      } else if (ocrEngine === 'gemini') {
        result = await runGeminiOCR(file, null, null, (msg) => setProgressMsg(msg));
      }

      if (result) {
        onOcrSuccess(result);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || 'Gagal memproses struk. Coba unggah ulang atau isi manual.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <section className="px-4 py-2">
      {/* Step Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 rounded-full bg-maroon-700 text-[#FAF4EB] text-xs font-mono font-bold flex items-center justify-center">
          1
        </span>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-maroon-800 m-0">
          FOTO STRUK (OPSIONAL, BISA LEBIH DARI SATU)
        </h2>
      </div>

      {/* OCR Engine Tabs (2 Columns) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => setOcrEngine('tesseract')}
          className={`py-1.5 px-2 text-xs font-mono font-semibold rounded border transition-all ${
            ocrEngine === 'tesseract'
              ? 'bg-maroon-700 text-[#FAF4EB] border-maroon-700 shadow-sm'
              : 'bg-transparent text-maroon-800 border-maroon-700/40 hover:bg-maroon-50'
          }`}
        >
          Tesseract.js (Offline/Free)
        </button>

        <button
          type="button"
          onClick={() => setOcrEngine('gemini')}
          className={`py-1.5 px-2 text-xs font-mono font-semibold rounded border transition-all ${
            ocrEngine === 'gemini'
              ? 'bg-maroon-700 text-[#FAF4EB] border-maroon-700 shadow-sm'
              : 'bg-transparent text-maroon-800 border-maroon-700/40 hover:bg-maroon-50'
          }`}
        >
          notnot AI
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 2 Dashed Action Boxes */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => galleryInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-maroon-700/50 rounded-lg bg-paper-50 hover:bg-maroon-50/40 active:scale-[0.98] transition-all text-maroon-800 cursor-pointer disabled:opacity-50"
        >
          <FolderOpen className="w-5 h-5 mb-1.5 text-maroon-700" />
          <span className="font-mono text-xs font-semibold text-center">
            Upload dari Galeri
          </span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-maroon-700/50 rounded-lg bg-paper-50 hover:bg-maroon-50/40 active:scale-[0.98] transition-all text-maroon-800 cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-5 h-5 mb-1.5 text-maroon-700" />
          <span className="font-mono text-xs font-semibold text-center">
            Ambil Foto (Kamera)
          </span>
        </button>
      </div>

      {/* Attached Receipt Image Indicator */}
      {receiptFile && (
        <div className="mb-3 p-2 bg-maroon-100/60 border border-maroon-700/30 rounded-lg flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden text-maroon-900">
            <ImageIcon className="w-4 h-4 text-maroon-700 flex-shrink-0" />
            <span className="truncate font-semibold">
              Foto Struk Terlampir: {receiptFile.name || 'struk.jpg'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onReceiptImageChange && onReceiptImageChange(null)}
            className="p-1 text-maroon-700 hover:text-red-700 transition"
            title="Hapus foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-3 p-3 bg-maroon-50 border border-maroon-200 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-maroon-700 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="font-mono text-xs font-semibold text-maroon-900">
              {progressMsg || 'Sedang memproses struk...'}
            </p>
            <p className="text-[11px] text-maroon-700/80">
              Mohon tunggu, browser sedang membaca teks struk.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMsg}</p>
            {(errorMsg.includes('API Key') || errorMsg.includes('roda gigi')) && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-maroon-700 font-bold underline mt-1 block"
              >
                Buka Pengaturan Sekarang
              </button>
            )}
          </div>
        </div>
      )}

      {/* Helper / Guide Texts */}
      <div className="space-y-1.5 text-[11px] text-maroon-900/75 leading-relaxed font-sans">
        <p>
          • <span className="font-semibold">OCR pakai {ocrEngine === 'tesseract' ? 'Tesseract.js (jalan di browser, offline & gratis)' : 'notnot AI (Vision cerdas & otomatis rapi)'}.</span> Hasil bacanya bisa dicek & diedit terlebih dahulu sebelum kalkulasi.
        </p>
        <p>
          • <span className="font-semibold">Mau split dari beberapa tempat?</span> Scan struk satu-satu — tiap struk jadi transaksi terpisah (carousel di bawah). Item, pajak, dan assignment per transaksi, tapi hasil hitungannya digabung jadi satu.
        </p>
      </div>
    </section>
  );
}
